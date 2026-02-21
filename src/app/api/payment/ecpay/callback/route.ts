export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyCallbackCheckMacValue } from '@/lib/ecpay';
import { cache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    // 解析 application/x-www-form-urlencoded body
    const text = await req.text();
    const params: Record<string, string> = {};
    for (const pair of text.split('&')) {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }

    console.log('[ECPay Callback] Received params:', JSON.stringify(params));

    // 驗證 CheckMacValue
    if (!verifyCallbackCheckMacValue(params)) {
      console.error('[ECPay Callback] CheckMacValue verification failed');
      return new NextResponse('0|CheckMacValue Error', { status: 200 });
    }

    // 取得完整訂單編號（存在 CustomField1）
    const orderNumber = params.CustomField1 || params.MerchantTradeNo;
    const rtnCode = params.RtnCode;
    const tradeAmount = parseInt(params.TradeAmt || '0', 10);

    if (!orderNumber) {
      console.error('[ECPay Callback] Missing order number');
      return new NextResponse('0|Missing OrderNumber', { status: 200 });
    }

    // 查詢訂單
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { user: true },
    });

    if (!order) {
      console.error('[ECPay Callback] Order not found:', orderNumber);
      return new NextResponse('0|Order Not Found', { status: 200 });
    }

    // 冪等性：已處理的訂單直接回 1|OK
    if (order.status === 'completed' || order.status === 'paid') {
      console.log('[ECPay Callback] Order already processed:', orderNumber);
      return new NextResponse('1|OK', { status: 200 });
    }

    // 金額比對（防篡改）
    if (tradeAmount !== order.amount) {
      console.error('[ECPay Callback] Amount mismatch:', { expected: order.amount, received: tradeAmount });
      return new NextResponse('0|Amount Mismatch', { status: 200 });
    }

    // 付款失敗
    if (rtnCode !== '1') {
      console.log('[ECPay Callback] Payment failed, RtnCode:', rtnCode);
      await prisma.order.update({
        where: { orderNumber },
        data: {
          status: 'failed',
          paymentMethod: 'ecpay',
          paymentInfo: JSON.stringify({
            rtnCode,
            rtnMsg: params.RtnMsg,
            paymentType: params.PaymentType,
            tradeNo: params.TradeNo,
          }),
        },
      });
      return new NextResponse('1|OK', { status: 200 });
    }

    // 付款成功 — 使用 Prisma $transaction 確保原子性
    await prisma.$transaction(async (tx) => {
      // 更新訂單 pending → paid
      await tx.order.update({
        where: { orderNumber },
        data: {
          status: 'paid',
          paymentMethod: 'ecpay',
          paymentInfo: JSON.stringify({
            rtnCode,
            rtnMsg: params.RtnMsg,
            paymentType: params.PaymentType,
            tradeNo: params.TradeNo,
            paymentDate: params.PaymentDate,
          }),
          paidAt: new Date(),
        },
      });

      // 加點數到 user.points
      const newBalance = order.user.points + order.totalPoints;
      await tx.user.update({
        where: { id: order.userId },
        data: { points: newBalance },
      });

      // 建立 PointTransaction — 基礎點數
      await tx.pointTransaction.create({
        data: {
          userId: order.userId,
          type: 'purchase',
          amount: order.basePoints,
          balance: order.user.points + order.basePoints,
          description: `購買點數 - ${order.packageName}`,
          relatedId: orderNumber,
        },
      });

      // 建立 PointTransaction — 贈送點數（如果有）
      if (order.bonusPoints > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: order.userId,
            type: 'bonus',
            amount: order.bonusPoints,
            balance: newBalance,
            description: `購買贈送 - ${order.packageName}`,
            relatedId: orderNumber,
          },
        });
      }

      // 更新訂單為已完成
      await tx.order.update({
        where: { orderNumber },
        data: { status: 'completed' },
      });
    });

    // 清除快取
    cache.clear(`user:profile:${order.userId}`);
    cache.clearByPrefix(`orders:${order.userId}`);

    console.log('[ECPay Callback] Payment completed for order:', orderNumber);
    return new NextResponse('1|OK', { status: 200 });
  } catch (error) {
    console.error('[ECPay Callback] Error:', error);
    return new NextResponse('0|Server Error', { status: 200 });
  }
}

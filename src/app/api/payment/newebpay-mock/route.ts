import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cache } from '@/lib/cache';

// 藍新金流模擬 API - 用於測試環境
// 在真實環境中，這應該替換為實際的藍新金流 API 串接

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, amount } = body;

    if (!orderNumber || !amount) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 查找訂單
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: '訂單不存在' },
        { status: 404 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: '訂單狀態不正確' },
        { status: 400 }
      );
    }

    if (order.amount !== amount) {
      return NextResponse.json(
        { error: '金額不符' },
        { status: 400 }
      );
    }

    // 模擬付款成功 - 更新訂單狀態
    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: 'paid',
        paymentMethod: 'newebpay_mock',
        paymentInfo: JSON.stringify({
          mockPayment: true,
          timestamp: new Date().toISOString()
        }),
        paidAt: new Date()
      }
    });

    // 更新用戶點數
    const newBalance = order.user.points + order.totalPoints;
    await prisma.user.update({
      where: { id: order.userId },
      data: { points: newBalance }
    });

    // 記錄點數異動 - 基礎點數
    await prisma.pointTransaction.create({
      data: {
        userId: order.userId,
        type: 'purchase',
        amount: order.basePoints,
        balance: order.user.points + order.basePoints,
        description: `購買點數 - ${order.packageName}`,
        relatedId: orderNumber
      }
    });

    // 記錄點數異動 - 贈送點數（如果有）
    if (order.bonusPoints > 0) {
      await prisma.pointTransaction.create({
        data: {
          userId: order.userId,
          type: 'bonus',
          amount: order.bonusPoints,
          balance: newBalance,
          description: `購買贈送 - ${order.packageName}`,
          relatedId: orderNumber
        }
      });
    }

    // 更新訂單為已完成
    await prisma.order.update({
      where: { orderNumber },
      data: { status: 'completed' }
    });

    // 清除用戶快取，確保下次請求時取得最新點數
    cache.clear(`user:profile:${order.userId}`);

    return NextResponse.json({
      success: true,
      message: '付款成功',
      order: updatedOrder,
      newBalance
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: '付款處理失敗' },
      { status: 500 }
    );
  }
}

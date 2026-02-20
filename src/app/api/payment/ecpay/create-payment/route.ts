import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { buildPaymentFormData } from '@/lib/ecpay';

export async function POST(req: NextRequest) {
  try {
    // 驗證使用者身份
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '登入已過期，請重新登入' }, { status: 401 });
    }

    const body = await req.json();
    const { orderNumber } = body;

    if (!orderNumber) {
      return NextResponse.json({ error: '缺少訂單編號' }, { status: 400 });
    }

    // 查詢訂單（必須是 pending + 屬於該使用者）
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    }

    if (order.userId !== payload.userId) {
      return NextResponse.json({ error: '無權操作此訂單' }, { status: 403 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '訂單狀態不正確' }, { status: 400 });
    }

    // 組合綠界表單參數
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const result = buildPaymentFormData({
      orderNumber: order.orderNumber,
      amount: order.amount,
      itemName: `${order.packageName} - ${order.totalPoints} 點`,
      returnUrl: `${baseUrl}/api/payment/ecpay/callback`,
      clientBackUrl: `${baseUrl}/payment/result?orderNumber=${order.orderNumber}`,
    });

    return NextResponse.json({
      formData: result.formData,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    console.error('ECPay create-payment error:', error);
    return NextResponse.json({ error: '建立付款失敗' }, { status: 500 });
  }
}

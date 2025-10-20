import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';

// 點數方案配置
const POINT_PACKAGES = [
  { id: 1, name: '入門方案', points: 100, price: 100, bonus: 0 },
  { id: 2, name: '基礎方案', points: 500, price: 500, bonus: 50 },
  { id: 3, name: '熱門方案', points: 1000, price: 1000, bonus: 150 },
  { id: 4, name: '超值方案', points: 2000, price: 2000, bonus: 400 },
  { id: 5, name: '豪華方案', points: 5000, price: 5000, bonus: 1200 },
  { id: 6, name: '至尊方案', points: 10000, price: 10000, bonus: 3000 },
];

function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    // 從請求中獲取 token
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    // 驗證 token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '登入已過期，請重新登入' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: '缺少方案 ID' },
        { status: 400 }
      );
    }

    // 查找方案
    const pkg = POINT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: '方案不存在' },
        { status: 404 }
      );
    }

    // 生成訂單編號
    const orderNumber = generateOrderNumber();

    // 創建訂單
    const order = await prisma.order.create({
      data: {
        userId: payload.userId,
        orderNumber,
        packageName: pkg.name,
        basePoints: pkg.points,
        bonusPoints: pkg.bonus,
        totalPoints: pkg.points + pkg.bonus,
        amount: pkg.price,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        packageName: order.packageName,
        basePoints: order.basePoints,
        bonusPoints: order.bonusPoints,
        totalPoints: order.totalPoints,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: '訂單創建失敗' },
      { status: 500 }
    );
  }
}

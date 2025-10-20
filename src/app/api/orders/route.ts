import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { Prisma, OrderStatus } from '@prisma/client';

// 獲取用戶訂單列表
export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // 構建查詢條件
    const where: Prisma.OrderWhereInput = { userId: payload.userId };
    if (status) {
      where.status = status as OrderStatus;
    }

    // 查詢訂單
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      orders,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: '查詢訂單失敗' },
      { status: 500 }
    );
  }
}

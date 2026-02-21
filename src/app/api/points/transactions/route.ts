export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { Prisma, PointTransactionType } from '@prisma/client';
import { cache } from '@/lib/cache';

// 獲取用戶點數異動記錄
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
    const type = searchParams.get('type');

    // 構建查詢條件
    const where: Prisma.PointTransactionWhereInput = { userId: payload.userId };
    if (type) {
      where.type = type as PointTransactionType;
    }

    const cacheKey = `transactions:${payload.userId}:${type || 'all'}:${limit}:${offset}`;
    const result = await cache.getOrSet(cacheKey, async () => {
      // 查詢點數異動記錄
      const [transactions, total] = await Promise.all([
        prisma.pointTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.pointTransaction.count({ where })
      ]);
      return { transactions, total, limit, offset };
    }, 10000); // 快取 10 秒

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: '查詢異動記錄失敗' },
      { status: 500 }
    );
  }
}

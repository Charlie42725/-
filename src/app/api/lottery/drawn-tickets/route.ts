import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cache } from '@/lib/cache';

// 獲取商品的已抽號碼
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '缺少商品 ID' },
        { status: 400 }
      );
    }

    const drawnTickets = await cache.getOrSet(
      `drawn-tickets:${productId}`,
      () => prisma.lotteryDraw.findMany({
        where: {
          productId: parseInt(productId)
        },
        include: {
          variant: true,
          user: {
            select: {
              id: true,
              nickname: true
            }
          }
        },
        orderBy: {
          ticketNumber: 'asc'
        }
      }),
      10000 // 10 秒快取（抽獎資料需要較即時）
    );

    return NextResponse.json({
      drawnTickets
    });

  } catch (error) {
    console.error('Get drawn tickets error:', error);
    return NextResponse.json(
      { error: '查詢失敗' },
      { status: 500 }
    );
  }
}

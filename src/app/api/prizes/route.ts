import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { cache } from '@/lib/cache';

// GET /api/prizes - 獲取當前用戶的所有獎品（未兌換的）
export async function GET(request: NextRequest) {
  try {
    // 驗證用戶身份
    const authResult = await verifyUser(request.headers);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.payload.userId;

    const cacheKey = `prizes:${userId}`;
    const result = await cache.getOrSet(cacheKey, async () => {
      // 查詢用戶所有未兌換的獎品
      const prizes = await prisma.lotteryDraw.findMany({
        where: {
          userId,
          isRedeemed: false,
        },
        select: {
          id: true,
          ticketNumber: true,
          isLastPrize: true,
          triggeredPity: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              coverImage: true,
              series: {
                select: {
                  id: true,
                  name: true,
                  brand: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              prize: true,
              name: true,
              rarity: true,
              value: true,
              imageUrl: true,
              isLastPrize: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 計算總價值
      const totalValue = prizes.reduce((sum, prize) => sum + prize.variant.value, 0);

      return {
        prizes: prizes.map(prize => ({
          id: prize.id,
          ticketNumber: prize.ticketNumber,
          createdAt: prize.createdAt,
          product: prize.product,
          variant: prize.variant,
          isLastPrize: prize.isLastPrize,
          triggeredPity: prize.triggeredPity,
        })),
        totalValue,
        count: prizes.length,
      };
    }, 10000); // 快取 10 秒

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prizes' },
      { status: 500 }
    );
  }
}

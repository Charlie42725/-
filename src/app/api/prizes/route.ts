import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import prisma from '@/lib/db';

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

    // 查詢用戶所有未兌換的獎品
    const prizes = await prisma.lotteryDraw.findMany({
      where: {
        userId,
        isRedeemed: false,
      },
      include: {
        product: {
          include: {
            series: {
              include: {
                brand: true,
              },
            },
          },
        },
        variant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 計算總價值
    const totalValue = prizes.reduce((sum, prize) => sum + prize.variant.value, 0);

    return NextResponse.json({
      prizes: prizes.map(prize => ({
        id: prize.id,
        ticketNumber: prize.ticketNumber,
        createdAt: prize.createdAt,
        product: {
          id: prize.product.id,
          name: prize.product.name,
          slug: prize.product.slug,
          coverImage: prize.product.coverImage,
          series: prize.product.series,
        },
        variant: {
          id: prize.variant.id,
          prize: prize.variant.prize,
          name: prize.variant.name,
          rarity: prize.variant.rarity,
          value: prize.variant.value,
          imageUrl: prize.variant.imageUrl,
          isLastPrize: prize.variant.isLastPrize,
        },
        isLastPrize: prize.isLastPrize,
        triggeredPity: prize.triggeredPity,
      })),
      totalValue,
      count: prizes.length,
    });
  } catch (error) {
    console.error('Error fetching prizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prizes' },
      { status: 500 }
    );
  }
}

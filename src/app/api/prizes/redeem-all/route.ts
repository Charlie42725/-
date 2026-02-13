import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/prizes/redeem-all - 一鍵兌換所有獎品為點數
export async function POST(request: NextRequest) {
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

    // 使用 transaction 確保資料一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 獲取所有未兌換的獎品（只取需要的欄位）
      const unredeemedPrizes = await tx.lotteryDraw.findMany({
        where: {
          userId,
          isRedeemed: false,
        },
        select: {
          id: true,
          variant: {
            select: {
              prize: true,
              name: true,
              value: true,
            },
          },
        },
      });

      if (unredeemedPrizes.length === 0) {
        throw new Error('No prizes to redeem');
      }

      // 2. 計算總點數
      const totalPoints = unredeemedPrizes.reduce(
        (sum, prize) => sum + prize.variant.value,
        0
      );

      // 3. 批量更新獎品狀態為已兌換
      await tx.lotteryDraw.updateMany({
        where: {
          userId,
          isRedeemed: false,
        },
        data: {
          isRedeemed: true,
        },
      });

      // 4. 更新用戶點數
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: totalPoints,
          },
        },
      });

      // 5. 創建批量兌換的點數交易記錄
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'redemption',
          amount: totalPoints,
          balance: updatedUser.points,
          description: `批量兌換 ${unredeemedPrizes.length} 個獎品`,
          relatedId: 'batch_redemption',
        },
      });

      // 6. 批量創建兌換記錄（使用 createMany 取代逐一 create）
      await tx.prizeRedemption.createMany({
        data: unredeemedPrizes.map((prize) => ({
          userId,
          lotteryDrawId: prize.id,
          prizeValue: prize.variant.value,
          pointsReceived: prize.variant.value,
        })),
      });

      return {
        count: unredeemedPrizes.length,
        totalPoints,
        newBalance: updatedUser.points,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${result.count} prizes`,
      count: result.count,
      totalPoints: result.totalPoints,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error('Error redeeming all prizes:', error);

    if (error instanceof Error && error.message === 'No prizes to redeem') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to redeem prizes' },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/prizes/redeem - 兌換獎品為點數
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
    const body = await request.json();
    const { lotteryDrawId } = body;

    if (!lotteryDrawId) {
      return NextResponse.json(
        { error: 'Missing lotteryDrawId' },
        { status: 400 }
      );
    }

    // 使用 transaction 確保資料一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 檢查獎品是否存在且屬於該用戶
      const lotteryDraw = await tx.lotteryDraw.findFirst({
        where: {
          id: lotteryDrawId,
          userId,
          isRedeemed: false,
        },
        include: {
          variant: true,
          product: {
            include: {
              brand: true,
            },
          },
        },
      });

      if (!lotteryDraw) {
        throw new Error('Prize not found or already redeemed');
      }

      // 2. 計算兌換點數（這裡使用獎品價值作為兌換點數）
      const pointsToReceive = lotteryDraw.variant.value;

      // 3. 更新獎品狀態為已兌換
      await tx.lotteryDraw.update({
        where: { id: lotteryDrawId },
        data: { isRedeemed: true },
      });

      // 4. 更新用戶點數
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: pointsToReceive,
          },
        },
      });

      // 5. 創建點數交易記錄
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'redemption',
          amount: pointsToReceive,
          balance: updatedUser.points,
          description: `兌換獎品：${lotteryDraw.variant.prize} - ${lotteryDraw.variant.name}`,
          relatedId: lotteryDrawId.toString(),
        },
      });

      // 6. 創建兌換記錄
      const redemption = await tx.prizeRedemption.create({
        data: {
          userId,
          lotteryDrawId,
          prizeValue: lotteryDraw.variant.value,
          pointsReceived: pointsToReceive,
        },
      });

      return {
        redemption,
        pointsReceived: pointsToReceive,
        newBalance: updatedUser.points,
        prize: {
          variant: lotteryDraw.variant,
          product: lotteryDraw.product,
        },
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Prize redeemed successfully',
      pointsReceived: result.pointsReceived,
      newBalance: result.newBalance,
      redemption: result.redemption,
    });
  } catch (error) {
    console.error('Error redeeming prize:', error);

    if (error instanceof Error && error.message === 'Prize not found or already redeemed') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to redeem prize' },
      { status: 500 }
    );
  }
}

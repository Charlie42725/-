import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { cache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    // 驗證用戶登入
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '登入已過期，請重新登入' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, ticketNumbers } = body;

    if (!productId || !ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
      return NextResponse.json(
        { error: '參數錯誤' },
        { status: 400 }
      );
    }

    // 使用交易確保數據一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 獲取商品資訊（包含已抽數量統計）
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          variants: {
            include: {
              _count: {
                select: {
                  lotteryDraws: true
                }
              }
            }
          }
        }
      });

      if (!product) {
        throw new Error('商品不存在');
      }

      if (product.status !== 'active') {
        throw new Error('商品未開放抽獎');
      }

      // 2. 獲取用戶資訊
      const user = await tx.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new Error('用戶不存在');
      }

      // 3. 計算所需點數
      const totalPointsNeeded = product.price * ticketNumbers.length;

      // 4. 檢查點數是否足夠
      if (user.points < totalPointsNeeded) {
        throw new Error(`點數不足。需要 ${totalPointsNeeded} 點，目前僅有 ${user.points} 點`);
      }

      // 5. 檢查號碼是否已被抽走
      const existingDraws = await tx.lotteryDraw.findMany({
        where: {
          productId,
          ticketNumber: { in: ticketNumbers }
        }
      });

      if (existingDraws.length > 0) {
        const drawnNumbers = existingDraws.map(d => d.ticketNumber);
        throw new Error(`號碼 ${drawnNumbers.join(', ')} 已被抽走`);
      }

      // 6. 檢查號碼是否超出範圍
      const invalidNumbers = ticketNumbers.filter(n => n < 1 || n > product.totalTickets);
      if (invalidNumbers.length > 0) {
        throw new Error(`無效的號碼: ${invalidNumbers.join(', ')}`);
      }

      // 7. 生成獎項分配（隨機分配）
      // stock 現在代表初始總數，剩餘數量 = stock - _count.lotteryDraws
      const draws: Array<{
        userId: number;
        productId: number;
        variantId: number;
        ticketNumber: number;
        pointsUsed: number;
      }> = [];

      // 計算每個獎項的剩餘數量並創建可用獎項池
      const variantsWithRemaining = product.variants.map(v => ({
        ...v,
        remaining: v.stock - (v._count?.lotteryDraws || 0)
      })).filter(v => v.remaining > 0);

      if (variantsWithRemaining.length === 0) {
        throw new Error('所有獎項已全部抽完');
      }

      // 建立獎項池（根據剩餘數量）
      const variantsPool: typeof variantsWithRemaining = [...variantsWithRemaining];

      for (const ticketNumber of ticketNumbers) {
        // 隨機選擇一個還有庫存的獎項
        if (variantsPool.length === 0) {
          throw new Error('獎項已全部抽完');
        }

        const randomIndex = Math.floor(Math.random() * variantsPool.length);
        const selectedVariant = variantsPool[randomIndex];

        draws.push({
          userId: payload.userId,
          productId,
          variantId: selectedVariant.id,
          ticketNumber,
          pointsUsed: product.price
        });

        // 減少該獎項的剩餘數量（僅在記憶體中）
        selectedVariant.remaining--;
        if (selectedVariant.remaining === 0) {
          variantsPool.splice(randomIndex, 1);
        }
      }

      // 8. 創建抽獎記錄（不再更新 stock 欄位）
      await tx.lotteryDraw.createMany({
        data: draws
      });

      // 9. 更新商品已售出數量，並檢查是否需要更新為完售狀態
      const newSoldTickets = product.soldTickets + ticketNumbers.length;
      const shouldMarkAsSoldOut = newSoldTickets >= product.totalTickets;

      await tx.product.update({
        where: { id: productId },
        data: {
          soldTickets: newSoldTickets,
          // 如果已全部售出且當前狀態是 active，則更新為 sold_out
          ...(shouldMarkAsSoldOut && product.status === 'active' ? { status: 'sold_out' } : {})
        }
      });

      // 10. 扣除用戶點數
      const newBalance = user.points - totalPointsNeeded;
      await tx.user.update({
        where: { id: payload.userId },
        data: { points: newBalance }
      });

      // 11. 記錄點數異動
      await tx.pointTransaction.create({
        data: {
          userId: payload.userId,
          type: 'lottery',
          amount: -totalPointsNeeded,
          balance: newBalance,
          description: `一番賞抽獎 - ${product.name}（抽取 ${ticketNumbers.length} 次）`,
          relatedId: productId.toString()
        }
      });

      // 12. 獲取完整的抽獎結果
      const results = await tx.lotteryDraw.findMany({
        where: {
          productId,
          ticketNumber: { in: ticketNumbers }
        },
        include: {
          variant: true
        },
        orderBy: {
          ticketNumber: 'asc'
        }
      });

      return {
        results,
        newBalance,
        pointsUsed: totalPointsNeeded
      };
    });

    // 清除用戶快取，確保下次請求時取得最新點數
    cache.clear(`user:profile:${payload.userId}`);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Lottery draw error:', error);
    const errorMessage = error instanceof Error ? error.message : '抽獎失敗';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

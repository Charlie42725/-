import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';

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
      // 1. 獲取商品資訊
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { variants: true }
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
      const draws: Array<{
        userId: number;
        productId: number;
        variantId: number;
        ticketNumber: number;
        pointsUsed: number;
      }> = [];
      const variantsPool = product.variants.filter(v => v.stock > 0);

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

        // 減少該獎項庫存
        selectedVariant.stock--;
        if (selectedVariant.stock === 0) {
          variantsPool.splice(randomIndex, 1);
        }
      }

      // 8. 創建抽獎記錄
      await tx.lotteryDraw.createMany({
        data: draws
      });

      // 9. 更新獎項庫存
      for (const variant of product.variants) {
        const variantInPool = variantsPool.find(v => v.id === variant.id);
        const newStock = variantInPool ? variantInPool.stock : 0;

        if (newStock !== variant.stock) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: newStock }
          });
        }
      }

      // 10. 更新商品已售出數量
      await tx.product.update({
        where: { id: productId },
        data: {
          soldTickets: {
            increment: ticketNumbers.length
          }
        }
      });

      // 11. 扣除用戶點數
      const newBalance = user.points - totalPointsNeeded;
      await tx.user.update({
        where: { id: payload.userId },
        data: { points: newBalance }
      });

      // 12. 記錄點數異動
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

      // 13. 獲取完整的抽獎結果
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

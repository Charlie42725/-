export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { completeSession } from '@/lib/queue-manager';

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

    // 排隊驗證：一次查詢同時取得 queue count 和 active entry
    const activeEntry = await prisma.drawQueue.findFirst({
      where: { productId, status: { in: ['waiting', 'active'] } },
      orderBy: { status: 'asc' }, // 'active' 排前面
    });

    if (activeEntry) {
      // 有排隊記錄 → 檢查是否是當前用戶的 active
      if (activeEntry.userId !== payload.userId || activeEntry.status !== 'active') {
        // 不是自己的 active，再確認自己有沒有 active
        const myActive = activeEntry.userId === payload.userId ? activeEntry : await prisma.drawQueue.findFirst({
          where: { productId, userId: payload.userId, status: 'active' },
        });

        if (!myActive) {
          return NextResponse.json(
            { error: '請先排隊等待您的回合', requireQueue: true },
            { status: 403 }
          );
        }

        if (myActive.expiresAt && myActive.expiresAt < new Date()) {
          return NextResponse.json(
            { error: '您的抽獎時間已過期', sessionExpired: true },
            { status: 403 }
          );
        }
      } else if (activeEntry.expiresAt && activeEntry.expiresAt < new Date()) {
        return NextResponse.json(
          { error: '您的抽獎時間已過期', sessionExpired: true },
          { status: 403 }
        );
      }
    }

    // 使用交易確保數據一致性
    const result = await prisma.$transaction(async (tx) => {
      // 並行獲取：商品 + 用戶 + 已抽號碼檢查
      const [product, user, existingDraws] = await Promise.all([
        tx.product.findUnique({
          where: { id: productId },
          include: {
            variants: {
              where: { isActive: true },
              select: {
                id: true,
                prize: true,
                name: true,
                rarity: true,
                value: true,
                stock: true,
                imageUrl: true,
                _count: { select: { lotteryDraws: true } }
              }
            }
          }
        }),
        tx.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, points: true }
        }),
        tx.lotteryDraw.findMany({
          where: { productId, ticketNumber: { in: ticketNumbers } },
          select: { ticketNumber: true }
        })
      ]);

      if (!product) throw new Error('商品不存在');
      if (product.status !== 'active') throw new Error('商品未開放抽獎');
      if (!user) throw new Error('用戶不存在');

      // 計算所需點數
      const totalPointsNeeded = product.price * ticketNumbers.length;
      if (user.points < totalPointsNeeded) {
        throw new Error(`點數不足。需要 ${totalPointsNeeded} 點，目前僅有 ${user.points} 點`);
      }

      // 檢查號碼是否已被抽走
      if (existingDraws.length > 0) {
        throw new Error(`號碼 ${existingDraws.map(d => d.ticketNumber).join(', ')} 已被抽走`);
      }

      // 檢查號碼是否超出範圍
      const invalidNumbers = ticketNumbers.filter((n: number) => n < 1 || n > product.totalTickets);
      if (invalidNumbers.length > 0) {
        throw new Error(`無效的號碼: ${invalidNumbers.join(', ')}`);
      }

      // 計算每個獎項的剩餘數量
      const variantsWithRemaining = product.variants
        .map(v => ({
          ...v,
          remaining: v.stock - (v._count?.lotteryDraws || 0)
        }))
        .filter(v => v.remaining > 0);

      if (variantsWithRemaining.length === 0) {
        throw new Error('所有獎項已全部抽完');
      }

      const totalRemaining = variantsWithRemaining.reduce((sum, v) => sum + v.remaining, 0);
      if (totalRemaining < ticketNumbers.length) {
        throw new Error(`獎項庫存不足，目前僅剩 ${totalRemaining} 個獎項`);
      }

      // 加權隨機抽取（不展開 pool，直接用 remaining 做權重）
      const draws: Array<{
        userId: number;
        productId: number;
        variantId: number;
        ticketNumber: number;
        pointsUsed: number;
      }> = [];

      // 複製一份 remaining 追蹤本次抽獎中的消耗
      const remainingTracker = new Map(variantsWithRemaining.map(v => [v.id, v.remaining]));

      for (let i = 0; i < ticketNumbers.length; i++) {
        // 計算當前總權重
        let totalWeight = 0;
        for (const r of remainingTracker.values()) {
          totalWeight += r;
        }

        // 加權隨機選取
        let random = Math.random() * totalWeight;
        let selectedVariant = variantsWithRemaining[0];

        for (const v of variantsWithRemaining) {
          const rem = remainingTracker.get(v.id) || 0;
          if (rem <= 0) continue;
          random -= rem;
          if (random <= 0) {
            selectedVariant = v;
            break;
          }
        }

        // 扣除追蹤器中的數量
        remainingTracker.set(selectedVariant.id, (remainingTracker.get(selectedVariant.id) || 1) - 1);

        draws.push({
          userId: payload.userId,
          productId,
          variantId: selectedVariant.id,
          ticketNumber: ticketNumbers[i],
          pointsUsed: product.price
        });
      }

      // 並行寫入：抽獎記錄 + 更新商品 + 扣點數 + 記錄異動
      const newSoldTickets = product.soldTickets + ticketNumbers.length;
      const shouldMarkAsSoldOut = newSoldTickets >= product.totalTickets;
      const newBalance = user.points - totalPointsNeeded;

      await Promise.all([
        tx.lotteryDraw.createMany({ data: draws }),
        tx.product.update({
          where: { id: productId },
          data: {
            soldTickets: newSoldTickets,
            ...(shouldMarkAsSoldOut && product.status === 'active' ? { status: 'sold_out' } : {})
          }
        }),
        tx.user.update({
          where: { id: payload.userId },
          data: { points: newBalance }
        }),
        tx.pointTransaction.create({
          data: {
            userId: payload.userId,
            type: 'lottery',
            amount: -totalPointsNeeded,
            balance: newBalance,
            description: `一番賞抽獎 - ${product.name}（抽取 ${ticketNumbers.length} 次）`,
            relatedId: productId.toString()
          }
        })
      ]);

      // 直接從已有資料構建結果，不再 re-query
      const variantMap = new Map(product.variants.map(v => [v.id, v]));
      const results = draws
        .map(d => ({
          ticketNumber: d.ticketNumber,
          variant: variantMap.get(d.variantId)!
        }))
        .sort((a, b) => a.ticketNumber - b.ticketNumber);

      return { results, newBalance, pointsUsed: totalPointsNeeded };
    });

    // 抽獎後非同步處理（不阻塞回應）
    Promise.resolve().then(async () => {
      try {
        await completeSession(productId, payload.userId);
      } catch {
        // 沒有排隊記錄，忽略
      }
      cache.clear(`user:profile:${payload.userId}`);
      cache.clear(`drawn-tickets:${productId}`);
      cache.clear(`variants:${productId}`);
      cache.clearByPrefix(`products:`);
      cache.clear(`product:${productId}`);
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

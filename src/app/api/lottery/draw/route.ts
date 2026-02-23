export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { completeSession } from '@/lib/queue-manager';
import { calculateDiscountedPrice, type Discount } from '@/lib/discount-engine';
import {
  getShuffledDeck,
  type VariantForDeck,
} from '@/lib/provably-fair';

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
    const { productId, ticketNumbers, batchOpen, drawCount } = body;

    // batchOpen 模式：開套抽獎（自動選號）
    const isBatchOpen = batchOpen === true && typeof drawCount === 'number' && drawCount > 0;

    if (!isBatchOpen) {
      // 一般模式驗證
      if (!productId || !ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
        return NextResponse.json(
          { error: '參數錯誤' },
          { status: 400 }
        );
      }
    } else if (!productId) {
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
      // 並行獲取：商品 + 用戶 + 折扣 + 已抽號碼檢查
      const [product, user, discounts, existingDraws] = await Promise.all([
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
              }
            }
          },
        }),
        tx.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, points: true }
        }),
        tx.productDiscount.findMany({
          where: { productId, isActive: true },
          select: { id: true, type: true, drawCount: true, price: true, label: true, isActive: true }
        }),
        isBatchOpen
          ? Promise.resolve([]) // batchOpen 模式不需要檢查指定號碼
          : tx.lotteryDraw.findMany({
              where: { productId, ticketNumber: { in: ticketNumbers } },
              select: { ticketNumber: true }
            })
      ]);

      if (!product) throw new Error('商品不存在');
      if (product.status !== 'active') throw new Error('商品未開放抽獎');
      if (!user) throw new Error('用戶不存在');

      const serverSeed = product.serverSeed;
      if (!serverSeed) throw new Error('商品尚未設定伺服器種子，無法抽獎');

      // batchOpen 模式：驗證並自動選號
      let finalTicketNumbers: number[];

      if (isBatchOpen) {
        if (product.soldTickets !== 0) {
          throw new Error('開套優惠僅限全新未抽商品');
        }

        // 取得所有已抽號碼
        const allDrawn = await tx.lotteryDraw.findMany({
          where: { productId },
          select: { ticketNumber: true },
        });
        const drawnSet = new Set(allDrawn.map(d => d.ticketNumber));

        // 收集可用號碼
        const available: number[] = [];
        for (let i = 1; i <= product.totalTickets; i++) {
          if (!drawnSet.has(i)) available.push(i);
        }

        if (available.length < drawCount) {
          throw new Error(`可用號碼不足，目前僅剩 ${available.length} 個`);
        }

        // batchOpen：直接取前 drawCount 個可用號碼（deck 已洗牌，選哪些號碼不影響公平性）
        finalTicketNumbers = available.slice(0, drawCount);
      } else {
        finalTicketNumbers = ticketNumbers;

        // 檢查號碼是否已被抽走
        if (existingDraws.length > 0) {
          throw new Error(`號碼 ${existingDraws.map(d => d.ticketNumber).join(', ')} 已被抽走`);
        }
      }

      // 檢查號碼是否超出範圍
      const invalidNumbers = finalTicketNumbers.filter((n: number) => n < 1 || n > product.totalTickets);
      if (invalidNumbers.length > 0) {
        throw new Error(`無效的號碼: ${invalidNumbers.join(', ')}`);
      }

      // 折扣計算
      const breakdown = calculateDiscountedPrice(
        finalTicketNumbers.length,
        product.price,
        product.soldTickets,
        discounts as Discount[]
      );

      const totalPointsNeeded = breakdown.totalPrice;

      if (user.points < totalPointsNeeded) {
        throw new Error(`點數不足。需要 ${totalPointsNeeded} 點，目前僅有 ${user.points} 點`);
      }

      // Deck Shuffle v1：建立洗牌後的 deck，直接查表取得結果
      const variantsForDeck: VariantForDeck[] = product.variants.map(v => ({
        id: v.id,
        stock: v.stock,
      }));

      const deck = getShuffledDeck(variantsForDeck, serverSeed);

      // 計算每抽平均花費（存入 LotteryDraw.pointsUsed）
      const avgPointsPerDraw = Math.round(totalPointsNeeded / finalTicketNumbers.length);

      // 直接查表：ticket #N → deck[N-1]
      const draws = finalTicketNumbers.map((ticketNumber: number) => ({
        userId: payload.userId,
        productId,
        variantId: deck[ticketNumber - 1],
        ticketNumber,
        pointsUsed: avgPointsPerDraw,
        clientSeed: null as string | null,
        nonce: null as number | null,
        hashResult: null as string | null,
      }));

      // 並行寫入
      const newSoldTickets = product.soldTickets + finalTicketNumbers.length;
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
            description: `一番賞抽獎 - ${product.name}（抽取 ${finalTicketNumbers.length} 次）`,
            relatedId: productId.toString()
          }
        })
      ]);

      // 構建結果
      const variantMap = new Map(product.variants.map(v => [v.id, v]));
      const results = draws
        .map(d => ({
          ticketNumber: d.ticketNumber,
          variant: variantMap.get(d.variantId)!
        }))
        .sort((a, b) => a.ticketNumber - b.ticketNumber);

      return {
        results,
        newBalance,
        pointsUsed: totalPointsNeeded,
        breakdown,
        fairness: {
          serverSeedHash: product.serverSeedHash,
        },
      };
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

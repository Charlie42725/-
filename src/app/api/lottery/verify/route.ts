export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/lottery/verify?productId=
 *
 * 回傳所有 draws + variants 初始庫存，供外部腳本驗算。
 * serverSeed 只在 sold_out / archived 時公開。
 *
 * 自動檢測演算法版本：
 * - nonce 為 null 的 draws → deck-shuffle-v1（新版）
 * - nonce 不為 null 的 draws → legacy（舊版）
 */
export async function GET(req: NextRequest) {
  try {
    const productId = parseInt(req.nextUrl.searchParams.get('productId') || '');
    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: '缺少 productId 參數' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        status: true,
        serverSeed: true,
        serverSeedHash: true,
        totalTickets: true,
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            prize: true,
            name: true,
            stock: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    if (!product.serverSeedHash) {
      return NextResponse.json({ error: '此商品尚未啟用 Provably Fair' }, { status: 404 });
    }

    const isRevealed = product.status === 'sold_out' || product.status === 'archived';

    // 取得所有抽獎紀錄
    const draws = await prisma.lotteryDraw.findMany({
      where: { productId },
      select: {
        id: true,
        variantId: true,
        ticketNumber: true,
        clientSeed: true,
        nonce: true,
        hashResult: true,
        createdAt: true,
      },
      orderBy: { ticketNumber: 'asc' },
    });

    // 自動檢測演算法版本
    const hasLegacyDraws = draws.some(d => d.nonce !== null);
    const hasNewDraws = draws.some(d => d.nonce === null);
    const algorithm = hasLegacyDraws && !hasNewDraws
      ? 'legacy'
      : hasNewDraws && !hasLegacyDraws
        ? 'deck-shuffle-v1'
        : hasLegacyDraws && hasNewDraws
          ? 'mixed'
          : 'deck-shuffle-v1'; // 無 draws 時預設新版

    // 根據演算法格式化 draws
    const formattedDraws = draws.map(d => {
      if (d.nonce !== null) {
        // legacy 格式
        return {
          id: d.id,
          variantId: d.variantId,
          ticketNumber: d.ticketNumber,
          clientSeed: d.clientSeed,
          nonce: d.nonce,
          hashResult: d.hashResult,
        };
      }
      // deck-shuffle-v1 格式
      return {
        id: d.id,
        variantId: d.variantId,
        ticketNumber: d.ticketNumber,
      };
    });

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      status: product.status,
      algorithm,
      totalTickets: product.totalTickets,
      serverSeedHash: product.serverSeedHash,
      serverSeed: isRevealed ? product.serverSeed : null,
      revealed: isRevealed,
      variants: product.variants.map(v => ({
        id: v.id,
        prize: v.prize,
        name: v.name,
        initialStock: v.stock,
      })),
      draws: formattedDraws,
      totalDraws: draws.length,
    });
  } catch (error) {
    console.error('Verify data query error:', error);
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
}

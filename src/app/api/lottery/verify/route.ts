export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/lottery/verify?productId=
 *
 * 回傳所有 draws + variants 初始庫存，供外部腳本驗算。
 * serverSeed 只在 sold_out / archived 時公開。
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

    // 取得所有有 provably fair 資料的抽獎紀錄
    const draws = await prisma.lotteryDraw.findMany({
      where: {
        productId,
        nonce: { not: null },
      },
      select: {
        id: true,
        variantId: true,
        ticketNumber: true,
        clientSeed: true,
        nonce: true,
        hashResult: true,
        createdAt: true,
      },
      orderBy: { nonce: 'asc' },
    });

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      status: product.status,
      serverSeedHash: product.serverSeedHash,
      serverSeed: isRevealed ? product.serverSeed : null,
      revealed: isRevealed,
      variants: product.variants.map(v => ({
        id: v.id,
        prize: v.prize,
        name: v.name,
        initialStock: v.stock,
      })),
      draws: draws.map(d => ({
        id: d.id,
        variantId: d.variantId,
        ticketNumber: d.ticketNumber,
        clientSeed: d.clientSeed,
        nonce: d.nonce,
        hashResult: d.hashResult,
      })),
      totalDraws: draws.length,
    });
  } catch (error) {
    console.error('Verify data query error:', error);
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
}

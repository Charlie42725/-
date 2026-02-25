export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/lottery/server-seed?productId=
 *
 * - 商品 sold_out / archived → 公開 serverSeed（供驗算）
 * - 商品 active / draft → 只回傳 serverSeedHash（承諾）
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
      },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    if (!product.serverSeedHash) {
      return NextResponse.json({ error: '此商品尚未啟用 Provably Fair' }, { status: 404 });
    }

    const isRevealed = product.status === 'sold_out' || product.status === 'archived';

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      status: product.status,
      algorithm: 'deck-shuffle-v1',
      serverSeedHash: product.serverSeedHash,
      serverSeed: isRevealed ? product.serverSeed : null,
      revealed: isRevealed,
    });
  } catch (error) {
    console.error('Server seed query error:', error);
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
}

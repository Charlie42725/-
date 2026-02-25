export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cache } from '@/lib/cache';

// GET /api/lottery/variants?productId=123
// 獲取商品的最新獎項資料（用於抽獎後即時更新）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '缺少商品 ID' },
        { status: 400 }
      );
    }

    const pid = parseInt(productId);

    const variants = await cache.getOrSet(
      `variants:${productId}`,
      async () => {
        // 並行查詢：variants + 各 variant 已抽數量（用 groupBy 一次搞定）
        const [variantList, drawCounts] = await Promise.all([
          prisma.productVariant.findMany({
            where: { productId: pid, isActive: true },
            select: {
              id: true,
              prize: true,
              name: true,
              rarity: true,
              stock: true,
              imageUrl: true,
              value: true,
            },
            orderBy: { name: 'asc' },
          }),
          prisma.lotteryDraw.groupBy({
            by: ['variantId'],
            where: { productId: pid },
            _count: { id: true },
          }),
        ]);

        // O(n) map 合併
        const countMap = new Map(drawCounts.map(d => [d.variantId, d._count.id]));

        return variantList.map(v => ({
          ...v,
          _count: { lotteryDraws: countMap.get(v.id) || 0 },
        }));
      },
      10000 // 10 秒快取
    );

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('獲取獎項資料失敗:', error);
    return NextResponse.json(
      { error: '獲取獎項資料失敗' },
      { status: 500 }
    );
  }
}

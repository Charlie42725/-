export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 批次查詢多個商品的排隊人數（不需要登入）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('productIds');

    if (!idsParam) {
      return NextResponse.json({ counts: {} });
    }

    const productIds = idsParam
      .split(',')
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (productIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    // 一次查詢所有商品的排隊人數
    const results = await prisma.drawQueue.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: { in: ['waiting', 'active'] },
      },
      _count: { id: true },
    });

    const counts: Record<number, number> = {};
    for (const r of results) {
      counts[r.productId] = r._count.id;
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Queue counts error:', error);
    return NextResponse.json({ counts: {} });
  }
}

export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [brandCount, productCount, activeProductCount] = await Promise.all([
      prisma.brand.count(),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({ brandCount, productCount, activeProductCount });
  } catch (error) {
    console.error('取得統計失敗:', error);
    return NextResponse.json({ error: '取得統計失敗' }, { status: 500 });
  }
}

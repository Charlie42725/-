export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 一次回傳後台所有基礎資料，避免多個 API 冷啟動
export async function GET() {
  try {
    const [products, brands, banners, brandCount, productCount, activeProductCount] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          brand: true,
          _count: { select: { variants: true, images: true } },
        },
      }),
      prisma.brand.findMany({ orderBy: { name: 'asc' } }),
      prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.brand.count(),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      products,
      brands,
      banners,
      stats: { brandCount, productCount, activeProductCount },
    });
  } catch (error) {
    console.error('Admin init 失敗:', error);
    return NextResponse.json({ error: 'Admin init 失敗' }, { status: 500 });
  }
}

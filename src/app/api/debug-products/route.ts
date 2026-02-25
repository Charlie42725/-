export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      // 模擬 product detail page 的完整查詢
      const product = await prisma.product.findFirst({
        where: { slug },
        select: {
          id: true, name: true, slug: true, status: true,
          brand: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true }, select: { id: true, stock: true } },
        },
      });
      return NextResponse.json({ slug, found: !!product, product });
    }

    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, status: true },
      orderBy: { id: 'desc' },
      take: 10,
    });
    return NextResponse.json({ count: products.length, products });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

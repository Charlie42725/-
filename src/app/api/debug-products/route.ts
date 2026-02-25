export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
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

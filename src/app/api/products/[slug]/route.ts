import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await prisma.product.findFirst({
      where: {
        slug,
      },
      include: {
        series: {
          include: {
            brand: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: '找不到該商品' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: '無法獲取商品詳情' },
      { status: 500 }
    );
  }
}

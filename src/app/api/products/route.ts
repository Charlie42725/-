import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProductStatus, Prisma } from '@prisma/client';
import { cache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查詢參數
    const brandSlug = searchParams.get('brand');
    const status = searchParams.get('status') as ProductStatus | null;
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 用查詢參數生成快取 key
    const cacheKey = `products:${brandSlug || ''}:${status || ''}:${sortBy}:${limit}:${offset}`;

    const result = await cache.getOrSet(cacheKey, async () => {
      // 構建 where 條件
      const where: Prisma.ProductWhereInput = {};

      if (status) {
        where.status = status;
      } else {
        where.status = {
          in: ['active', 'sold_out']
        };
      }

      if (brandSlug) {
        where.brand = {
          slug: brandSlug,
        };
      }

      // 構建 orderBy 條件
      let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

      switch (sortBy) {
        case 'price_low':
          orderBy = { price: 'asc' };
          break;
        case 'price_high':
          orderBy = { price: 'desc' };
          break;
        case 'popular':
          orderBy = { soldTickets: 'desc' };
          break;
      }

      // 同時查詢商品和總數
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
          include: {
            brand: {
              select: { id: true, name: true, slug: true },
            },
            _count: {
              select: { variants: true },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      return { products, total, limit, offset };
    }, 30000); // 快取 30 秒

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: '無法獲取商品列表' },
      { status: 500 }
    );
  }
}

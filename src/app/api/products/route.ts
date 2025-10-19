import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ProductStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查詢參數
    const brandSlug = searchParams.get('brand');
    const seriesSlug = searchParams.get('series');
    const status = searchParams.get('status') as ProductStatus | null;
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 構建 where 條件
    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      // 默認只顯示 active 狀態
      where.status = 'active';
    }

    if (brandSlug) {
      where.series = {
        brand: {
          slug: brandSlug,
        },
      };
    }

    if (seriesSlug) {
      where.series = {
        slug: seriesSlug,
      };
    }

    // 構建 orderBy 條件
    let orderBy: any = { createdAt: 'desc' }; // 默認最新

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

    // 查詢商品
    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        series: {
          include: {
            brand: true,
          },
        },
        variants: {
          where: { isActive: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // 獲取總數
    const total = await prisma.product.count({ where });

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: '無法獲取商品列表' },
      { status: 500 }
    );
  }
}

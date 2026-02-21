import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache';

export async function GET() {
  try {
    const brands = await cache.getOrSet('brands:list', () =>
      prisma.brand.findMany({
        where: {
          isActive: true,
        },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  status: 'active',
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      60000 // 快取 60 秒
    );

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: '無法獲取品牌列表' },
      { status: 500 }
    );
  }
}

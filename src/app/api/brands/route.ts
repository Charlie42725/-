import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
      },
      include: {
        series: {
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
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: '無法獲取品牌列表' },
      { status: 500 }
    );
  }
}

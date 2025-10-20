import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 獲取所有品牌
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            series: true,
          },
        },
      },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('獲取品牌失敗:', error);
    return NextResponse.json({ error: '獲取品牌失敗' }, { status: 500 });
  }
}

// 新增品牌
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: '品牌名稱和 slug 為必填' },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: unknown) {
    console.error('新增品牌失敗:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在，請使用不同的 slug' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '新增品牌失敗' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 獲取所有系列
export async function GET() {
  try {
    const series = await prisma.series.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('獲取系列失敗:', error);
    return NextResponse.json({ error: '獲取系列失敗' }, { status: 500 });
  }
}

// 新增系列
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandId, name, slug, description } = body;

    if (!brandId || !name || !slug) {
      return NextResponse.json(
        { error: '品牌ID、系列名稱和 slug 為必填' },
        { status: 400 }
      );
    }

    const series = await prisma.series.create({
      data: {
        brandId: parseInt(brandId),
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json({ series }, { status: 201 });
  } catch (error: any) {
    console.error('新增系列失敗:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在，請使用不同的 slug' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '新增系列失敗' }, { status: 500 });
  }
}

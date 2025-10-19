import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 獲取所有商品（後台用）
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        series: {
          include: {
            brand: true,
          },
        },
        _count: {
          select: {
            variants: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('獲取商品失敗:', error);
    return NextResponse.json({ error: '獲取商品失敗' }, { status: 500 });
  }
}

// 新增商品
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      seriesId,
      name,
      slug,
      shortDescription,
      longDescription,
      price,
      totalTickets,
      status,
      coverImage,
      galleryImages,
    } = body;

    if (!seriesId || !name || !slug || !price || !totalTickets) {
      return NextResponse.json(
        { error: '必填欄位不完整' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        seriesId: parseInt(seriesId),
        name,
        slug,
        shortDescription: shortDescription || null,
        longDescription: longDescription || null,
        price: parseInt(price),
        totalTickets: parseInt(totalTickets),
        soldTickets: 0,
        status: status || 'draft',
        coverImage: coverImage || null,
        images: galleryImages && galleryImages.length > 0 ? {
          create: galleryImages.map((url: string, index: number) => ({
            url,
            type: 'gallery',
            sortOrder: index,
          })),
        } : undefined,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('新增商品失敗:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '新增商品失敗' }, { status: 500 });
  }
}

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
        variants: {
          select: { id: true }
        },
        images: {
          select: { id: true }
        },
      },
    });

    // 手動計算數量
    const productsWithCount = products.map(product => ({
      ...product,
      _count: {
        variants: product.variants.length,
        images: product.images.length
      },
      variants: undefined, // 移除完整資料
      images: undefined,
    }));

    return NextResponse.json({ products: productsWithCount });
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
  } catch (error: unknown) {
    console.error('新增商品失敗:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '新增商品失敗' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 取得單一商品
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        series: {
          include: {
            brand: true,
          },
        },
        images: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('查詢商品失敗:', error);
    return NextResponse.json({ error: '查詢商品失敗' }, { status: 500 });
  }
}

// 刪除商品
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);

    // 先刪除關聯的圖片記錄
    await prisma.image.deleteMany({
      where: { productId: id },
    });

    // 刪除商品
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除商品失敗:', error);
    return NextResponse.json({ error: '刪除商品失敗' }, { status: 500 });
  }
}

// 更新商品
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
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

    // 先刪除現有的畫廊圖片
    await prisma.image.deleteMany({
      where: {
        productId: id,
        type: 'gallery',
      },
    });

    // 更新商品
    const product = await prisma.product.update({
      where: { id },
      data: {
        seriesId: parseInt(seriesId),
        name,
        slug,
        shortDescription: shortDescription || null,
        longDescription: longDescription || null,
        price: parseInt(price),
        totalTickets: parseInt(totalTickets),
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
      include: {
        series: {
          include: {
            brand: true,
          },
        },
        images: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('更新商品失敗:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '更新商品失敗' }, { status: 500 });
  }
}

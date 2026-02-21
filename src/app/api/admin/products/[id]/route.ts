import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// import { verifyAdmin } from '@/lib/auth';
import { validateId } from '@/lib/validation';

// 取得單一商品
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: 未來啟用管理員權限驗證
    // const authResult = await verifyAdmin(request.headers);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: authResult.error },
    //     { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
    //   );
    // }

    const { id: idStr } = await context.params;

    // 驗證 ID 格式
    const idValidation = validateId(idStr);
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: idValidation.id },
      include: {
        brand: true,
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
    // TODO: 未來啟用管理員權限驗證
    // const authResult = await verifyAdmin(request.headers);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: authResult.error },
    //     { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
    //   );
    // }

    const { id: idStr } = await context.params;

    // 驗證 ID 格式
    const idValidation = validateId(idStr);
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    const id = idValidation.id!;

    // 檢查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          select: { id: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    // 檢查是否有獎項關聯
    if (product.variants.length > 0) {
      return NextResponse.json(
        { error: '無法刪除：該商品還有關聯的獎項，請先刪除所有獎項' },
        { status: 400 }
      );
    }

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
    // TODO: 未來啟用管理員權限驗證
    // const authResult = await verifyAdmin(request.headers);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: authResult.error },
    //     { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
    //   );
    // }

    const { id: idStr } = await context.params;

    // 驗證 ID 格式
    const idValidation = validateId(idStr);
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    const id = idValidation.id!;
    const body = await request.json();
    const {
      brandId,
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

    if (!brandId || !name || !slug || !price || !totalTickets) {
      return NextResponse.json(
        { error: '必填欄位不完整' },
        { status: 400 }
      );
    }

    // 驗證數值範圍
    if (parseInt(price) <= 0) {
      return NextResponse.json({ error: '價格必須大於 0' }, { status: 400 });
    }

    if (parseInt(totalTickets) <= 0) {
      return NextResponse.json({ error: '總票數必須大於 0' }, { status: 400 });
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
        brandId: parseInt(brandId),
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
        brand: true,
        images: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error('更新商品失敗:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '更新商品失敗' }, { status: 500 });
  }
}

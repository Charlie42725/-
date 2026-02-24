export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// import { verifyAdmin } from '@/lib/auth';
import { validateId } from '@/lib/validation';
import { generateServerSeed, hashServerSeed } from '@/lib/provably-fair';

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
        discounts: true,
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
      variants: submittedVariants,
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

    // Provably Fair: 當 status 設為 active 時，驗證 variant stock 總和 === totalTickets
    let seedData: { serverSeed: string; serverSeedHash: string } | undefined;
    if (status === 'active') {
      // 優先用前端提交的 variants 資料驗證（因為 variants 可能尚未寫入 DB）
      let totalStock: number;
      if (Array.isArray(submittedVariants) && submittedVariants.length > 0) {
        totalStock = submittedVariants
          .filter((v: { isActive?: boolean }) => v.isActive !== false)
          .reduce((sum: number, v: { stock: string | number }) => sum + (parseInt(String(v.stock)) || 0), 0);
      } else {
        const existingWithVariants = await prisma.product.findUnique({
          where: { id },
          select: {
            variants: {
              where: { isActive: true },
              select: { stock: true },
            },
          },
        });
        totalStock = existingWithVariants?.variants.reduce((sum, v) => sum + v.stock, 0) ?? 0;
      }

      if (totalStock !== parseInt(totalTickets)) {
        return NextResponse.json(
          { error: `獎項庫存總和 (${totalStock}) 必須等於總票數 (${totalTickets})。請調整獎項庫存或總票數。` },
          { status: 400 }
        );
      }

      // 自動生成 serverSeed
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { serverSeed: true },
      });
      if (!existing?.serverSeed) {
        const seed = generateServerSeed();
        seedData = { serverSeed: seed, serverSeedHash: hashServerSeed(seed) };
      }
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
        ...(seedData || {}),
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

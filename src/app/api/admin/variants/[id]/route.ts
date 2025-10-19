import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/variants/[id]
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: '獎項不存在' }, { status: 404 });
    }

    return NextResponse.json({ variant });
  } catch (error) {
    console.error('查詢獎項失敗:', error);
    return NextResponse.json({ error: '查詢獎項失敗' }, { status: 500 });
  }
}

// PUT /api/admin/variants/[id]
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { prize, name, rarity, stock, imageUrl, isActive } = body;

    // 檢查獎項是否存在
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingVariant) {
      return NextResponse.json({ error: '獎項不存在' }, { status: 404 });
    }

    // 更新獎項
    const variant = await prisma.productVariant.update({
      where: { id: parseInt(id) },
      data: {
        prize: prize || existingVariant.prize,
        name: name || existingVariant.name,
        rarity: rarity !== undefined ? rarity : existingVariant.rarity,
        stock: stock !== undefined ? parseInt(stock) : existingVariant.stock,
        imageUrl: imageUrl !== undefined ? imageUrl : existingVariant.imageUrl,
        isActive: isActive !== undefined ? isActive : existingVariant.isActive,
      },
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error('更新獎項失敗:', error);
    return NextResponse.json({ error: '更新獎項失敗' }, { status: 500 });
  }
}

// DELETE /api/admin/variants/[id]
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 檢查獎項是否存在
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingVariant) {
      return NextResponse.json({ error: '獎項不存在' }, { status: 404 });
    }

    // 刪除獎項
    await prisma.productVariant.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: '獎項已刪除' });
  } catch (error) {
    console.error('刪除獎項失敗:', error);
    return NextResponse.json({ error: '刪除獎項失敗' }, { status: 500 });
  }
}

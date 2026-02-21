export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PUT /api/admin/discounts/[id]
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type, drawCount, price, label, isActive } = body;

    const existing = await prisma.productDiscount.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: '折扣不存在' }, { status: 404 });
    }

    const discount = await prisma.productDiscount.update({
      where: { id: parseInt(id) },
      data: {
        type: type || existing.type,
        drawCount: drawCount !== undefined ? parseInt(drawCount) : existing.drawCount,
        price: price !== undefined ? parseInt(price) : existing.price,
        label: label !== undefined ? label : existing.label,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({ discount });
  } catch (error) {
    console.error('更新折扣失敗:', error);
    const msg = (error as { code?: string }).code === 'P2002'
      ? '此商品已存在相同類型和抽數的折扣'
      : '更新折扣失敗';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/discounts/[id]
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.productDiscount.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: '折扣不存在' }, { status: 404 });
    }

    await prisma.productDiscount.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: '折扣已刪除' });
  } catch (error) {
    console.error('刪除折扣失敗:', error);
    return NextResponse.json({ error: '刪除折扣失敗' }, { status: 500 });
  }
}

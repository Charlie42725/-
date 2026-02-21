export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/discounts?productId=123
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const discounts = await prisma.productDiscount.findMany({
        where: { productId: parseInt(productId) },
        orderBy: [{ type: 'asc' }, { drawCount: 'asc' }],
      });
      return NextResponse.json({ discounts });
    }

    const discounts = await prisma.productDiscount.findMany({
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error('查詢折扣失敗:', error);
    return NextResponse.json({ error: '查詢折扣失敗' }, { status: 500 });
  }
}

// POST /api/admin/discounts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, type, drawCount, price, label, isActive } = body;

    if (!productId || !type || !drawCount || price === undefined) {
      return NextResponse.json(
        { error: '商品 ID、折扣類型、抽數門檻和價格為必填' },
        { status: 400 }
      );
    }

    if (type !== 'full_set' && type !== 'combo') {
      return NextResponse.json(
        { error: '折扣類型必須為 full_set 或 combo' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    const discount = await prisma.productDiscount.create({
      data: {
        productId: parseInt(productId),
        type,
        drawCount: parseInt(drawCount),
        price: parseInt(price),
        label: label || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error('建立折扣失敗:', error);
    const msg = (error as { code?: string }).code === 'P2002'
      ? '此商品已存在相同類型和抽數的折扣'
      : '建立折扣失敗';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

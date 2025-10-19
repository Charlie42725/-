import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/variants?productId=123
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // 查詢特定商品的獎項
      const variants = await prisma.productVariant.findMany({
        where: { productId: parseInt(productId) },
        orderBy: { id: 'asc' },
      });

      return NextResponse.json({ variants });
    }

    // 查詢所有獎項
    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('查詢獎項失敗:', error);
    return NextResponse.json({ error: '查詢獎項失敗' }, { status: 500 });
  }
}

// POST /api/admin/variants
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, name, rarity, stock, imageUrl, isActive } = body;

    // 驗證必填欄位
    if (!productId || !name) {
      return NextResponse.json(
        { error: '商品 ID 和獎項名稱為必填' },
        { status: 400 }
      );
    }

    // 驗證商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    // 建立獎項
    const variant = await prisma.productVariant.create({
      data: {
        productId: parseInt(productId),
        name,
        rarity: rarity || null,
        stock: parseInt(stock) || 0,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error('建立獎項失敗:', error);
    return NextResponse.json({ error: '建立獎項失敗' }, { status: 500 });
  }
}

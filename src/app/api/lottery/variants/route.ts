import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/lottery/variants?productId=123
// 獲取商品的最新獎項資料（用於抽獎後即時更新）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '缺少商品 ID' },
        { status: 400 }
      );
    }

    // 查詢商品的最新獎項資料（包含已抽數量統計）
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: parseInt(productId),
        isActive: true
      },
      select: {
        id: true,
        prize: true,
        name: true,
        rarity: true,
        stock: true,
        imageUrl: true,
        _count: {
          select: {
            lotteryDraws: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('獲取獎項資料失敗:', error);
    return NextResponse.json(
      { error: '獲取獎項資料失敗' },
      { status: 500 }
    );
  }
}

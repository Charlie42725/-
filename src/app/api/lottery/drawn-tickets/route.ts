import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 獲取商品的已抽號碼
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '缺少商品 ID' },
        { status: 400 }
      );
    }

    // 查詢該商品的所有已抽號碼
    const drawnTickets = await prisma.lotteryDraw.findMany({
      where: {
        productId: parseInt(productId)
      },
      include: {
        variant: true,
        user: {
          select: {
            id: true,
            nickname: true
          }
        }
      },
      orderBy: {
        ticketNumber: 'asc'
      }
    });

    return NextResponse.json({
      drawnTickets
    });

  } catch (error) {
    console.error('Get drawn tickets error:', error);
    return NextResponse.json(
      { error: '查詢失敗' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { getQueueStatus } from '@/lib/queue-manager';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = parseInt(searchParams.get('productId') || '', 10);

    if (isNaN(productId)) {
      return NextResponse.json({ error: '缺少 productId' }, { status: 400 });
    }

    const token = getTokenFromHeaders(req.headers);

    // 未登入：只回傳排隊人數
    if (!token) {
      const queueLength = await prisma.drawQueue.count({
        where: {
          productId,
          status: { in: ['waiting', 'active'] },
        },
      });
      return NextResponse.json({ inQueue: false, queueLength });
    }

    const payload = verifyToken(token);
    if (!payload) {
      const queueLength = await prisma.drawQueue.count({
        where: {
          productId,
          status: { in: ['waiting', 'active'] },
        },
      });
      return NextResponse.json({ inQueue: false, queueLength });
    }

    const status = await getQueueStatus(productId, payload.userId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: '查詢排隊狀態失敗' },
      { status: 500 }
    );
  }
}

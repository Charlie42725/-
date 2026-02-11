import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { getQueueStatus } from '@/lib/queue-manager';

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '登入已過期，請重新登入' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = parseInt(searchParams.get('productId') || '', 10);

    if (isNaN(productId)) {
      return NextResponse.json({ error: '缺少 productId' }, { status: 400 });
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

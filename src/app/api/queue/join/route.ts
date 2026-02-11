import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { joinQueue } from '@/lib/queue-manager';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '登入已過期，請重新登入' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: '缺少 productId' }, { status: 400 });
    }

    const entry = await joinQueue(productId, payload.userId);

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        status: entry.status,
        position: entry.position,
        expiresAt: entry.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Queue join error:', error);
    return NextResponse.json(
      { error: '加入排隊失敗' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { heartbeat } from '@/lib/queue-manager';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '登入已過期' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: '缺少 productId' }, { status: 400 });
    }

    const entry = await heartbeat(productId, payload.userId);

    if (!entry) {
      return NextResponse.json({ error: '未在排隊中' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Queue heartbeat error:', error);
    return NextResponse.json(
      { error: '心跳更新失敗' },
      { status: 500 }
    );
  }
}

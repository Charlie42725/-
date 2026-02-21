export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { leaveQueue } from '@/lib/queue-manager';

export async function POST(req: NextRequest) {
  try {
    // 支援 sendBeacon（Content-Type 可能是 text/plain）
    let productId: number | undefined;
    let userId: number | undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      productId = body.productId;

      // 嘗試從 body 中的 token 驗證（sendBeacon 場景）
      if (body.token) {
        const payload = verifyToken(body.token);
        if (payload) {
          userId = payload.userId;
        }
      }
    } else {
      // sendBeacon 可能用 text/plain
      try {
        const text = await req.text();
        const body = JSON.parse(text);
        productId = body.productId;

        if (body.token) {
          const payload = verifyToken(body.token);
          if (payload) {
            userId = payload.userId;
          }
        }
      } catch {
        // 解析失敗
      }
    }

    // 如果還沒有 userId，從 header 取
    if (!userId) {
      const token = getTokenFromHeaders(req.headers);
      if (!token) {
        return NextResponse.json({ error: '請先登入' }, { status: 401 });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: '登入已過期' }, { status: 401 });
      }

      userId = payload.userId;
    }

    if (!productId) {
      return NextResponse.json({ error: '缺少 productId' }, { status: 400 });
    }

    await leaveQueue(productId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Queue leave error:', error);
    return NextResponse.json(
      { error: '離開排隊失敗' },
      { status: 500 }
    );
  }
}

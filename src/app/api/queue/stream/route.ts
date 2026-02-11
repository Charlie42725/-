import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sseRegistry } from '@/lib/sse-registry';

// 禁用靜態渲染
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = parseInt(searchParams.get('productId') || '', 10);
  const token = searchParams.get('token') || '';

  if (isNaN(productId) || !token) {
    return new Response('Missing productId or token', { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new Response('Invalid token', { status: 401 });
  }

  const userId = payload.userId;

  const stream = new ReadableStream({
    start(controller) {
      // 註冊連線
      sseRegistry.addConnection(productId, userId, controller);

      // 發送初始連線成功訊息
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'connected', userId, productId })}\n\n`
        )
      );

      // 保持連線的 keep-alive（每 30 秒）
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode(`: keep-alive\n\n`)
          );
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // 當 request 被中斷時清除
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        sseRegistry.removeConnection(productId, userId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      sseRegistry.removeConnection(productId, userId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

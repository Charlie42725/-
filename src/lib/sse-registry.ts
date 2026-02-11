// SSE 連線管理器（單例模式）
// key = `product:${productId}`，value = Map<userId, controller>

type SSEController = ReadableStreamDefaultController;

interface SSEConnection {
  controller: SSEController;
  productId: number;
  userId: number;
}

class SSERegistry {
  // productId → Map<userId, controller>
  private connections = new Map<number, Map<number, SSEController>>();

  addConnection(productId: number, userId: number, controller: SSEController) {
    if (!this.connections.has(productId)) {
      this.connections.set(productId, new Map());
    }

    const productConns = this.connections.get(productId)!;

    // 關閉同一使用者的舊連線（多分頁情境）
    const existingController = productConns.get(userId);
    if (existingController) {
      try {
        existingController.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: 'replaced', message: '連線已被新分頁取代' })}\n\n`)
        );
        existingController.close();
      } catch {
        // 舊連線可能已經關閉
      }
    }

    productConns.set(userId, controller);
  }

  removeConnection(productId: number, userId: number) {
    const productConns = this.connections.get(productId);
    if (productConns) {
      productConns.delete(userId);
      if (productConns.size === 0) {
        this.connections.delete(productId);
      }
    }
  }

  // 廣播訊息給該商品的所有連線
  broadcast(productId: number, data: Record<string, unknown>) {
    const productConns = this.connections.get(productId);
    if (!productConns) return;

    const message = new TextEncoder().encode(
      `data: ${JSON.stringify(data)}\n\n`
    );

    for (const [userId, controller] of productConns) {
      try {
        controller.enqueue(message);
      } catch {
        // 連線已斷開，清除
        productConns.delete(userId);
      }
    }
  }

  // 發送訊息給特定使用者
  sendToUser(productId: number, userId: number, data: Record<string, unknown>) {
    const productConns = this.connections.get(productId);
    if (!productConns) return;

    const controller = productConns.get(userId);
    if (!controller) return;

    try {
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
      );
    } catch {
      productConns.delete(userId);
    }
  }

  getConnectionCount(productId: number): number {
    return this.connections.get(productId)?.size || 0;
  }
}

// 單例模式
const globalForSSE = global as unknown as { sseRegistry: SSERegistry };

export const sseRegistry =
  globalForSSE.sseRegistry || new SSERegistry();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.sseRegistry = sseRegistry;
}

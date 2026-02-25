// SSE 連線管理器（單例模式）
// key = productId，value = Map<userId, { controller, connectedAt }>

type SSEController = ReadableStreamDefaultController;

interface SSEEntry {
  controller: SSEController;
  connectedAt: number;
}

const MAX_CONNECTION_AGE_MS = 30 * 60 * 1000; // 30 分鐘自動清理

class SSERegistry {
  // productId → Map<userId, SSEEntry>
  private connections = new Map<number, Map<number, SSEEntry>>();

  addConnection(productId: number, userId: number, controller: SSEController) {
    if (!this.connections.has(productId)) {
      this.connections.set(productId, new Map());
    }

    const productConns = this.connections.get(productId)!;

    // 關閉同一使用者的舊連線（多分頁情境）
    const existing = productConns.get(userId);
    if (existing) {
      try {
        existing.controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: 'replaced', message: '連線已被新分頁取代' })}\n\n`)
        );
        existing.controller.close();
      } catch {
        // 舊連線可能已經關閉
      }
    }

    productConns.set(userId, { controller, connectedAt: Date.now() });
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

  // 廣播訊息給該商品的所有連線（共用 encoded message）
  broadcast(productId: number, data: Record<string, unknown>) {
    const productConns = this.connections.get(productId);
    if (!productConns || productConns.size === 0) return;

    const message = new TextEncoder().encode(
      `data: ${JSON.stringify(data)}\n\n`
    );

    for (const [userId, entry] of productConns) {
      try {
        entry.controller.enqueue(message);
      } catch {
        productConns.delete(userId);
      }
    }
  }

  // 發送訊息給特定使用者
  sendToUser(productId: number, userId: number, data: Record<string, unknown>) {
    const productConns = this.connections.get(productId);
    if (!productConns) return;

    const entry = productConns.get(userId);
    if (!entry) return;

    try {
      entry.controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
      );
    } catch {
      productConns.delete(userId);
    }
  }

  getConnectionCount(productId: number): number {
    return this.connections.get(productId)?.size || 0;
  }

  // 清理超時連線（防止記憶體洩漏）
  cleanup() {
    const deadline = Date.now() - MAX_CONNECTION_AGE_MS;

    for (const [productId, productConns] of this.connections) {
      for (const [userId, entry] of productConns) {
        if (entry.connectedAt < deadline) {
          try { entry.controller.close(); } catch { /* ignore */ }
          productConns.delete(userId);
        }
      }
      if (productConns.size === 0) {
        this.connections.delete(productId);
      }
    }
  }

  get totalConnections(): number {
    let count = 0;
    for (const conns of this.connections.values()) {
      count += conns.size;
    }
    return count;
  }
}

// 單例模式
const globalForSSE = global as unknown as { sseRegistry: SSERegistry };

export const sseRegistry =
  globalForSSE.sseRegistry || new SSERegistry();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.sseRegistry = sseRegistry;
}

// 每 5 分鐘清理超時 SSE 連線
setInterval(() => {
  sseRegistry.cleanup();
}, 5 * 60 * 1000);

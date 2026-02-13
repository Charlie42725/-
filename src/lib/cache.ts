// 簡單的記憶體快取系統
// 使用 globalThis 確保 dev 模式下 HMR 不會清掉快取
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const globalForCache = globalThis as unknown as { __cache_store: Map<string, CacheEntry<unknown>> };
if (!globalForCache.__cache_store) {
  globalForCache.__cache_store = new Map();
}

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = globalForCache.__cache_store;
  private pending = new Map<string, Promise<unknown>>();

  set<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // 取快取或執行查詢並快取結果（含 stampede 防護）
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    // 如果已有相同 key 的請求進行中，直接共用結果
    const inflight = this.pending.get(key);
    if (inflight) return inflight as Promise<T>;

    const promise = fn().then(data => {
      this.set(key, data, ttl);
      this.pending.delete(key);
      return data;
    }).catch(err => {
      this.pending.delete(key);
      throw err;
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // 清除符合前綴的快取
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // 清除過期的快取項目
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// 每分鐘清理一次過期快取
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 60000);
}

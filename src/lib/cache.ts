// 高效記憶體快取系統
// 使用 globalThis 確保 dev 模式下 HMR 不會清掉快取
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
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
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 取快取或執行查詢並快取結果（含 stampede 防護）
   * - 相同 key 的並發請求共用同一 Promise
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

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

  /**
   * Stale-while-revalidate: 回傳過期快取的同時在背景更新
   * 適用於可以容忍短暫舊資料的場景（如首頁商品列表）
   */
  async getOrSetSWR<T>(key: string, fn: () => Promise<T>, ttl: number, staleTTL: number): Promise<T> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (entry) {
      const age = now - entry.timestamp;
      if (age <= ttl) {
        // Fresh
        return entry.data;
      }
      if (age <= staleTTL) {
        // Stale but usable — return immediately, revalidate in background
        if (!this.pending.has(key)) {
          const revalidate = fn().then(data => {
            this.set(key, data, ttl);
            this.pending.delete(key);
          }).catch(() => {
            this.pending.delete(key);
          });
          this.pending.set(key, revalidate);
        }
        return entry.data;
      }
      // Expired beyond stale window
      this.cache.delete(key);
    }

    return this.getOrSet(key, fn, ttl);
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // 懶清理：只在 get 時清除過期項，加上定期全量清理
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

export const cache = new SimpleCache();

// 每 2 分鐘清理一次過期快取（減少 GC 壓力）
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 120000);
}

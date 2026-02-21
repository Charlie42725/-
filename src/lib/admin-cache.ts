// 簡易的模組層級快取，所有 admin 頁面共用同一份資料
// 頁面切換時不需要重新打 API，只有手動刷新或 mutation 後才重新載入

interface AdminData {
  products: any[];
  brands: any[];
  banners: any[];
  stats: { brandCount: number; productCount: number; activeProductCount: number };
}

let cache: AdminData | null = null;
let fetchPromise: Promise<AdminData> | null = null;
let lastFetchTime = 0;
const STALE_MS = 30_000; // 30 秒後視為過期

async function doFetch(): Promise<AdminData> {
  const res = await fetch('/api/admin/init');
  if (!res.ok) throw new Error('Admin init failed');
  const data = await res.json();
  cache = data;
  lastFetchTime = Date.now();
  fetchPromise = null;
  return data;
}

export async function getAdminData(forceRefresh = false): Promise<AdminData> {
  const isStale = Date.now() - lastFetchTime > STALE_MS;

  // 有快取且沒過期 → 直接回傳
  if (cache && !forceRefresh && !isStale) {
    return cache;
  }

  // 有快取但過期 → 回傳舊資料，背景更新
  if (cache && !forceRefresh && isStale) {
    if (!fetchPromise) fetchPromise = doFetch();
    return cache;
  }

  // 沒快取 → 等待載入
  if (!fetchPromise) fetchPromise = doFetch();
  return fetchPromise;
}

// mutation 後呼叫，清除快取強制重新載入
export function invalidateAdminCache() {
  cache = null;
  lastFetchTime = 0;
  fetchPromise = null;
}

// 取得目前快取（同步），用於判斷是否需要 loading skeleton
export function getAdminCacheSync(): AdminData | null {
  return cache;
}

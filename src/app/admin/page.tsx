import Link from 'next/link';
import { prisma } from '@/lib/db';

export default async function AdminDashboard() {
  // 獲取統計資料
  const stats = await Promise.all([
    prisma.brand.count(),
    prisma.series.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: 'active' } }),
  ]);

  const [brandCount, seriesCount, productCount, activeProductCount] = stats;

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">後台管理儀表板</h1>
        <p className="text-slate-400">歡迎來到XXXX管理後台</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">品牌總數</p>
              <p className="text-3xl font-bold text-white mt-2">{brandCount}</p>
            </div>
            <div className="text-2xl">🏷️</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">系列總數</p>
              <p className="text-3xl font-bold text-white mt-2">{seriesCount}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">商品總數</p>
              <p className="text-3xl font-bold text-white mt-2">{productCount}</p>
            </div>
            <div className="text-2xl">🎁</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">進行中商品</p>
              <p className="text-3xl font-bold text-white mt-2">{activeProductCount}</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/brands"
            className="flex items-center p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <span className="text-2xl mr-3">🏷️</span>
            <div>
              <p className="font-medium text-white">新增品牌</p>
              <p className="text-sm text-slate-400">創建新的 IP 品牌</p>
            </div>
          </Link>

          <Link
            href="/admin/series"
            className="flex items-center p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <span className="text-2xl mr-3">📦</span>
            <div>
              <p className="font-medium text-white">新增系列</p>
              <p className="text-sm text-slate-400">創建新的商品系列</p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <span className="text-2xl mr-3">🎁</span>
            <div>
              <p className="font-medium text-white">新增商品</p>
              <p className="text-sm text-slate-400">創建新的一番賞商品</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

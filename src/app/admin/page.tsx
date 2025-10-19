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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">後台管理儀表板</h1>
        <p className="text-slate-400">歡迎來到良級懸賞管理後台</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-lg hover:shadow-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">品牌總數</p>
              <p className="text-4xl font-bold text-white mt-2 bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">{brandCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl">🏷️</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">系列總數</p>
              <p className="text-4xl font-bold text-white mt-2 bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">{seriesCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:shadow-lg hover:shadow-orange-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">商品總數</p>
              <p className="text-4xl font-bold text-white mt-2 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">{productCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-2xl">🎁</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">進行中商品</p>
              <p className="text-4xl font-bold text-white mt-2 bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">{activeProductCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">快速操作</h2>
          <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/brands"
            className="relative overflow-hidden group flex items-center p-6 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform">
              <span className="text-xl">🏷️</span>
            </div>
            <div className="relative z-10">
              <p className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">新增品牌</p>
              <p className="text-sm text-slate-400">創建新的 IP 品牌</p>
            </div>
          </Link>

          <Link
            href="/admin/series"
            className="relative overflow-hidden group flex items-center p-6 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/30 group-hover:rotate-12 transition-transform">
              <span className="text-xl">📦</span>
            </div>
            <div className="relative z-10">
              <p className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">新增系列</p>
              <p className="text-sm text-slate-400">創建新的商品系列</p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="relative overflow-hidden group flex items-center p-6 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl border border-orange-500/20 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
              <span className="text-xl">🎁</span>
            </div>
            <div className="relative z-10">
              <p className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">新增商品</p>
              <p className="text-sm text-slate-400">創建新的一番賞商品</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

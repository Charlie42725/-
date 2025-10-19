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
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">品牌總數</p>
              <p className="text-3xl font-bold text-white mt-2">{brandCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">系列總數</p>
              <p className="text-3xl font-bold text-white mt-2">{seriesCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">商品總數</p>
              <p className="text-3xl font-bold text-white mt-2">{productCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">進行中商品</p>
              <p className="text-3xl font-bold text-white mt-2">{activeProductCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/brands"
            className="flex items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white group-hover:text-blue-400 transition-colors">新增品牌</p>
              <p className="text-sm text-slate-400">創建新的 IP 品牌</p>
            </div>
          </Link>

          <Link
            href="/admin/series"
            className="flex items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white group-hover:text-purple-400 transition-colors">新增系列</p>
              <p className="text-sm text-slate-400">創建新的商品系列</p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white group-hover:text-orange-400 transition-colors">新增商品</p>
              <p className="text-sm text-slate-400">創建新的一番賞商品</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

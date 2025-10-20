import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateProgress, statusText, statusColor } from '@/types';
import LotterySystem from '@/components/LotterySystem';

// 優化：使用 ISR (Incremental Static Regeneration) 提升性能
export const revalidate = 60; // 每 60 秒重新驗證一次

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // 優化：使用 select 只取需要的欄位，減少資料傳輸
  const product = await prisma.product.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      longDescription: true,
      price: true,
      totalTickets: true,
      soldTickets: true,
      status: true,
      coverImage: true,
      series: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          prize: true,
          name: true,
          rarity: true,
          stock: true,
          imageUrl: true,
        },
        orderBy: { name: 'asc' },
      },
      images: {
        select: {
          id: true,
          url: true,
          type: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const progress = calculateProgress(product.soldTickets, product.totalTickets);
  const remaining = product.totalTickets - product.soldTickets;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 麵包屑導航 */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <nav className="flex items-center space-x-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-orange-400 transition-colors">
            首頁
          </Link>
          <span>/</span>
          <Link
            href={`/brands/${product.series.brand.slug}`}
            className="hover:text-orange-400 transition-colors"
          >
            {product.series.brand.name}
          </Link>
          <span>/</span>
          <Link
            href={`/series/${product.series.slug}`}
            className="hover:text-orange-400 transition-colors"
          >
            {product.series.name}
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </nav>
      </div>

      {/* 商品主要內容 - 優化：左右呼吸空間增加到 12-14 (48-56px) */}
      <div className="max-w-screen-xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-14">
          {/* 左側：圖片展示區 - 優化：增加內邊距與主圖焦點 */}
          <div className="bg-slate-800/30 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
            {/* 主圖容器 - 優化：增加展示感 */}
            <div className="w-full">
              <div className="relative h-96 lg:h-[520px] rounded-2xl overflow-hidden bg-slate-800 shadow-2xl">
                <Image
                  src={product.coverImage || `https://picsum.photos/800/600?random=${product.id}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {/* 狀態標籤 - 優化：稍微縮小避免搶焦點 */}
                <div className="absolute top-4 right-4">
                  <div className={`${statusColor[product.status]} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-opacity-90`}>
                    {statusText[product.status]}
                  </div>
                </div>
              </div>
            </div>

            {/* 圖片畫廊 - 優化：主圖與縮圖之間增加到 40px (mt-10) */}
            {product.images.length > 0 && (
              <div className="mt-10">
                <div className={`grid gap-4 items-center justify-items-center ${
                  product.images.length === 1 ? 'grid-cols-1' :
                  product.images.length === 2 ? 'grid-cols-2' :
                  product.images.length === 3 ? 'grid-cols-3' :
                  'grid-cols-4'
                }`}>
                  {product.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative w-full h-28 lg:h-32 rounded-xl overflow-hidden bg-slate-800 cursor-pointer hover:ring-2 hover:ring-orange-400 hover:shadow-xl transition-all duration-300 hover:scale-110 opacity-80 hover:opacity-100"
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} 圖片 ${image.id}`}
                        fill
                        className="object-cover"
                      />
                      {/* 半透明遮罩讓主圖更突出 */}
                      <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右側：商品資訊區 - 優化：增加區塊間距到 32px (space-y-8) */}
          <div className="space-y-6 lg:space-y-8">
            {/* 商品基本資訊卡片 - 優化：增加內邊距與層次感 */}
            <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50 shadow-xl">
              {/* 品牌與系列 */}
              <div className="flex items-center space-x-3 mb-4 lg:mb-6">
                <Link
                  href={`/brands/${product.series.brand.slug}`}
                  className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-4 py-2 rounded-full hover:opacity-80 transition-all hover:scale-105 shadow-lg"
                >
                  {product.series.brand.name}
                </Link>
                <Link
                  href={`/series/${product.series.slug}`}
                  className="bg-slate-700 text-white px-4 py-2 rounded-full hover:bg-slate-600 transition-all hover:scale-105"
                >
                  {product.series.name}
                </Link>
              </div>

              {/* 商品名稱 */}
              <h1 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
                {product.name}
              </h1>

              {/* 簡短描述 */}
              {product.shortDescription && (
                <p className="text-slate-300 text-lg leading-relaxed mb-4 lg:mb-6">{product.shortDescription}</p>
              )}

              {/* 價格與剩餘數量 - 優化：增加呼吸空間 20px (gap-5) */}
              <div className="grid grid-cols-2 gap-5 mb-6 lg:mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl border border-orange-400/30 shadow-lg hover:shadow-xl transition-shadow">
                  <p className="text-sm text-slate-400 mb-2">單抽價格</p>
                  <p className="text-3xl font-black text-orange-400">NT$ {product.price}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 shadow-lg hover:shadow-xl transition-shadow">
                  <p className="text-sm text-slate-400 mb-2">🎟 剩餘抽數</p>
                  <p className="text-3xl font-black text-green-400">{remaining} 抽</p>
                </div>
              </div>

              {/* 進度條 */}
              <div className="mb-4 lg:mb-6">
                <div className="flex justify-between text-sm text-slate-300 mb-3">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-orange-400 rounded-full mr-2"></span>
                    已售出 {product.soldTickets} 抽
                  </span>
                  <span className="font-medium">
                    {remaining === product.totalTickets ? '尚未開抽' : `${progress}% 已售出`}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 via-pink-400 to-pink-500 transition-all duration-1000 shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 抽獎行動區 - 優化：增加內邊距與層次感 */}
            <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50 shadow-xl">
              {/* 心理誘因提示 - 優化：增加間距與層次 */}
              <div className="text-center mb-6 space-y-2">
                <p className="text-orange-400 font-bold text-base mb-1">
                  🔥 僅剩 {remaining} 抽！
                </p>
                <p className="text-slate-400 font-normal text-sm">
                  SSR 獎率提升中 ✨
                </p>
              </div>

              {/* 主要按鈕 - 優化：增加按鈕間距到 16px */}
              <div className="space-y-4">
                <button
                  className="group w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black py-5 px-8 rounded-2xl hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-[1.02] shadow-2xl hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  disabled={product.status !== 'active'}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <span className="text-xl">
                      {product.status === 'active' ? '立即抽獎' : '目前無法購買'}
                    </span>
                  </div>
                </button>

                <button className="w-full bg-transparent border border-slate-600/50 text-slate-400 font-normal py-3.5 px-6 rounded-2xl hover:border-slate-500 hover:text-slate-300 transition-all hover:bg-slate-700/30">
                  <span className="flex items-center justify-center space-x-2 text-sm">
                    <span>♡</span>
                    <span>加入追蹤</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 獎項列表 - 優化：增加內邊距與明確的分隔 */}
            {product.variants.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="text-2xl mr-3">🏆</span>
                  獎項內容
                </h2>
                <div className="space-y-4">
                  {product.variants.map((variant, index) => (
                    <div key={variant.id}>
                      <div
                        className="group flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 border border-slate-700/30 hover:border-orange-400/40"
                      >
                        <div className="flex items-center space-x-4">
                          {variant.imageUrl && (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                              <Image
                                src={variant.imageUrl}
                                alt={variant.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-base text-white group-hover:text-orange-400 transition-colors mb-1.5">
                              {variant.name}
                            </p>
                            {variant.rarity && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-gradient-to-r from-orange-400 to-pink-400 text-white px-2.5 py-0.5 rounded-full font-semibold">
                                  {variant.rarity}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-slate-400 text-sm font-normal mb-0.5">剩餘</div>
                          <div className="text-green-400 text-xl font-bold">{variant.stock}</div>
                        </div>
                      </div>
                      {/* 淡淡的分隔線 */}
                      {index < product.variants.length - 1 && (
                        <div className="h-px bg-slate-700/30 my-3 mx-4"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細描述 - 響應式內邊距 */}
            {product.longDescription && (
              <div className="bg-slate-800/30 rounded-3xl p-4 lg:p-6 backdrop-blur-sm border border-slate-700/50">
                <h2 className="text-2xl font-bold mb-4 lg:mb-5 flex items-center">
                  <span className="text-2xl mr-2">📋</span>
                  商品說明
                </h2>
                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{product.longDescription}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 抽獎系統區域 - 大幅增加底部間距，確保與 Footer 有充分呼吸空間 */}
        {product.variants.length > 0 && product.totalTickets > 0 && (
          <div className="mt-12 lg:mt-16 mb-40 lg:mb-56">
            {/* 抽獎區標題 - 優化：增加間距與視覺層次 */}
            <div className="text-center mb-8 lg:mb-10">
              <h3 className="text-slate-200 text-2xl font-bold mb-6">點選號碼開始您的幸運抽獎之旅</h3>
              <div className="flex justify-center items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-slate-600 rounded shadow-inner"></div>
                  <span className="text-slate-400 text-sm">未抽取</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-pink-400 rounded shadow-lg"></div>
                  <span className="text-slate-400 text-sm">已抽取</span>
                </div>
              </div>
            </div>

            {/* 抽獎系統組件 - 優化：增加內邊距與視覺層次 */}
            <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50 shadow-xl">
              <LotterySystem
                variants={product.variants}
                totalTickets={product.totalTickets}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateProgress, statusText, statusColor } from '@/types';
import LotterySystem from '@/components/LotterySystem';

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findFirst({
    where: {
      slug: params.slug,
    },
    include: {
      series: {
        include: {
          brand: true,
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      images: {
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

      {/* 商品主要內容 */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左側：圖片展示 */}
          <div className="space-y-4">
            {/* 主圖 */}
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-slate-800">
              <Image
                src={product.coverImage || `https://picsum.photos/800/600?random=${product.id}`}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {/* 狀態標籤 */}
              <div className="absolute top-4 right-4">
                <div className={`${statusColor[product.status]} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
                  {statusText[product.status]}
                </div>
              </div>
            </div>

            {/* 圖片畫廊 */}
            {product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-24 rounded-lg overflow-hidden bg-slate-800 cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                  >
                    <Image
                      src={image.url}
                      alt={`${product.name} 圖片 ${image.id}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右側：商品資訊 */}
          <div className="space-y-6">
            {/* 品牌與系列 */}
            <div className="flex items-center space-x-2 text-sm">
              <Link
                href={`/brands/${product.series.brand.slug}`}
                className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-4 py-1 rounded-full hover:opacity-80 transition-opacity"
              >
                {product.series.brand.name}
              </Link>
              <Link
                href={`/series/${product.series.slug}`}
                className="bg-slate-700 text-white px-4 py-1 rounded-full hover:bg-slate-600 transition-colors"
              >
                {product.series.name}
              </Link>
            </div>

            {/* 商品名稱 */}
            <h1 className="text-4xl font-bold">{product.name}</h1>

            {/* 簡短描述 */}
            {product.shortDescription && (
              <p className="text-slate-300 text-lg">{product.shortDescription}</p>
            )}

            {/* 價格 */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">單抽價格</p>
                  <p className="text-4xl font-bold text-orange-400">NT$ {product.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">總抽數</p>
                  <p className="text-2xl font-bold">{product.totalTickets} 抽</p>
                </div>
              </div>

              {/* 進度條 */}
              <div>
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>已售出 {product.soldTickets} 抽</span>
                  <span>剩餘 {remaining} 抽</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-slate-400 mt-2">{progress}% 已售出</p>
              </div>
            </div>

            {/* 購買按鈕 */}
            <div className="space-y-3">
              <button
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={product.status !== 'active'}
              >
                {product.status === 'active' ? '立即抽賞' : '目前無法購買'}
              </button>
              <button className="w-full bg-slate-700 text-white font-medium py-3 px-6 rounded-xl hover:bg-slate-600 transition-colors">
                加入追蹤
              </button>
            </div>

            {/* 獎項列表 */}
            {product.variants.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4">獎項內容</h2>
                <div className="space-y-3">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {variant.imageUrl && (
                          <div className="relative w-12 h-12 rounded overflow-hidden">
                            <Image
                              src={variant.imageUrl}
                              alt={variant.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{variant.name}</p>
                          {variant.rarity && (
                            <p className="text-xs text-orange-400">{variant.rarity}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm">
                        剩餘 {variant.stock} 個
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細描述 */}
            {product.longDescription && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4">商品說明</h2>
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-slate-300 whitespace-pre-wrap">{product.longDescription}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 抽獎系統區域 */}
        {product.variants.length > 0 && product.totalTickets > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">立即抽賞</h2>
              <p className="text-slate-400">點選號碼開始您的抽獎之旅</p>
            </div>
            <LotterySystem
              variants={product.variants}
              totalTickets={product.totalTickets}
            />
          </div>
        )}
      </div>
    </div>
  );
}

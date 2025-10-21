import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { calculateProgress, statusText, statusColor } from '@/types';

// 強制動態渲染，避免構建時連接資料庫
export const dynamic = 'force-dynamic';

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 15: await params before using
  const { slug } = await params;

  const series = await prisma.series.findFirst({
    where: {
      slug,
    },
    include: {
      brand: true,
      products: {
        where: {
          status: {
            in: ['active', 'sold_out'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!series) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 系列 Banner */}
      <div className="relative h-80 bg-gradient-to-r from-purple-600 to-blue-600">
        {series.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={series.coverImage}
              alt={series.name}
              fill
              className="object-cover opacity-30"
            />
          </div>
        )}
        <div className="relative max-w-screen-xl mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              首頁
            </Link>
            <span className="text-white/60">/</span>
            <Link
              href={`/brands/${series.brand.slug}`}
              className="text-white/80 hover:text-white transition-colors"
            >
              {series.brand.name}
            </Link>
            <span className="text-white/60">/</span>
            <span className="text-white font-medium">{series.name}</span>
          </div>

          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm mb-4 w-fit">
            {series.brand.name}
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">{series.name}</h1>

          {series.description && (
            <p className="text-white/90 text-lg max-w-3xl">{series.description}</p>
          )}

          <div className="mt-6 flex items-center space-x-6 text-white/80">
            <div>
              <span className="text-2xl font-bold text-white">{series.products.length}</span>
              <span className="ml-2">個商品</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">
                {series.products.filter((p) => p.status === 'active').length}
              </span>
              <span className="ml-2">進行中</span>
            </div>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {series.products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">此系列目前沒有商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {series.products.map((product) => {
              const progress = calculateProgress(product.soldTickets, product.totalTickets);
              const remaining = product.totalTickets - product.soldTickets;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="block"
                >
                  <div className="bg-slate-800/90 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-600/50 hover:border-orange-400/60 h-full">
                    {/* 狀態標籤 */}
                    <div className="absolute top-2 right-2 z-10">
                      <div className={`${statusColor[product.status]} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                        {statusText[product.status]}
                      </div>
                    </div>

                    {/* 圖片 */}
                    <div className="relative h-48">
                      <Image
                        src={product.coverImage || `https://picsum.photos/400/300?random=${product.id}`}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* 商品資訊 */}
                    <div className="p-4">
                      <h3 className="text-white font-bold text-base mb-2 line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>

                      {product.shortDescription && (
                        <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                          {product.shortDescription}
                        </p>
                      )}

                      {/* 進度條 */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>已售 {product.soldTickets}</span>
                          <span>剩餘 {remaining}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 價格 */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                        <div className="text-orange-400 font-bold text-lg">
                          NT$ {product.price}
                        </div>
                        <div className="text-slate-400 text-sm">
                          共 {product.totalTickets} 抽
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';

// 強制動態渲染，避免構建時連接資料庫
export const dynamic = 'force-dynamic';

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js 15: await params before using
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({
    where: {
      slug,
    },
    include: {
      series: {
        where: {
          isActive: true,
        },
        include: {
          products: {
            where: {
              status: 'active',
            },
            take: 8,
          },
          _count: {
            select: {
              products: {
                where: {
                  status: 'active',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!brand) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 品牌 Banner */}
      <div className="relative h-64 bg-gradient-to-r from-orange-500 to-pink-500">
        {brand.logoUrl && (
          <div className="absolute inset-0">
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              fill
              className="object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative max-w-screen-xl mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              首頁
            </Link>
            <span className="text-white/60">/</span>
            <span className="text-white font-medium">品牌</span>
            <span className="text-white/60">/</span>
            <span className="text-white font-medium">{brand.name}</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">{brand.name}</h1>
          {brand.description && (
            <p className="text-white/90 text-lg max-w-2xl">{brand.description}</p>
          )}
        </div>
      </div>

      {/* 系列列表 */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {brand.series.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">此品牌目前沒有系列</p>
          </div>
        ) : (
          <div className="space-y-16">
            {brand.series.map((series) => (
              <div key={series.id}>
                {/* 系列標題 */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{series.name}</h2>
                    {series.description && (
                      <p className="text-slate-400">{series.description}</p>
                    )}
                  </div>
                  <Link
                    href={`/series/${series.slug}`}
                    className="text-orange-400 hover:text-orange-300 transition-colors flex items-center space-x-1"
                  >
                    <span>查看全部 ({series._count.products})</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* 商品預覽 */}
                {series.products.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">此系列目前沒有商品</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {series.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="block group"
                      >
                        <div className="bg-slate-800/90 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-600/50 hover:border-orange-400/60">
                          <div className="relative h-48">
                            <Image
                              src={product.coverImage || `https://picsum.photos/400/300?random=${product.id}`}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-white font-bold mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-orange-400 font-bold">NT$ {product.price}</span>
                              <span className="text-slate-400 text-sm">
                                剩餘 {product.totalTickets - product.soldTickets}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

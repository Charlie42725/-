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
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Immersive Series Banner */}
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
        {series.coverImage ? (
          <div className="absolute inset-0">
            <Image
              src={series.coverImage}
              alt={series.name}
              fill
              className="object-cover opacity-60 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-zinc-900 opacity-50"></div>
        )}

        <div className="relative max-w-screen-xl mx-auto px-4 w-full z-10 pt-20">
          <div className="flex items-center space-x-2 text-sm mb-6 text-zinc-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">首頁</Link>
            <span>/</span>
            <Link href={`/brands/${series.brand.slug}`} className="hover:text-white transition-colors">
              {series.brand.name}
            </Link>
            <span>/</span>
            <span className="text-white">{series.name}</span>
          </div>

          <div className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/50 px-4 py-1.5 rounded-full text-sm font-bold mb-6 backdrop-blur-md">
            {series.brand.name}
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight max-w-4xl">
            {series.name}
          </h1>

          {series.description && (
            <p className="text-zinc-200 text-lg lg:text-xl max-w-2xl leading-relaxed mb-10 border-l-4 border-purple-500 pl-6 bg-black/30 p-4 rounded-r-xl backdrop-blur-sm">
              {series.description}
            </p>
          )}

          <div className="flex items-center space-x-10 text-white">
            <div className="flex items-baseline">
              <span className="text-4xl font-black">{series.products.length}</span>
              <span className="ml-2 text-zinc-500 font-bold uppercase text-sm tracking-wider">Total Items</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-black text-green-400">
                {series.products.filter((p) => p.status === 'active').length}
              </span>
              <span className="ml-2 text-zinc-500 font-bold uppercase text-sm tracking-wider">Live Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product List Grid */}
      <div className="max-w-screen-xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold flex items-center">
            <span className="w-2 h-8 bg-amber-500 mr-4 rounded-full"></span>
            系列商品
          </h2>
        </div>

        {series.products.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-zinc-500 text-xl">此系列目前沒有商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {series.products.map((product) => {
              const progress = calculateProgress(product.soldTickets, product.totalTickets);
              const remaining = product.totalTickets - product.soldTickets;
              const isSoldOut = product.status === 'sold_out';

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                >
                  <div className="relative bg-[#0f0f0f] rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] h-full flex flex-col">
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`${statusColor[product.status]} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md`}>
                        {statusText[product.status]}
                      </div>
                    </div>

                    {/* Image Area */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={product.coverImage || `https://picsum.photos/400/300?random=${product.id}`}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-50' : ''}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent opacity-80"></div>

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-4 left-4">
                        <p className="text-amber-400 font-black text-2xl drop-shadow-lg">
                          NT$ <span className="text-3xl">{product.price}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-white font-bold text-lg mb-3 line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {product.name}
                      </h3>

                      <div className="mt-auto space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-xs text-zinc-500 mb-1.5 font-bold">
                            <span>
                              <span className={isSoldOut ? 'text-red-500' : 'text-green-400'}>
                                {remaining}
                              </span> / {product.totalTickets} 抽
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-zinc-600' : 'bg-amber-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* CTA Button Mock */}
                        <div className="w-full py-3 bg-white/5 rounded-xl text-center text-sm font-bold text-zinc-300 group-hover:bg-amber-500 group-hover:text-white transition-all">
                          {isSoldOut ? '查看結果' : '立即開抽'}
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

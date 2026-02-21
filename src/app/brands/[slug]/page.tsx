import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';

const getBrandData = unstable_cache(
  async (slug: string) => {
    return prisma.brand.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: 'active' },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            totalTickets: true,
            soldTickets: true,
            coverImage: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },
  ['brand-detail'],
  { revalidate: 60 }
);

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const brand = await getBrandData(slug);

  if (!brand) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* 品牌 Banner */}
      <div className="relative h-64 bg-amber-500">
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

      {/* 商品列表 */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {brand.products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">此品牌目前沒有商品</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">全部商品 ({brand.products.length})</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4">
              {brand.products.map((product) => {
                const remaining = product.totalTickets - product.soldTickets;
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="block group"
                  >
                    <div className="bg-surface-1 rounded-lg overflow-hidden border border-white/[0.06] hover:border-amber-500/40 transition-all duration-300 md:hover:-translate-y-1 h-full flex flex-col">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={product.coverImage || `https://picsum.photos/400/300?random=${product.id}`}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2 md:p-3 flex-1">
                        <h3 className="text-white font-bold text-[11px] md:text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 bg-[#111] border-t border-white/[0.04]">
                        <span className="text-amber-400 font-black text-[11px] md:text-sm">NT${product.price}</span>
                        <span className="text-zinc-500 font-bold text-[11px] md:text-sm">
                          {remaining}/{product.totalTickets}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
                        {product.coverImage ? (
                          <Image
                            src={product.coverImage}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                            </svg>
                          </div>
                        )}
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

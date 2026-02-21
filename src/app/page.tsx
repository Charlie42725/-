import Banner from '@/components/Banner';
import ProductGrid from '@/components/ProductGrid';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';

const getHomeData = unstable_cache(
  async () => {
    const [products, banners] = await Promise.all([
      prisma.product.findMany({
        where: { status: { in: ['active', 'sold_out'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          brand: true,
          variants: { where: { isActive: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    return { products, banners };
  },
  ['home-data'],
  { revalidate: 30 }
);

export default async function Home() {
  const { products, banners } = await getHomeData();

  // 最近上架：最新 8 個
  const recentProducts = products.slice(0, 8);

  // 按品牌分組（保留 createdAt 排序）
  const brandMap = new Map<string, { name: string; slug: string; products: typeof products }>();
  for (const p of products) {
    const key = p.brand.slug;
    if (!brandMap.has(key)) {
      brandMap.set(key, { name: p.brand.name, slug: p.brand.slug, products: [] });
    }
    brandMap.get(key)!.products.push(p);
  }
  const brandGroups = Array.from(brandMap.values());

  return (
    <div className="min-h-screen text-white w-full flex flex-col">
      <Banner initialBanners={banners} />

      <main className="w-full">
        <div className="max-w-screen-xl mx-auto px-3 md:px-4 py-6 md:py-12">

          {/* 最近上架 */}
          <section className="mb-10 md:mb-16">
            <div className="flex items-center mb-5 md:mb-8">
              <span className="w-1.5 md:w-2 h-7 md:h-9 bg-amber-400 rounded-full mr-3 md:mr-4" />
              <h2 className="text-xl md:text-3xl font-heading font-black text-white tracking-tight">
                最近上架
              </h2>
            </div>
            <ProductGrid initialProducts={recentProducts} />
          </section>

          {/* 按系列（品牌）分組 */}
          {brandGroups.map((group) => (
            <section key={group.slug} className="mb-10 md:mb-16">
              <div className="flex items-center justify-between mb-5 md:mb-8">
                <div className="flex items-center">
                  <span className="w-1.5 md:w-2 h-7 md:h-9 bg-amber-400 rounded-full mr-3 md:mr-4" />
                  <h2 className="text-xl md:text-3xl font-heading font-black text-white tracking-tight">
                    {group.name}
                  </h2>
                  <span className="ml-2 md:ml-3 text-zinc-500 text-sm md:text-base font-medium">
                    {group.products.length} 款
                  </span>
                </div>
                <Link
                  href={`/brands/${group.slug}`}
                  className="text-amber-400 hover:text-amber-300 text-sm md:text-base font-medium transition-colors flex items-center gap-1"
                >
                  查看全部
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
              <ProductGrid initialProducts={group.products} />
            </section>
          ))}

        </div>
      </main>
    </div>
  );
}

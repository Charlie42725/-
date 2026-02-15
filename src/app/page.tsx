import Banner from '@/components/Banner';
import FilterSection from '@/components/FilterSection';
import ProductGrid from '@/components/ProductGrid';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';

// 快取首頁資料，30 秒內不重複查 DB
const getHomeData = unstable_cache(
  async () => {
    const [products, brands, banners] = await Promise.all([
      prisma.product.findMany({
        where: { status: { in: ['active', 'sold_out'] } },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          series: { include: { brand: true } },
          variants: { where: { isActive: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        include: {
          series: {
            where: { isActive: true },
            include: { _count: { select: { products: { where: { status: 'active' } } } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    return { products, brands, banners };
  },
  ['home-data'],
  { revalidate: 30 }
);

export default async function Home() {
  const { products: productsData, brands: brandsData, banners: bannersData } = await getHomeData();

  return (
    <div className="min-h-screen text-white w-full flex flex-col">
      {/* 主要 Banner */}
      <Banner initialBanners={bannersData} />

      {/* 篩選區域 */}
      <FilterSection initialBrands={brandsData} />

      {/* 最新一番賞區域 */}
      <main className="w-full">
        <div className="max-w-screen-xl mx-auto px-3 md:px-4 py-8 md:py-16">
          <section className="mb-12 md:mb-20">
            <div className="flex items-center mb-6 md:mb-10">
              <span className="w-1.5 md:w-2 h-8 md:h-10 bg-amber-400 rounded-full mr-3 md:mr-4"></span>
              <h2 className="text-2xl md:text-4xl font-heading font-black text-white tracking-tight">
                最新一番賞 <span className="text-amber-500 text-xs md:text-lg ml-1 md:ml-2 font-bold tracking-widest uppercase">New Arrivals</span>
              </h2>
            </div>

            <ProductGrid initialProducts={productsData} />
          </section>

        </div>
      </main>
    </div>
  );
}

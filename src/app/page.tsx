import Banner from '@/components/Banner';
import FilterSection from '@/components/FilterSection';
import ProductGrid from '@/components/ProductGrid';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';

// 快取首頁資料，30 秒內不重複查 DB
const getHomeData = unstable_cache(
  async () => {
    const [products, brands] = await Promise.all([
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
    ]);
    return { products, brands };
  },
  ['home-data'],
  { revalidate: 30 }
);

export default async function Home() {
  const { products: productsData, brands: brandsData } = await getHomeData();

  return (
    <div className="min-h-screen bg-gray-900 text-white w-full flex flex-col">
      {/* 主要 Banner */}
      <Banner />

      {/* 篩選區域 */}
      <FilterSection initialBrands={brandsData} />

      {/* 最新一番賞區域 */}
      <main className="w-full">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <section className="mb-20">
            <div className="flex items-center mb-10">
              <span className="w-2 h-10 bg-orange-400 rounded-full mr-4"></span>
              <h2 className="text-4xl font-heading font-black text-white tracking-tight">
                最新一番賞 <span className="text-orange-500 text-lg ml-2 font-bold tracking-widest uppercase">New Arrivals</span>
              </h2>
            </div>

            <ProductGrid initialProducts={productsData} />
          </section>

          {/* 說明區域 */}
          <section className="mt-24 mb-16 bg-[#141414] border border-white/8 rounded-3xl p-12">
            {/* 第一區塊 */}
            <div className="text-center mb-20">
              <h3 className="text-4xl font-heading font-bold mb-8 text-orange-400">一番賞怎麼玩？</h3>
              <p className="text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed text-lg">
                想試手氣帶走夢寐以求的動漫或原創IP周邊嗎？在失控抽抽參與一番賞抽獎非常簡單！您只需要瀏覽我們豐富的一番賞系列，選擇您喜愛的款式，然後決定您想抽賞的次數。與一般抽獎不同的是，一番賞每次抽賞都有機會獲得不同等級的獎品，從可愛的小飾品到珍藏版模型應有盡有！
              </p>
            </div>

            <hr className="border-slate-600 mb-20 opacity-50" />

            {/* 第二區塊 */}
            <div className="text-center mb-20">
              <h3 className="text-4xl font-heading font-bold mb-8 text-slate-200">為什麼選擇我們？</h3>
              <p className="text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed text-lg">
                我們致力於提供最公平、最透明的一番賞抽獎體驗。透過區塊鏈 Hash 驗證技術，確保每一次抽獎結果公正無法竄改。無論是收藏家還是初次嘗試的新手，都能在這裡享受安心又刺激的抽賞樂趣！
              </p>
            </div>

            <hr className="border-slate-600 mb-20 opacity-50" />

            {/* 特色區塊 */}
            <div className="text-center">
              <h3 className="text-4xl font-heading font-bold mb-16 text-orange-400">失控抽抽特色</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                <div className="text-center p-8 bg-[#1c1c1c] border border-white/8 rounded-2xl hover:border-orange-500/30 transition-all duration-200 hover:-translate-y-1">
                  <div className="w-24 h-24 bg-orange-500/15 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h4 className="font-heading font-bold text-white mb-6 text-xl">一番賞 GK 免費修復</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    我們提供免費保修服務，若您收到的一番賞 GK 商品在運送途中發生破損，符合條件即可享受免費的修復服務！
                  </p>
                </div>

                <div className="text-center p-8 bg-[#1c1c1c] border border-white/8 rounded-2xl hover:border-orange-500/30 transition-all duration-200 hover:-translate-y-1">
                  <div className="w-24 h-24 bg-orange-500/15 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a48.667 48.667 0 00-1.242 8.008M4.5 10.5a48.662 48.662 0 017.374-1.83M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5" />
                    </svg>
                  </div>
                  <h4 className="font-heading font-bold text-white mb-6 text-xl">Hash 驗證</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    透過區塊鏈 Hash 值進行大賞號碼抽選驗證，Hash 值具有不可修改、不可偽造的特性，確保每一次抽獎結果公正透明，任何人都可以驗證。
                  </p>
                </div>

                <div className="text-center p-8 bg-[#1c1c1c] border border-white/8 rounded-2xl hover:border-orange-500/30 transition-all duration-200 hover:-translate-y-1">
                  <div className="w-24 h-24 bg-orange-500/15 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.998 2.998 0 00.75-1.976V5.25A2.25 2.25 0 016 3h12a2.25 2.25 0 012.25 2.25v2.123a3 3 0 01-.75 1.976" />
                    </svg>
                  </div>
                  <h4 className="font-heading font-bold text-white mb-6 text-xl">實體店面</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    我們同時擁有實體店面與線上平台，讓您可以親臨門市體驗，也能隨時隨地透過網站，更方便地享受一番賞的樂趣！
                  </p>
                </div>

                <div className="text-center p-8 bg-[#1c1c1c] border border-white/8 rounded-2xl hover:border-orange-500/30 transition-all duration-200 hover:-translate-y-1">
                  <div className="w-24 h-24 bg-orange-500/15 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <h4 className="font-heading font-bold text-white mb-6 text-xl">任務回饋</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    獨家任務回饋系統，完成指定任務即可獲得獎賞幣，用來兌換多種優惠券，讓您用更划算的方式享受一番賞的樂趣！
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

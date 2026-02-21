'use client';

import { useState, useEffect } from 'react';

interface Brand {
  id: number;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface FilterSectionProps {
  initialBrands?: Brand[];
}

export default function FilterSection({ initialBrands }: FilterSectionProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(initialBrands || []);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  useEffect(() => {
    // 如果有預取資料，跳過 API 請求
    if (initialBrands) return;

    async function fetchBrands() {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        setBrands(data.brands);
      } catch (error) {
        console.error('無法載入品牌資料:', error);
      }
    }

    fetchBrands();
  }, [initialBrands]);

  return (
    <section className="w-full py-2 mt-2 mb-4">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="p-6">
          <div className="flex items-center justify-between">
          {/* 篩選按鈕 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              <span className="font-semibold">篩選條件</span>
            </button>

            <button className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold">追蹤賞品</span>
            </button>
          </div>

          {/* 排序選項 */}
          <div className="hidden md:flex items-center space-x-3">
            <span className="text-zinc-400 text-sm font-medium">排序：</span>
            <select className="bg-surface-2 text-white border border-[var(--border)] rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
              <option>最新發佈</option>
              <option>價格低到高</option>
              <option>價格高到低</option>
              <option>熱門程度</option>
            </select>
          </div>
        </div>

        {/* 展開的篩選面板 */}
        {isFilterOpen && (
          <div className="mt-4 bg-surface-1 rounded-lg p-4 border border-[var(--border)] slide-down">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 類別篩選 */}
              <div>
                <label className="block text-white font-bold mb-2">類別</label>
                <select className="w-full bg-surface-2 text-white border border-[var(--border)] rounded px-3 py-2">
                  <option>全部類別</option>
                  <option>ACG動漫</option>
                  <option>潮流玩具</option>
                  <option>遊戲周邊</option>
                  <option>模型公仔</option>
                </select>
              </div>

              {/* 品牌篩選 */}
              <div>
                <label className="block text-white font-bold mb-2">品牌</label>
                <select
                  className="w-full bg-surface-2 text-white border border-[var(--border)] rounded px-3 py-2"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  <option value="">全部品牌</option>
                  {brands?.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name} ({brand._count.products} 個商品)
                    </option>
                  ))}
                </select>
              </div>

              {/* 價格範圍 */}
              <div>
                <label className="block text-white font-bold mb-2">價格範圍</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="最低"
                    className="w-full bg-surface-2 text-white border border-[var(--border)] rounded px-3 py-2"
                  />
                  <span className="text-white self-center">-</span>
                  <input
                    type="number"
                    placeholder="最高"
                    className="w-full bg-surface-2 text-white border border-[var(--border)] rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* 狀態篩選 */}
              <div>
                <label className="block text-white font-bold mb-2">狀態</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-white text-sm">進行中</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-white text-sm">即將開始</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-white text-sm">已完賞</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 篩選按鈕 */}
            <div className="flex justify-end space-x-2 mt-4">
              <button className="px-4 py-2 bg-white/[0.10] hover:bg-white/[0.15] text-white rounded transition-colors">
                重置
              </button>
              <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors">
                套用篩選
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

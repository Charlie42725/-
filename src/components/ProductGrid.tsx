'use client';

import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  series: string;
  tags: string[];
  remaining: number;
  total: number;
}

export default function ProductGrid() {
  const products: Product[] = [
    {
      id: 1,
      name: 'Apple iPhone 17 Pro Max\nApple Watch Ultra 3\nAirPods Max',
      image: '/assets/images/products/product1.jpg',
      price: 490,
      series: '蘋果套裝系列',
      tags: ['熱門自白商機'],
      remaining: 490,
      total: 500
    },
    {
      id: 2,
      name: '【ECG】\n心可希望5平台\n龍主一平台千\n小語速玖周績\n小語 星可進人私戰系列\n小講 星可進身人品調千平',
      image: '/assets/images/products/product2.jpg',
      price: 376,
      series: '蒙可希賞套系列',
      tags: ['搶搶'],
      remaining: 376,
      total: 400
    },
    {
      id: 3,
      name: 'EGG x Cheese 自關美術店\n自主科技款\nPYAP 塞處主貸\nEGG 自陸主美\n好父貸亞三季\n技父公昌',
      image: '/assets/images/products/product3.jpg',
      price: 402,
      series: '蒙可變愛套系列',
      tags: ['仍月天'],
      remaining: 402,
      total: 450
    },
    {
      id: 4,
      name: 'GEISHUI社\n官可德東真\n百色戰SMCAI貨\n官可科五美仍\n官可科技系戰星千\n官可科五般滿',
      image: '/assets/images/products/product4.jpg',
      price: 398,
      series: '蒙可變愛套系列',
      tags: ['熱搶'],
      remaining: 398,
      total: 400
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl border border-slate-700 hover:border-orange-400 product-card">
          {/* 商品圖片 */}
          <div className="relative aspect-square group">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              onError={(e) => {
                // 如果圖片載入失敗，使用線上佔位圖
                e.currentTarget.src = `https://picsum.photos/400/400?random=${product.id}`;
              }}
            />
            
            {/* 深色遮罩提升文字對比 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* 標籤 */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-lg ${
                    tag === '熱門自白商機' || tag === '熱搶' 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                      : tag === '搶搶'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : tag === '仍月天'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'
                      : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 狀態標示 - 右上角 */}
            <div className="absolute top-3 right-3">
              {product.remaining === product.total ? (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  進行中
                </div>
              ) : product.remaining === 0 ? (
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  已完結
                </div>
              ) : (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  熱搶中
                </div>
              )}
            </div>
          </div>

          {/* 商品資訊 */}
          <div className="p-4 space-y-3">
            {/* 系列名稱 - 更清晰的層級 */}
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">
              {product.series}
            </div>
            
            {/* 商品名稱 */}
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-3 min-h-[60px]">
              {product.name}
            </h3>
            
            {/* 價格資訊 - 更突出 */}
            <div className="bg-slate-700/50 rounded-lg p-2">
              <div className="text-orange-400 font-bold text-base">
                套票系列{product.price}
              </div>
              <div className="text-xs text-slate-400">每抽價格</div>
            </div>

            {/* 進度條 - 改進視覺效果 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400">剩餘 {product.remaining}</span>
                <span className="text-slate-400">總數 {product.total}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 via-green-400 to-yellow-400 h-full rounded-full transition-all duration-1000 shadow-inner"
                  style={{ width: `${(product.remaining / product.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-center text-xs text-slate-400">
                完成度: {Math.round(((product.total - product.remaining) / product.total) * 100)}%
              </div>
            </div>

            {/* 抽賞按鈕 - 更吸引人的設計 */}
            <button className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>立即抽賞</span>
              </div>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
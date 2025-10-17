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
      name: '蘋果家族系列484 - 一次暴擊降價中',
      image: '/assets/images/products/product1.jpg',
      price: 115,
      series: '蘋果家族系列',
      tags: ['仍有大賞'],
      remaining: 1449,
      total: 2000
    },
    {
      id: 2,
      name: 'Samsung Galaxy系列 - 旗艦手機組合',
      image: '/assets/images/products/product2.jpg',
      price: 89,
      series: 'Galaxy系列',
      tags: ['限時特惠'],
      remaining: 856,
      total: 1200
    },
    {
      id: 3,
      name: 'MacBook Pro M4 + iPad組合',
      image: '/assets/images/products/product3.jpg',
      price: 256,
      series: '專業工作系列',
      tags: ['熱門'],
      remaining: 123,
      total: 500
    },
    {
      id: 4,
      name: 'AirPods + Apple Watch組合',
      image: '/assets/images/products/product4.jpg',
      price: 67,
      series: '配件系列',
      tags: ['搶購中'],
      remaining: 234,
      total: 800
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-2xl hover:shadow-3xl border border-slate-600/50 hover:border-orange-400/70 backdrop-blur-sm">
          {/* 商品圖片區域 */}
          <div className="relative">
            {/* 主要產品圖片 */}
            <div className="relative h-48 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-orange-900/30 overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/400/300?random=${product.id}`;
                }}
              />
              
              {/* 深色遮罩提升文字對比 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* 標籤 - 仍有大賞 */}
            <div className="absolute top-3 right-3">
              {product.tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform -rotate-12 border border-red-400"
                >
                  ⚡ {tag}
                </div>
              ))}
            </div>

            {/* 無標誌控制 - 左上角 */}
            <div className="absolute top-3 left-3">
              <div className="bg-black/70 backdrop-blur-sm text-white/90 px-2 py-1 rounded text-xs font-medium border border-slate-600/50">
                🏆 優質選擇
              </div>
            </div>
          </div>

          {/* 商品資訊區域 */}
          <div className="p-4 space-y-3 bg-gradient-to-b from-slate-800/95 to-slate-900/95">
            {/* 標題 */}
            <div className="space-y-2">
              <h3 className="text-white font-bold text-sm leading-tight">
                {product.name}
              </h3>
              <div className="text-slate-400 text-xs">
                全品項10/15後方可優先安排面交和寄送
              </div>
            </div>

            {/* 產品清單 */}
            <div className="space-y-1 text-xs text-slate-300">
              <div>• Apple iPhone 17 Pro Max</div>
              <div>• Apple iPhone 17</div>
              <div>• Apple Watch Ultra 3</div>
              <div>• Apple iPad Air 11吋 M3</div>
            </div>

            {/* 參與人數 */}
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span className="text-slate-400 text-xs">參賽員</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span className="text-white font-bold">{Math.floor(product.total / 8)}</span>
                </div>
              </div>
            </div>

            {/* 獎金顯示 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                  💰 {product.price}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  💚 {product.remaining}/{product.total}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
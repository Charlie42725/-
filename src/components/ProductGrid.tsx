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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <div key={product.id} className="bg-slate-800/90 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-600/50 hover:border-orange-400/60">
          {/* 浮動標籤 */}
          <div className="absolute top-2 right-2 z-10">
            {product.tags.map((tag, index) => (
              <div
                key={index}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold mb-2"
              >
                <i className="fa-solid fa-dragon mr-1"></i>
                {tag}
              </div>
            ))}
          </div>

          {/* 圖片區域 */}
          <div className="relative">
            <div className="relative h-48">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover w-full"
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/400/300?random=${product.id}`;
                }}
              />
              
              {/* 角色標籤 */}
              <div className="absolute bottom-2 left-2">
                <div className="mb-1">
                  <span className="bg-slate-700/80 text-white px-2 py-1 rounded text-xs">無</span>
                </div>
                <div>
                  <span className="bg-slate-700/80 text-white px-2 py-1 rounded text-xs">機械族</span>
                </div>
              </div>
            </div>
          </div>

          {/* 標題 */}
          <h3 className="text-white font-bold text-base p-2 mb-0">
            {product.series}{product.price}
          </h3>

          {/* 商品描述 */}
          <div className="px-2 pb-0">
            <p className="text-slate-300 text-sm leading-relaxed">
              Apple iPhone 17 Pro Max<br/>
              Apple Watch Ultra 3<br/>
              AirPods Max
            </p>
          </div>

          {/* 底部資訊區 */}
          <div className="p-0">
            {/* 店家資訊 */}
            <div className="p-2">
              <span className="text-slate-400 text-sm mr-4">
                <i className="fa-solid fa-shop mr-1"></i>套套屋
              </span>
              <span className="text-slate-400 text-sm">
                <i className="fa-solid fa-dragon mr-1"></i>0/4
              </span>
            </div>
            
            {/* 價格和數量 - 分欄布局 */}
            <div className="grid grid-cols-2">
              <div className="p-2 pr-1 border-r border-slate-600/30">
                <div className="text-orange-400 font-bold">
                  <i className="fa-solid fa-coins mr-1"></i>{product.price}
                </div>
              </div>
              <div className="p-2 pl-1">
                <div className="text-green-400 font-medium">
                  <i className="fa-solid fa-tags mr-1"></i>
                  <span>{product.remaining}/{product.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
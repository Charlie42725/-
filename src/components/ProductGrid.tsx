'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard, calculateProgress, statusText, statusColor } from '@/types';

export default function ProductGrid() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?limit=12');
        if (!response.ok) throw new Error('無法載入商品');

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/90 rounded-xl overflow-hidden h-96 animate-pulse">
            <div className="h-48 bg-slate-700"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">目前沒有商品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => {
        const progress = calculateProgress(product.soldTickets, product.totalTickets);
        const remaining = product.totalTickets - product.soldTickets;

        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="block"
          >
            <div className="bg-slate-800/90 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-600/50 hover:border-orange-400/60 h-full">
              {/* 狀態標籤 */}
              <div className="absolute top-2 right-2 z-10">
                <div className={`${statusColor[product.status]} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                  {statusText[product.status]}
                </div>
              </div>

              {/* 圖片區域 */}
              <div className="relative h-48">
                <Image
                  src={product.coverImage || `https://picsum.photos/400/300?random=${product.id}`}
                  alt={product.name}
                  fill
                  className="object-cover w-full"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/400/300?random=${product.id}`;
                  }}
                />

                {/* 品牌標籤 */}
                <div className="absolute bottom-2 left-2">
                  <span className="bg-slate-700/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    {product.series.brand.name}
                  </span>
                </div>
              </div>

              {/* 商品資訊 */}
              <div className="p-4">
                {/* 標題 */}
                <h3 className="text-white font-bold text-base mb-2 line-clamp-2 min-h-[3rem]">
                  {product.name}
                </h3>

                {/* 系列名稱 */}
                <p className="text-slate-400 text-sm mb-3">
                  {product.series.name}
                </p>

                {/* 簡短描述 */}
                {product.shortDescription && (
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                    {product.shortDescription}
                  </p>
                )}

                {/* 進度條 */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>已售 {product.soldTickets}</span>
                    <span>剩餘 {remaining}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 價格和數量 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <div className="text-orange-400 font-bold text-lg">
                    NT$ {product.price}
                  </div>
                  <div className="text-slate-400 text-sm">
                    共 {product.totalTickets} 抽
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
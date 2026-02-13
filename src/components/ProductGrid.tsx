'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard, calculateProgress, statusText, statusColor } from '@/types';

interface ProductGridProps {
  initialProducts?: ProductCard[];
}

export default function ProductGrid({ initialProducts }: ProductGridProps) {
  const [products, setProducts] = useState<ProductCard[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果有預取資料，跳過 API 請求
    if (initialProducts) return;

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
  }, [initialProducts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0f0f0f] rounded-2xl overflow-hidden animate-pulse border border-white/5 h-full flex flex-col">
            {/* Image skeleton */}
            <div className="relative aspect-[4/3] bg-slate-800/50"></div>
            {/* Content skeleton */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="h-5 bg-slate-800/50 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-slate-800/50 rounded w-1/2 mb-6"></div>
              <div className="mt-auto space-y-4">
                {/* Progress bar skeleton */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <div className="h-3 bg-slate-800/50 rounded w-16"></div>
                    <div className="h-3 bg-slate-800/50 rounded w-8"></div>
                  </div>
                  <div className="h-2 bg-slate-800/50 rounded-full"></div>
                </div>
                {/* CTA skeleton */}
                <div className="h-11 bg-slate-800/30 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-red-500/20">
        <p className="text-red-400 text-lg flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50">
        <p className="text-slate-400 text-lg">目前沒有商品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => {
        const progress = calculateProgress(product.soldTickets, product.totalTickets);
        const remaining = product.totalTickets - product.soldTickets;
        const isSoldOut = product.status === 'sold_out';

        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block"
          >
            <div className="relative bg-[#0f0f0f] rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] h-full flex flex-col">
              {/* Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className={`${statusColor[product.status]} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md`}>
                  {statusText[product.status]}
                </div>
              </div>

              {/* Image Area */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={product.coverImage || `https://picsum.photos/400/300?random=${product.id}`}
                  alt={product.name}
                  fill
                  className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-50' : ''}`}
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/400/300?random=${product.id}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent opacity-80"></div>

                {/* Brand Tag */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
                    {product.series.brand.name}
                  </span>
                </div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-4 left-4">
                  <p className="text-orange-400 font-black text-2xl drop-shadow-lg">
                    NT$ <span className="text-3xl">{product.price}</span>
                  </p>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-white font-heading font-bold text-lg mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors duration-200 min-h-[3.5rem]">
                  {product.name}
                </h3>

                <div className="mt-auto space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
                      <span>
                        <span className={isSoldOut ? 'text-red-500' : 'text-green-400'}>
                          {remaining}
                        </span> / {product.totalTickets} 抽
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-slate-600' : 'bg-gradient-to-r from-orange-400 to-pink-500'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CTA Button Mock */}
                  <div className="w-full py-3 bg-white/5 rounded-xl text-center text-sm font-bold text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    {isSoldOut ? '查看結果' : '立即開抽'}
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

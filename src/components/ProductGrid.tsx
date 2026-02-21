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
  const [queueCounts, setQueueCounts] = useState<Record<number, number>>({});

  // 批次查詢排隊人數
  const fetchQueueCounts = async (productList: ProductCard[]) => {
    const activeIds = productList
      .filter((p) => p.status === 'active')
      .map((p) => p.id);
    if (activeIds.length === 0) return;

    try {
      const res = await fetch(`/api/queue/counts?productIds=${activeIds.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setQueueCounts(data.counts || {});
      }
    } catch {
      // 忽略
    }
  };

  useEffect(() => {
    if (initialProducts) {
      fetchQueueCounts(initialProducts);
      return;
    }

    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?limit=12');
        if (!response.ok) throw new Error('無法載入商品');

        const data = await response.json();
        setProducts(data.products);
        fetchQueueCounts(data.products);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-surface-1 rounded-lg overflow-hidden animate-pulse border border-white/5 flex flex-col">
            <div className="relative aspect-[4/3] bg-white/[0.04]"></div>
            <div className="p-2.5 md:p-4 flex-1 flex flex-col gap-2">
              <div className="h-4 bg-white/[0.04] rounded w-3/4"></div>
              <div className="h-3 bg-white/[0.04] rounded w-full"></div>
              <div className="h-3 bg-white/[0.04] rounded w-2/3"></div>
            </div>
            <div className="h-9 bg-white/[0.03]"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-white/[0.03] rounded-3xl border border-rose-500/20">
        <p className="text-rose-400 text-lg flex items-center justify-center">
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
      <div className="text-center py-20 bg-white/[0.03] rounded-3xl border border-[var(--border)]">
        <p className="text-zinc-500 text-lg">目前沒有商品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4">
      {products.map((product, index) => {
        const progress = calculateProgress(product.soldTickets, product.totalTickets);
        const remaining = product.totalTickets - product.soldTickets;
        const isSoldOut = product.status === 'sold_out';
        const variants = product.variants || [];

        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block fade-in-up"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <div className="relative bg-surface-1 rounded-lg md:rounded-xl overflow-hidden border border-[var(--border)] hover:border-amber-500/30 transition-all duration-300 md:hover:-translate-y-1 h-full flex flex-col">

              {/* Status Badge */}
              <div className="absolute top-1.5 right-1.5 md:top-2.5 md:right-2.5 z-10 flex flex-col items-end gap-1">
                <div className={`${statusColor[product.status]} text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] md:text-xs font-bold shadow-lg`}>
                  {statusText[product.status]}
                </div>
                {(queueCounts[product.id] || 0) > 0 && (
                  <div className="bg-amber-500 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] md:text-xs font-bold shadow-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    {queueCounts[product.id]} 人排隊中
                  </div>
                )}
              </div>

              {/* Image Area */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {product.coverImage ? (
                  <Image
                    src={product.coverImage}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale opacity-60' : ''}`}
                  />
                ) : (
                  <div className={`w-full h-full bg-surface-2 flex items-center justify-center ${isSoldOut ? 'opacity-60' : ''}`}>
                    <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                {/* Brand Tag - bottom left of image */}
                <div className="absolute bottom-1.5 left-1.5 md:bottom-2.5 md:left-2.5 z-10 flex items-center gap-1">
                  <span className="bg-black/70 backdrop-blur-sm text-zinc-300 text-[9px] md:text-[11px] font-bold px-1.5 py-0.5 rounded">
                    {product.brand.name}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-2 md:p-3 flex-1 flex flex-col">
                {/* Product Title */}
                <h3 className="text-white font-bold text-[11px] md:text-sm leading-snug line-clamp-1 md:line-clamp-2 mb-1 md:mb-2 group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>

                {/* Variant/Prize List */}
                {variants.length > 0 && (
                  <div className="flex-1 mb-1.5 md:mb-2">
                    <ul className="space-y-0 md:space-y-0.5">
                      {variants.slice(0, 6).map((v) => (
                        <li key={v.id} className="text-white text-[9px] md:text-xs leading-relaxed truncate">
                          {v.prize} {v.name}
                        </li>
                      ))}
                      {variants.length > 6 && (
                        <li className="text-zinc-600 text-[9px] md:text-xs">
                          ...還有 {variants.length - 6} 項
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Spacer - only when no variants */}
                {variants.length === 0 && <div className="flex-1"></div>}
              </div>

              {/* Bottom Info Bar */}
              <div className="flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 bg-surface-deep border-t border-[var(--border)]">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.95 5.95 0 01-.4-.821h1.664a1 1 0 000-2H8.063a7.343 7.343 0 010-1h1.937a1 1 0 000-2H8.336c.14-.292.302-.57.4-.821z" />
                  </svg>
                  <span className="text-amber-400 font-black text-[11px] md:text-sm">{product.price}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className={`font-bold text-[11px] md:text-sm ${isSoldOut ? 'text-rose-400' : 'text-zinc-300'}`}>
                    {remaining}/{product.totalTickets}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

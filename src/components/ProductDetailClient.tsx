'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Variant {
  id: number;
  prize: string;
  name: string;
  rarity: string | null;
  value: number;
  stock: number;
  imageUrl: string | null;
  _count?: {
    lotteryDraws: number;
  };
}

interface ProductDetailClientProps {
  initialVariants: Variant[];
  productId: number;
}

export default function ProductDetailClient({
  initialVariants,
  productId
}: ProductDetailClientProps) {
  // 獎項排序函數：A賞 -> Z賞 -> Last賞 -> 其他
  const sortVariants = (variants: Variant[]) => {
    return [...variants].sort((a, b) => {
      const getPrizeOrder = (prize: string) => {
        // Last賞排在最後
        if (prize.toLowerCase().includes('last')) return 999;

        // 提取賞級字母（A、B、C等）
        const match = prize.match(/([A-Z])/i);
        if (match) {
          return match[1].toUpperCase().charCodeAt(0);
        }

        // 無法識別的放在最後
        return 1000;
      };

      return getPrizeOrder(a.prize) - getPrizeOrder(b.prize);
    });
  };

  const [variants, setVariants] = useState<Variant[]>(sortVariants(initialVariants));

  useEffect(() => {
    // 監聽獎項更新事件
    const handleVariantsUpdated = (event: CustomEvent) => {
      if (event.detail.productId === productId) {
        setVariants(sortVariants(event.detail.variants));
      }
    };

    window.addEventListener('variantsUpdated', handleVariantsUpdated as EventListener);

    return () => {
      window.removeEventListener('variantsUpdated', handleVariantsUpdated as EventListener);
    };
  }, [productId]);

  // 取得稀有度背景色
  const getRarityClass = (rarity: string | null) => {
    const r = rarity?.toUpperCase() || '';
    if (r === 'SSR') return 'rarity-bg-ssr';
    if (r === 'SR') return 'rarity-bg-sr';
    if (r === 'R') return 'rarity-bg-r';
    return 'bg-slate-800';
  };

  return (
    <div className="bg-transparent rounded-none p-0 border-0 shadow-none">
      <div className="space-y-3">
        {variants.map((variant) => {
          const remaining = variant.stock - (variant._count?.lotteryDraws || 0);
          const isSoldOut = remaining <= 0;
          const progress = variant.stock > 0 ? (remaining / variant.stock) * 100 : 0;

          return (
            <div
              key={variant.id}
              className={`
                group relative flex items-center p-3 rounded-lg overflow-hidden 
                ${isSoldOut ? 'bg-[#1a1a1a] opacity-60' : 'bg-[#151515] hover:bg-[#1f1f1f]'} 
                border border-white/5 hover:border-white/10 transition-all duration-200
              `}
            >
              {/* Left: Image & Grade */}
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 mr-4 bg-black/50">
                {variant.imageUrl ? (
                  <Image
                    src={variant.imageUrl}
                    alt={variant.name}
                    fill
                    className={`object-cover ${isSoldOut ? 'grayscale' : ''}`}
                  />
                ) : null}

                {/* Grade Badge */}
                <div className="absolute top-0 left-0">
                  <span className={`
                      text-[10px] font-black px-1.5 py-0.5 rounded-br-md shadow-sm
                      ${variant.prize.toLowerCase().includes('last')
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                      : 'bg-black/80 text-white backdrop-blur-sm'}
                    `}>
                    {variant.prize}
                  </span>
                </div>
              </div>

              {/* Center: Info */}
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center mb-1">
                  <h3 className={`text-sm font-bold truncate ${isSoldOut ? 'text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>
                    {variant.name}
                  </h3>
                  {variant.rarity && (
                    <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${getRarityClass(variant.rarity).replace('bg-', 'bg-gradient-to-r from-').replace('to-', 'to-')} text-white`}>
                      {variant.rarity}
                    </span>
                  )}
                </div>

                {/* Stock Bar */}
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSoldOut ? 'bg-slate-600' : 'bg-gradient-to-r from-orange-400 to-pink-500'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-400">
                    <span className={isSoldOut ? 'text-red-500' : 'text-green-400'}>{remaining}</span>
                    <span className="opacity-50">/{variant.stock}</span>
                  </div>
                </div>
              </div>

              {/* Right: Status Icon / Value */}
              <div className="text-right flex-shrink-0">
                {isSoldOut ? (
                  <span className="text-xs font-bold text-red-500 border border-red-500/30 px-2 py-1 rounded bg-red-500/10 uppercase tracking-wider">
                    SOLD
                  </span>
                ) : (
                  <div className="text-slate-500 text-xs">
                    ${Number(variant?.value ?? 0).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    return 'bg-surface-2';
  };

  return (
    <div className="bg-transparent rounded-none p-0 border-0 shadow-none">
      <div className="space-y-2">
        {variants.map((variant) => {
          const remaining = variant.stock - (variant._count?.lotteryDraws || 0);
          const isSoldOut = remaining <= 0;
          const progress = variant.stock > 0 ? (remaining / variant.stock) * 100 : 0;

          return (
            <div
              key={variant.id}
              className={`
                group relative flex items-center p-2 rounded-lg overflow-hidden 
                ${isSoldOut ? 'bg-surface-1/40 opacity-50' : 'bg-surface-1/60 hover:bg-surface-2/80'} 
                border border-white/5 hover:border-white/10 transition-all duration-200 backdrop-blur-sm
              `}
            >
              {/* Left: Image & Grade */}
              <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 mr-3 bg-black/40">
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
                      text-[9px] font-black px-1 py-0.5 rounded-br bg-black/70 text-white backdrop-blur-sm
                    `}>
                    {variant.prize}
                  </span>
                </div>
              </div>

              {/* Center: Info */}
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center mb-1">
                  <h3 className={`text-xs font-bold truncate ${isSoldOut ? 'text-zinc-500' : 'text-zinc-200 group-hover:text-white'}`}>
                    {variant.name}
                  </h3>
                </div>

                {/* Stock Bar */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSoldOut ? 'bg-zinc-600' : 'bg-amber-500'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400">
                    <span className={isSoldOut ? 'text-red-500' : 'text-green-400'}>{remaining}</span>
                    <span className="opacity-50">/{variant.stock}</span>
                  </div>
                </div>
              </div>

              {/* Right: Status/Rarity */}
              <div className="text-right flex-shrink-0">
                {variant.rarity && !isSoldOut && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${getRarityClass(variant.rarity).replace('bg-', 'bg-gradient-to-r from-').replace('to-', 'to-')} text-white`}>
                    {variant.rarity}
                  </span>
                )}
                {isSoldOut && (
                  <span className="text-[10px] font-bold text-red-500 uppercase">SOLD</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

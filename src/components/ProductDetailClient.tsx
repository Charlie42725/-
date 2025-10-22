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

  return (
    <div className="bg-transparent rounded-none p-0 border-0 shadow-none">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="text-2xl mr-3">🏆</span>
        獎項內容
      </h2>
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={variant.id}>
            <div
              className="group flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 border border-slate-700/30 hover:border-orange-400/40"
            >
              <div className="flex items-center space-x-4">
                {variant.imageUrl && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={variant.imageUrl}
                      alt={variant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-base text-white group-hover:text-orange-400 transition-colors mb-1.5">
                    {variant.name}
                  </p>
                  <div className="flex items-center flex-wrap gap-2">
                    {/* 賞級標籤 */}
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
                      {variant.prize}
                    </span>
                    {/* 稀有度標籤 */}
                    {variant.rarity && (
                      <span className="text-xs bg-gradient-to-r from-orange-400 to-pink-400 text-white px-2.5 py-0.5 rounded-full font-semibold">
                        {variant.rarity}
                      </span>
                    )}
                    {/* 價值標籤 */}
                    <span className="text-xs bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
                      ${Number(variant?.value ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-slate-400 text-sm font-normal mb-0.5">剩餘</div>
                <div className="text-green-400 text-xl font-bold">
                  {variant.stock - (variant._count?.lotteryDraws || 0)}
                </div>
              </div>
            </div>
            {/* 淡淡的分隔線 */}
            {index < variants.length - 1 && (
              <div className="h-px bg-slate-700/30 my-3 mx-4"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

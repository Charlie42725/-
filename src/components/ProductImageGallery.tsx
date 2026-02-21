'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: number;
  url: string;
  type: string;
  sortOrder: number;
}

interface ProductImageGalleryProps {
  coverImage: string | null;
  images: GalleryImage[];
  productName: string;
  productId: number;
}

export default function ProductImageGallery({
  coverImage,
  images,
  productName,
  productId,
}: ProductImageGalleryProps) {
  // 組合所有圖片：封面 + gallery 圖片
  const allImages: { url: string; label: string }[] = [];

  if (coverImage) {
    allImages.push({ url: coverImage, label: '封面' });
  }

  images.forEach((img) => {
    // 避免重複加入封面
    if (img.url !== coverImage) {
      allImages.push({ url: img.url, label: img.type === 'variant' ? '獎項' : '商品圖' });
    }
  });

  // 如果完全沒有圖片，用 placeholder
  if (allImages.length === 0) {
    allImages.push({
      url: '',
      label: '預設圖',
    });
  }

  const [activeIndex, setActiveIndex] = useState(0);

  const currentImage = allImages[activeIndex] || allImages[0];

  return (
    <div className="flex flex-col gap-3">
      {/* 主圖 */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-deep border border-white/10">
        {currentImage.url ? (
          <Image
            src={currentImage.url}
            alt={`${productName} - ${currentImage.label}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-2">
            <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
      </div>

      {/* 縮圖列 */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`
                relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200
                ${idx === activeIndex
                  ? 'border-amber-400 ring-2 ring-amber-400/30'
                  : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'}
              `}
            >
              <Image
                src={img.url}
                alt={`${productName} - ${img.label}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

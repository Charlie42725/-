'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      image: '/assets/images/banners/banner1.jpg',
      fallbackImage: 'https://picsum.photos/1920/500?random=1',
      title: 'FOUNTAIN OF LIFE',
      subtitle: '連賞被擊退12次',
      description: '獲得119萬玖福',
      alt: 'Banner 1'
    },
    {
      id: 2,
      image: '/assets/images/banners/banner2.jpg',
      fallbackImage: 'https://picsum.photos/1920/500?random=2',
      title: '限時活動',
      subtitle: '新手禮包大放送',
      description: '立即註冊領取',
      alt: 'Banner 2'
    }
  ];

  // 自動輪播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  }, [prevSlide, nextSlide]);

  return (
    <section
      className="w-full relative h-[350px] md:h-[450px] overflow-hidden bg-gray-900"
      role="region"
      aria-label="主要輪播橫幅"
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Banner 圖片容器 */}
      <div className="relative w-full h-full max-w-screen-xl mx-auto px-4" aria-live="off">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`第 ${index + 1} 張，共 ${banners.length} 張`}
            aria-hidden={index !== currentSlide}
          >
            {/* 背景圖片 */}
            <Image
              src={banner.image}
              alt={banner.alt}
              fill
              className="object-cover rounded-lg"
              priority={index === 0}
              onError={(e) => {
                e.currentTarget.src = banner.fallbackImage;
              }}
            />

            {/* 深色漸層覆蓋，增強文字對比 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent rounded-lg" />

            {/* 文字內容 - 左側對齊 */}
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 md:px-12">
                <div className="max-w-md">
                  {/* 主標題 - 更大更醒目 */}
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-black text-yellow-400 mb-4 tracking-wider">
                    {banner.title}
                  </h1>
                  <div className="space-y-3">
                    {/* 副標題 - 粉色突出 */}
                    <p className="text-lg md:text-xl lg:text-2xl text-pink-400 font-bold bg-black/40 px-3 py-1 rounded inline-block">
                      {banner.subtitle}
                    </p>
                    {/* 描述文字 - 黃色強調 */}
                    <p className="text-base md:text-lg lg:text-xl text-yellow-300 font-bold bg-black/40 px-3 py-1 rounded inline-block">
                      {banner.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右下角裝飾性元素 */}
            <div className="absolute bottom-4 right-4 text-white/30" aria-hidden="true">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* 左右箭頭 */}
      <button
        onClick={prevSlide}
        aria-label="上一張幻燈片"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        aria-label="下一張幻燈片"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 指示點 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2" role="tablist" aria-label="幻燈片選擇">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            role="tab"
            aria-selected={index === currentSlide}
            aria-label={`前往第 ${index + 1} 張幻燈片`}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50 w-3'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

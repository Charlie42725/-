'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-screen-xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/assets/images/logos/logo.png"
              alt="XXXX"
              width={120}
              height={40}
              className="h-8 w-auto"
              onError={(e) => {
                // 如果圖片載入失敗，隱藏圖片並顯示文字
                e.currentTarget.style.display = 'none';
                const textLogo = e.currentTarget.nextElementSibling as HTMLElement;
                if (textLogo) textLogo.style.display = 'block';
              }}
            />
            <div className="text-2xl font-bold text-orange-400" style={{ display: 'none' }}>
              XXXX
            </div>
          </div>

          {/* 桌面版導航選單 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-orange-400 transition-colors">
              全部一番賞
            </Link>
            <Link href="/lottery" className="text-white hover:text-orange-400 transition-colors">
              專人賞任務
            </Link>
            <Link href="/tasks" className="text-white hover:text-orange-400 transition-colors">
              任務大賞區
            </Link>
            <Link href="/brands" className="text-white hover:text-orange-400 transition-colors">
              品牌
            </Link>
            <Link href="/genshin" className="text-white hover:text-orange-400 transition-colors">
              免疫結蛋
            </Link>
            <Link href="/genshin" className="text-white hover:text-orange-400 transition-colors">
              原神 Genshin
            </Link>
            <Link href="/news" className="text-white hover:text-orange-400 transition-colors">
              實收串
            </Link>
            <Link href="/store" className="text-white hover:text-orange-400 transition-colors">
              店鋪情報
            </Link>
            <Link href="/events" className="text-white hover:text-orange-400 transition-colors">
              營業新聞
            </Link>
          </div>

          {/* 右側按鈕 */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-white hover:text-orange-400 transition-colors">
              登入
            </button>
            <button className="text-white hover:text-orange-400 transition-colors">
              註冊
            </button>
          </div>

          {/* 手機版選單按鈕 */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {/* 手機版選單 */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 py-4">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                全部一番賞
              </Link>
              <Link href="/lottery" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                專人賞任務
              </Link>
              <Link href="/tasks" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                任務大賞區
              </Link>
              <Link href="/brands" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                品牌
              </Link>
              <Link href="/genshin" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                原神 Genshin
              </Link>
              <Link href="/news" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                實收串
              </Link>
              <Link href="/store" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                店鋪情報
              </Link>
              <hr className="border-gray-600 my-2" />
              <Link href="/login" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                登入
              </Link>
              <Link href="/register" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                註冊
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
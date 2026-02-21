'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // admin 頁面不顯示前台 Footer
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="w-full bg-surface-deep mt-12 lg:mt-16 pt-16 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-16 border-t border-[var(--border)]">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 公司資訊 */}
          <div className="col-span-2 lg:col-span-1 text-left">
            <h3 className="text-white font-heading font-bold text-lg mb-4">失控事務所</h3>
            <p className="text-zinc-500 text-sm mb-4">
              線上抽賞平台，GK、盲盒、一番賞，提供最公平、公正、公開的抽賞體驗。
            </p>
            <div className="flex justify-start space-x-4">
              <a href="https://www.facebook.com/p/%E5%A4%B1%E6%8E%A7%E4%BA%8B%E5%8B%99%E6%89%80-61576981812648/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-zinc-500 hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/crazytoy7676/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-zinc-500 hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://openchat.line.me/tw/cover/EgxCCnFNwXyD_UUCvxMDBVsYSNwFMWjORKRtfXh4PYhutlKDVw5AXhY_Fxc" target="_blank" rel="noopener noreferrer" aria-label="LINE 社群" className="text-zinc-500 hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 5.81 2 10.5c0 2.49 1.3 4.73 3.34 6.22-.1.57-.52 2.8-.55 3.01-.05.35.13.35.27.25.1-.07 3.18-2.13 3.7-2.49.72.11 1.47.16 2.24.16 5.52 0 10-3.81 10-8.5S17.52 2 12 2zm-3.5 11a1 1 0 110-2 1 1 0 010 2zm3.5 0a1 1 0 110-2 1 1 0 010 2zm3.5 0a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </a>
              <a href="https://line.me/R/ti/p/@054wqmoa" target="_blank" rel="noopener noreferrer" aria-label="LINE 官方帳號" className="text-zinc-500 hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </a>
            </div>
            <div className="mt-4 space-y-1.5">
              <p className="text-zinc-500 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                243新北市泰山區仁愛路76號1樓
              </p>
              <p className="text-zinc-500 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href="tel:0978251929" className="hover:text-white transition-colors duration-200">0978-251-929</a>
              </p>
              <p className="text-zinc-500 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                LINE 官方：<a href="https://line.me/R/ti/p/@054wqmoa" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">@054wqmoa</a>
              </p>
            </div>
          </div>

          {/* 快速連結 */}
          <div className="text-left">
            <h4 className="text-white font-heading font-bold mb-4">快速連結</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">首頁</Link></li>
              <li><Link href="/products" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">一番賞</Link></li>
              <li><Link href="/news" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">最新消息</Link></li>
              <li><Link href="/about" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">關於我們</Link></li>
            </ul>
          </div>

          {/* 客戶服務 */}
          <div className="text-left">
            <h4 className="text-white font-heading font-bold mb-4">客戶服務</h4>
            <ul className="space-y-2">
              <li><Link href="/guide" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">使用說明</Link></li>
              <li><Link href="/faq" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">常見問題</Link></li>
              <li><Link href="/contact" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">聯絡客服</Link></li>
              <li><Link href="/shipping" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">配送資訊</Link></li>
              <li><Link href="/return-policy" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">退換貨政策</Link></li>
            </ul>
          </div>

          {/* 法律資訊 */}
          <div className="text-left">
            <h4 className="text-white font-heading font-bold mb-4">法律資訊</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">服務條款</Link></li>
              <li><Link href="/privacy" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">隱私政策</Link></li>
              <li><Link href="/cookies" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">Cookie 政策</Link></li>
              <li><Link href="/disclaimer" className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm">免責聲明</Link></li>
            </ul>
          </div>
        </div>

        {/* 版權資訊 */}
        <hr className="border-[var(--border)] my-8" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <p className="text-zinc-500 text-sm">
            &copy; 2025 失控事務所 All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="text-zinc-500 text-sm">客服時間：週一至週日 09:00-21:00</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

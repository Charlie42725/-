'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: '儀表板', icon: '📊' },
    { href: '/admin/brands', label: '品牌管理', icon: '🏷️' },
    { href: '/admin/series', label: '系列管理', icon: '📦' },
    { href: '/admin/products', label: '商品管理', icon: '🎁' },
    { href: '/admin/variants', label: '獎項管理', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* 頂部導航 */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-white">
                  🎮 後台管理系統
                </span>
              </Link>

              {/* 桌面版導航 */}
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        px-3 py-2 rounded text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }
                      `}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="hidden md:block text-slate-300 hover:text-white transition-colors"
                target="_blank"
              >
                查看前台 →
              </Link>

              {/* 手機版選單按鈕 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-slate-300 hover:text-white focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* 手機版選單 */}
          {isMobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      block px-3 py-2 rounded text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }
                    `}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                查看前台 →
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* 主要內容 */}
      <main className="flex justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

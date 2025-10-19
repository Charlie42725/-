'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: '儀表板', icon: '📊' },
    { href: '/admin/brands', label: '品牌管理', icon: '🏷️' },
    { href: '/admin/series', label: '系列管理', icon: '📦' },
    { href: '/admin/products', label: '商品管理', icon: '🎁' },
    { href: '/admin/variants', label: '獎項管理', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 頂部導航 */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-white">
                   後台管理系統
                </span>
              </Link>

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

            <div className="flex items-center">
              <Link
                href="/"
                className="text-slate-300 hover:text-white transition-colors"
                target="_blank"
              >
                查看前台 →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* 頁腳 */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-slate-500 text-sm">
            良級懸賞 後台管理系統 © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

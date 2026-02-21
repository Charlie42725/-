'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminData, getAdminCacheSync } from '@/lib/admin-cache';

interface Stats {
  brandCount: number;
  productCount: number;
  activeProductCount: number;
}

export default function AdminDashboard() {
  const cached = getAdminCacheSync();
  const [stats, setStats] = useState<Stats | null>(cached?.stats || null);

  useEffect(() => {
    getAdminData().then(d => setStats(d.stats)).catch(() => {});
  }, []);

  const statCards = [
    {
      label: '品牌總數',
      value: stats?.brandCount,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    {
      label: '商品總數',
      value: stats?.productCount,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      label: '進行中商品',
      value: stats?.activeProductCount,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      href: '/admin/brands',
      title: '新增品牌',
      desc: '創建新的 IP 品牌',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    {
      href: '/admin/products',
      title: '新增商品',
      desc: '創建新的一番賞商品',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      href: '/admin/banners',
      title: '管理輪播',
      desc: '設定首頁 Banner',
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full animate-in fade-in duration-150">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">儀表板</h1>
        <p className="text-zinc-500 text-sm">系統總覽與快速操作</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-3 md:p-5 border ${card.border} transition-colors duration-200`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-zinc-400 text-xs md:text-sm">{card.label}</p>
                {card.value !== undefined ? (
                  <p className={`text-2xl md:text-3xl font-bold mt-0.5 md:mt-1 ${card.color}`}>{card.value}</p>
                ) : (
                  <div className="h-8 md:h-9 w-12 bg-white/5 rounded mt-0.5 md:mt-1 animate-pulse" />
                )}
              </div>
              <div className="opacity-80 hidden md:block">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)]">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center p-3.5 md:p-4 bg-surface-1/30 rounded-lg hover:bg-surface-1/40 active:bg-surface-1/50 transition-colors duration-200 border border-[var(--border)] cursor-pointer group min-h-[56px]"
            >
              <div className="mr-3 md:mr-4 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">{action.icon}</div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm">{action.title}</p>
                <p className="text-xs text-zinc-500 truncate">{action.desc}</p>
              </div>
              <svg className="w-4 h-4 text-zinc-600 ml-auto flex-shrink-0 md:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

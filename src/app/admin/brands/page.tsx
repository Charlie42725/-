'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminData, getAdminCacheSync, invalidateAdminCache } from '@/lib/admin-cache';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function BrandsPage() {
  const cached = getAdminCacheSync();
  const [brands, setBrands] = useState<Brand[]>(cached?.brands || []);
  const [loading, setLoading] = useState(!cached);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      ...(!slugManuallyEdited ? { slug: generateSlug(name) } : {}),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  }

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const data = await getAdminData(true);
      setBrands(data.brands || []);
    } catch (error) {
      console.error('載入品牌失敗:', error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', slug: '', description: '' });
        setSlugManuallyEdited(false);
        invalidateAdminCache();
        fetchBrands();
      }
    } catch (error) {
      console.error('新增品牌失敗:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('確定要刪除此品牌嗎？')) return;

    try {
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        invalidateAdminCache();
        fetchBrands();
      }
    } catch (error) {
      console.error('刪除品牌失敗:', error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)] animate-pulse">
            <div className="h-5 bg-surface-3 rounded w-1/3 mb-3" />
            <div className="h-4 bg-surface-3 rounded w-2/3 mb-2" />
            <div className="h-4 bg-surface-3 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">品牌管理</h1>
          <p className="text-zinc-400 text-sm">管理所有一番賞品牌</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-all text-sm md:text-base min-h-[44px]"
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)] mb-5 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">新增品牌</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-300 mb-2 text-sm">品牌名稱 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                placeholder="例如：原神 Genshin Impact"
              />
            </div>
            <div>
              <label className="block text-zinc-300 mb-2 text-sm">Slug（網址用）*</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                placeholder="例如：genshin-impact"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                根據品牌名稱自動產生，也可手動修改
              </p>
            </div>
            <div>
              <label className="block text-zinc-300 mb-2 text-sm">品牌描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                rows={3}
                placeholder="品牌簡介..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 md:flex-none bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors min-h-[44px]"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 md:flex-none bg-surface-3 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 active:bg-gray-700 transition-colors min-h-[44px]"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 品牌列表 - 手機卡片 / 桌面表格 */}
      {brands.length === 0 ? (
        <div className="bg-surface-1/60 rounded-xl p-8 md:p-12 border border-[var(--border)] text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-zinc-400 text-sm">目前沒有品牌，點擊「+ 新增」開始建立</p>
        </div>
      ) : (
        <>
          {/* 手機版：卡片列表 */}
          <div className="md:hidden space-y-3">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)] active:bg-surface-1/80 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-base truncate">{brand.name}</h3>
                      {brand.isActive ? (
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                          啟用
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-zinc-400 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                          停用
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-amber-400 bg-surface-deep/60 px-2 py-0.5 rounded">
                      {brand.slug}
                    </code>
                  </div>
                </div>
                {brand.description && (
                  <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{brand.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                  <Link
                    href={`/brands/${brand.slug}`}
                    target="_blank"
                    className="flex-1 text-center py-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium active:bg-blue-500/20 transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    查看
                  </Link>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="flex-1 text-center py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium active:bg-red-500/20 transition-colors min-h-[44px] cursor-pointer"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 桌面版：表格 */}
          <div className="hidden md:block bg-surface-1/60 rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-deep">
                <tr>
                  <th className="text-left px-6 py-4 text-zinc-300 font-medium">ID</th>
                  <th className="text-left px-6 py-4 text-zinc-300 font-medium">名稱</th>
                  <th className="text-left px-6 py-4 text-zinc-300 font-medium">Slug</th>
                  <th className="text-left px-6 py-4 text-zinc-300 font-medium">描述</th>
                  <th className="text-left px-6 py-4 text-zinc-300 font-medium">狀態</th>
                  <th className="text-left px-6 py-4 text-zinc-300 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-6 py-4 text-zinc-300">{brand.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{brand.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-amber-400 bg-surface-deep/60 px-2 py-1 rounded">
                        {brand.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 max-w-xs truncate">
                      {brand.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {brand.isActive ? (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                          啟用中
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-zinc-400 px-3 py-1 rounded-full text-sm">
                          已停用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/brands/${brand.slug}`}
                          target="_blank"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          查看
                        </Link>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="text-red-400 hover:text-red-300 text-sm cursor-pointer"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

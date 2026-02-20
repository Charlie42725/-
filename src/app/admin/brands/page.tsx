'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
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
        fetchBrands();
      }
    } catch (error) {
      console.error('刪除品牌失敗:', error);
    }
  }

  if (loading) {
    return <div className="text-white">載入中...</div>;
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">品牌管理</h1>
          <p className="text-zinc-400">管理所有一番賞品牌</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-all"
        >
          {showForm ? '取消' : '+ 新增品牌'}
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-lg p-6 border border-[var(--border)] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">新增品牌</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-300 mb-2">品牌名稱 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="例如：原神 Genshin Impact"
              />
            </div>
            <div>
              <label className="block text-zinc-300 mb-2">Slug（網址用）*</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="例如：genshin-impact"
              />
              <p className="text-sm text-zinc-500 mt-1">
                只能使用小寫英文、數字、連字號
              </p>
            </div>
            <div>
              <label className="block text-zinc-300 mb-2">品牌描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                rows={3}
                placeholder="品牌簡介..."
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-surface-3 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 品牌列表 */}
      <div className="bg-surface-1/60 rounded-lg border border-[var(--border)] overflow-hidden">
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
            {brands.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  目前沒有品牌，點擊「新增品牌」開始建立
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
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
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

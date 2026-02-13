'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface Series {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  brand: {
    id: number;
    name: string;
  };
  _count: {
    products: number;
  };
}

interface Brand {
  id: number;
  name: string;
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    brandId: '',
    name: '',
    slug: '',
    description: '',
    coverImage: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [seriesRes, brandsRes] = await Promise.all([
        fetch('/api/admin/series'),
        fetch('/api/brands'),
      ]);

      const seriesData = await seriesRes.json();
      const brandsData = await brandsRes.json();

      setSeries(seriesData.series);
      setBrands(brandsData.brands);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ brandId: '', name: '', slug: '', description: '', coverImage: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '新增失敗');
      }
    } catch (error) {
      console.error('新增系列失敗:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('確定要刪除此系列嗎？')) return;

    try {
      const res = await fetch(`/api/admin/series/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('刪除系列失敗:', error);
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
          <h1 className="text-3xl font-bold text-white mb-2">系列管理</h1>
          <p className="text-slate-400">管理品牌下的商品系列</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-all"
        >
          {showForm ? '取消' : '+ 新增系列'}
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">新增系列</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2">選擇品牌 *</label>
              <select
                required
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">請選擇品牌</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2">系列名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="例如：原神 Ver.3.0 須彌篇"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Slug（網址用）*</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="例如：genshin-ver-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-2">系列描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="系列簡介..."
              />
            </div>
            <ImageUpload
              label="系列封面圖"
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
            />

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-500 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 系列列表 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">ID</th>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">系列名稱</th>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">品牌</th>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">Slug</th>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">商品數</th>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">狀態</th>
              <th className="text-left px-6 py-4 text-slate-300 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {series.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  目前沒有系列，點擊「新增系列」開始建立
                </td>
              </tr>
            ) : (
              series.map((s) => (
                <tr key={s.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{s.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{s.name}</div>
                    {s.description && (
                      <div className="text-sm text-slate-400 mt-1 max-w-xs truncate">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                      {s.brand.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-purple-400 bg-slate-900 px-2 py-1 rounded">
                      {s.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {s._count.products} 個商品
                  </td>
                  <td className="px-6 py-4">
                    {s.isActive ? (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        啟用中
                      </span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm">
                        已停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link
                        href={`/series/${s.slug}`}
                        target="_blank"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        查看
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id)}
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

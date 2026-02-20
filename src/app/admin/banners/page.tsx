'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const defaultForm = {
  title: '',
  subtitle: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('載入 Banner 失敗:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData(defaultForm);
    setShowForm(true);
  }

  function openEditForm(banner: Banner) {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/banners/${editingId}`
        : '/api/admin/banners';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData(defaultForm);
        fetchBanners();
      } else {
        const data = await res.json();
        alert(data.error || '操作失敗');
      }
    } catch (error) {
      console.error('儲存 Banner 失敗:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('確定要刪除此 Banner 嗎？')) return;

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error('刪除 Banner 失敗:', error);
    }
  }

  async function handleToggleActive(banner: Banner) {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, isActive: !banner.isActive }),
      });

      if (res.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error('切換狀態失敗:', error);
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
          <h1 className="text-3xl font-bold text-white mb-2">輪播管理</h1>
          <p className="text-zinc-400">管理首頁輪播 Banner</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
          className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-all"
        >
          {showForm ? '取消' : '+ 新增 Banner'}
        </button>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-lg p-6 border border-[var(--border)] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? '編輯 Banner' : '新增 Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-2">標題 *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="例如：FOUNTAIN OF LIFE"
                />
              </div>
              <div>
                <label className="block text-zinc-300 mb-2">副標題</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="例如：連賞被擊退12次"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 mb-2">描述文字</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="例如：獲得119萬玖福"
              />
            </div>

            <ImageUpload
              label="Banner 圖片"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-2">連結網址</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="例如：/products/some-product"
                />
              </div>
              <div>
                <label className="block text-zinc-300 mb-2">排序（數字越小越前面）</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="text-zinc-300">啟用</span>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
              >
                {editingId ? '更新' : '儲存'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-surface-3 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner 列表 */}
      <div className="bg-surface-1/60 rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-deep">
            <tr>
              <th className="text-left px-6 py-4 text-zinc-300 font-medium">排序</th>
              <th className="text-left px-6 py-4 text-zinc-300 font-medium">圖片</th>
              <th className="text-left px-6 py-4 text-zinc-300 font-medium">標題</th>
              <th className="text-left px-6 py-4 text-zinc-300 font-medium">連結</th>
              <th className="text-left px-6 py-4 text-zinc-300 font-medium">狀態</th>
              <th className="text-left px-6 py-4 text-zinc-300 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  目前沒有 Banner，點擊「新增 Banner」開始建立
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="px-6 py-4 text-zinc-300">{banner.sortOrder}</td>
                  <td className="px-6 py-4">
                    <div className="relative w-24 h-14 bg-surface-2 rounded overflow-hidden">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{banner.title}</div>
                    {banner.subtitle && (
                      <div className="text-sm text-zinc-400">{banner.subtitle}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-300 max-w-xs truncate">
                    {banner.linkUrl ? (
                      <code className="text-sm text-amber-400 bg-surface-deep/60 px-2 py-1 rounded">
                        {banner.linkUrl}
                      </code>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className="cursor-pointer"
                    >
                      {banner.isActive ? (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                          啟用中
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-zinc-400 px-3 py-1 rounded-full text-sm">
                          已停用
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditForm(banner)}
                        className="text-amber-400 hover:text-amber-300 text-sm"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
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

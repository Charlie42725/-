'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { getAdminData, getAdminCacheSync, invalidateAdminCache } from '@/lib/admin-cache';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imagePositionX: number;
  imagePositionY: number;
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
  imagePositionX: 50,
  imagePositionY: 50,
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function BannersPage() {
  const cached = getAdminCacheSync();
  const [banners, setBanners] = useState<Banner[]>(cached?.banners || []);
  const [loading, setLoading] = useState(!cached);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const data = await getAdminData(true);
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
      imagePositionX: banner.imagePositionX ?? 50,
      imagePositionY: banner.imagePositionY ?? 50,
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
        invalidateAdminCache();
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
        invalidateAdminCache();
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
        invalidateAdminCache();
        fetchBanners();
      }
    } catch (error) {
      console.error('切換狀態失敗:', error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)] animate-pulse">
            <div className="h-32 bg-surface-3 rounded-lg mb-3" />
            <div className="h-5 bg-surface-3 rounded w-1/3 mb-2" />
            <div className="h-4 bg-surface-3 rounded w-2/3" />
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
          <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">輪播管理</h1>
          <p className="text-zinc-400 text-sm">管理首頁輪播 Banner</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
          className="bg-amber-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-all text-sm md:text-base min-h-[44px]"
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)] mb-5 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">
            {editingId ? '編輯 Banner' : '新增 Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">標題 *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">副標題</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                  placeholder=""
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 mb-1.5 text-sm">描述文字</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                placeholder=""
              />
            </div>

            <ImageUpload
              label="Banner 圖片"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              required
            />

            {/* 圖片位置調整器 */}
            {formData.imageUrl && (
              <ImagePositionAdjuster
                imageUrl={formData.imageUrl}
                positionX={formData.imagePositionX}
                positionY={formData.imagePositionY}
                onChange={(x, y) => setFormData({ ...formData, imagePositionX: x, imagePositionY: y })}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">連結網址</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">排序（數字越小越前面）</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                />
              </div>
            </div>

            <div className="flex items-center min-h-[44px]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="text-zinc-300 ml-3">啟用</span>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 md:flex-none bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors min-h-[44px]"
              >
                {editingId ? '更新' : '儲存'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 md:flex-none bg-surface-3 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 active:bg-gray-700 transition-colors min-h-[44px]"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner 列表 */}
      {banners.length === 0 ? (
        <div className="bg-surface-1/60 rounded-xl p-8 md:p-12 border border-[var(--border)] text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <p className="text-zinc-400 text-sm">目前沒有 Banner，點擊「+ 新增」開始建立</p>
        </div>
      ) : (
        <>
          {/* 手機版：卡片列表 */}
          <div className="md:hidden space-y-3">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-surface-1/60 rounded-xl border border-[var(--border)] overflow-hidden"
              >
                {/* Banner 圖片預覽 */}
                <div className="relative w-full h-40 bg-surface-2">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${banner.imagePositionX ?? 50}% ${banner.imagePositionY ?? 50}%` }}
                  />
                  {/* 排序標記 */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                    #{banner.sortOrder}
                  </div>
                  {/* 狀態標記 */}
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="absolute top-2 right-2 cursor-pointer"
                  >
                    {banner.isActive ? (
                      <span className="bg-green-500/90 text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                        啟用中
                      </span>
                    ) : (
                      <span className="bg-gray-500/90 text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
                        已停用
                      </span>
                    )}
                  </button>
                </div>

                {/* 資訊 */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-base">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-sm text-zinc-400 mt-0.5">{banner.subtitle}</p>
                  )}
                  {banner.linkUrl && (
                    <div className="mt-2">
                      <code className="text-xs text-amber-400 bg-surface-deep/60 px-2 py-0.5 rounded">
                        {banner.linkUrl}
                      </code>
                    </div>
                  )}

                  {/* 操作按鈕 */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                    <button
                      onClick={() => openEditForm(banner)}
                      className="flex-1 text-center py-2.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium active:bg-amber-500/20 transition-colors min-h-[44px] cursor-pointer"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className="flex-1 text-center py-2.5 rounded-lg bg-surface-3/50 text-zinc-300 text-sm font-medium active:bg-surface-3 transition-colors min-h-[44px] cursor-pointer"
                    >
                      {banner.isActive ? '停用' : '啟用'}
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm active:bg-red-500/20 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 桌面版：表格 */}
          <div className="hidden md:block bg-surface-1/60 rounded-xl border border-[var(--border)] overflow-hidden">
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
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-6 py-4 text-zinc-300">{banner.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="relative w-24 h-14 bg-surface-2 rounded overflow-hidden">
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title}
                          fill
                          className="object-cover"
                          style={{ objectPosition: `${banner.imagePositionX ?? 50}% ${banner.imagePositionY ?? 50}%` }}
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
                          className="text-amber-400 hover:text-amber-300 text-sm cursor-pointer"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
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

// 圖片位置調整器 — 拖曳十字準心來設定焦點位置
function ImagePositionAdjuster({
  imageUrl,
  positionX,
  positionY,
  onChange,
}: {
  imageUrl: string;
  positionX: number;
  positionY: number;
  onChange: (x: number, y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
      const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
      onChange(x, y);
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX, e.clientY);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX, e.clientY);
    },
    [updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div>
      <label className="block text-zinc-300 mb-1.5 text-sm">
        調整圖片位置
        <span className="text-zinc-500 ml-2 text-xs">拖曳十字準心設定焦點</span>
      </label>
      {/* 預覽容器 — 模擬 Banner 比例 */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[21/9] bg-surface-2 rounded-xl overflow-hidden cursor-crosshair select-none touch-none border border-surface-3"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* 完整原圖 */}
        <Image
          src={imageUrl}
          alt="位置預覽"
          fill
          className="object-cover pointer-events-none"
          style={{ objectPosition: `${positionX}% ${positionY}%` }}
        />

        {/* 暗色遮罩 + 十字準心 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 十字線 */}
          <div
            className="absolute w-px bg-white/60"
            style={{ left: `${positionX}%`, top: 0, bottom: 0 }}
          />
          <div
            className="absolute h-px bg-white/60"
            style={{ top: `${positionY}%`, left: 0, right: 0 }}
          />
          {/* 中心圓點 */}
          <div
            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.4)]"
            style={{ left: `${positionX}%`, top: `${positionY}%` }}
          >
            <div className="absolute inset-1 bg-amber-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* 座標顯示 + 快速重置 */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-zinc-500">
          X: {positionX}%　Y: {positionY}%
        </span>
        <button
          type="button"
          onClick={() => onChange(50, 50)}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          重置為中心
        </button>
      </div>
    </div>
  );
}

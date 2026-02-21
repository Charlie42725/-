'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface Variant {
  id: number;
  prize: string;
  name: string;
  rarity: string | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    lotteryDraws: number;
  };
}

interface Product {
  id: number;
  name: string;
  slug: string;
}

const rarityOptions = [
  { value: 'SSR', label: 'SSR（超稀有）', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  { value: 'SR', label: 'SR（稀有）', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  { value: 'R', label: 'R（普通）', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  { value: 'N', label: 'N（一般）', color: 'text-zinc-400', bg: 'bg-zinc-500/15 border-zinc-500/30' },
];

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    prize: '',
    name: '',
    rarity: '',
    stock: '',
    imageUrl: '',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [productRes, variantsRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}`),
        fetch(`/api/admin/variants?productId=${productId}`),
      ]);

      if (!productRes.ok) {
        alert('商品不存在');
        router.push('/admin/products');
        return;
      }

      const productData = await productRes.json();
      const variantsData = await variantsRes.json();

      setProduct(productData.product);
      setVariants(variantsData.variants);
    } catch (error) {
      console.error('載入資料失敗:', error);
      alert('載入資料失敗');
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/admin/variants/${editingId}`
        : '/api/admin/variants';
      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? formData
        : { ...formData, productId: parseInt(productId) };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || (editingId ? '更新失敗' : '新增失敗'));
      }
    } catch (error) {
      console.error(editingId ? '更新獎項失敗:' : '新增獎項失敗:', error);
      alert(editingId ? '更新失敗' : '新增失敗');
    }
  }

  function handleEdit(variant: Variant) {
    setFormData({
      prize: variant.prize,
      name: variant.name,
      rarity: variant.rarity || '',
      stock: variant.stock.toString(),
      imageUrl: variant.imageUrl || '',
      isActive: variant.isActive,
    });
    setEditingId(variant.id);
    setShowForm(true);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/variants/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('刪除獎項失敗:', error);
      alert('刪除失敗');
    }
  }

  function resetForm() {
    setFormData({
      prize: '',
      name: '',
      rarity: '',
      stock: '',
      imageUrl: '',
      isActive: true,
    });
  }

  function handleCancelEdit() {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  }

  function getRarityInfo(rarity: string | null) {
    if (!rarity) return { color: 'text-zinc-400', bg: 'bg-zinc-500/15 border-zinc-500/30' };
    const option = rarityOptions.find((opt) => opt.value === rarity);
    return { color: option?.color || 'text-zinc-400', bg: option?.bg || 'bg-zinc-500/15 border-zinc-500/30' };
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-3 rounded w-1/3 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)] animate-pulse">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-surface-3 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-5 bg-surface-3 rounded w-1/3 mb-2" />
                <div className="h-4 bg-surface-3 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!product) {
    return <div className="text-white">商品不存在</div>;
  }

  return (
    <div>
      {/* 頁面標題和返回按鈕 */}
      <div className="mb-5 md:mb-8">
        <button
          onClick={() => router.push('/admin/products')}
          className="text-zinc-400 hover:text-white active:text-zinc-200 mb-3 flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          返回商品列表
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 truncate">
              {product.name}
            </h1>
            <p className="text-zinc-400 text-sm">獎項管理（A賞、B賞等）</p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelEdit();
              } else {
                setShowForm(true);
              }
            }}
            className="bg-amber-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-all text-sm md:text-base min-h-[44px] flex-shrink-0"
          >
            {showForm ? '取消' : '+ 新增'}
          </button>
        </div>
      </div>

      {/* 獎項統計 */}
      {variants.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
          <div className="bg-surface-1/60 rounded-xl p-3 md:p-4 border border-[var(--border)]">
            <div className="text-zinc-400 text-xs md:text-sm mb-0.5 md:mb-1">總獎項</div>
            <div className="text-xl md:text-2xl font-bold text-white">{variants.length}</div>
          </div>
          <div className="bg-surface-1/60 rounded-xl p-3 md:p-4 border border-[var(--border)]">
            <div className="text-zinc-400 text-xs md:text-sm mb-0.5 md:mb-1">總庫存</div>
            <div className="text-xl md:text-2xl font-bold text-amber-400">
              {variants.reduce((sum, v) => sum + v.stock, 0)}
            </div>
          </div>
          <div className="bg-surface-1/60 rounded-xl p-3 md:p-4 border border-[var(--border)]">
            <div className="text-zinc-400 text-xs md:text-sm mb-0.5 md:mb-1">啟用中</div>
            <div className="text-xl md:text-2xl font-bold text-green-400">
              {variants.filter((v) => v.isActive).length}
            </div>
          </div>
        </div>
      )}

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)] mb-5 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">
            {editingId ? '編輯獎項' : '新增獎項'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">賞等 *</label>
                <input
                  type="text"
                  required
                  value={formData.prize}
                  onChange={(e) =>
                    setFormData({ ...formData, prize: e.target.value })
                  }
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：A賞、B賞、Last賞"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">獎項名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：特等獎公仔、限定海報"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">稀有度</label>
                <select
                  value={formData.rarity}
                  onChange={(e) =>
                    setFormData({ ...formData, rarity: e.target.value })
                  }
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                >
                  <option value="">未設定</option>
                  {rarityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">庫存數量 *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：5"
                />
              </div>
            </div>

            <ImageUpload
              label="獎項圖片"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            <div className="flex items-center min-h-[44px]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="ml-3 text-zinc-300">啟用此獎項</span>
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
                onClick={handleCancelEdit}
                className="flex-1 md:flex-none bg-surface-3 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 active:bg-gray-700 transition-colors min-h-[44px]"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 獎項列表 */}
      {variants.length === 0 ? (
        <div className="bg-surface-1/60 rounded-xl p-8 md:p-12 border border-[var(--border)] text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
          </svg>
          <p className="text-zinc-400 text-sm">此商品尚未新增任何獎項</p>
        </div>
      ) : (
        <>
          {/* 手機版：卡片列表 */}
          <div className="md:hidden space-y-3">
            {variants.map((variant) => {
              const drawn = variant._count?.lotteryDraws || 0;
              const remaining = variant.stock - drawn;
              const drawProgress = variant.stock > 0 ? (drawn / variant.stock) * 100 : 0;
              const rarityInfo = getRarityInfo(variant.rarity);

              return (
                <div
                  key={variant.id}
                  className="bg-surface-1/60 rounded-xl border border-[var(--border)] overflow-hidden"
                >
                  <div className="p-4">
                    {/* 頂部：圖片 + 資訊 */}
                    <div className="flex gap-3">
                      {variant.imageUrl ? (
                        <div className="relative w-16 h-16 bg-surface-2 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={variant.imageUrl}
                            alt={variant.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-surface-2 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-amber-400 font-bold text-sm">{variant.prize}</span>
                          {variant.rarity && (
                            <span className={`${rarityInfo.bg} ${rarityInfo.color} px-2 py-0.5 rounded-md text-xs font-medium border`}>
                              {variant.rarity}
                            </span>
                          )}
                          {!variant.isActive && (
                            <span className="bg-gray-500/20 text-zinc-500 px-2 py-0.5 rounded-md text-xs">
                              停用
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-white text-sm truncate">{variant.name}</h3>
                      </div>
                    </div>

                    {/* 抽取進度 */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-red-400 font-medium">已抽: {drawn}</span>
                        <span className="text-green-400 font-medium">剩餘: {remaining}</span>
                        <span className="text-zinc-500">共 {variant.stock}</span>
                      </div>
                      <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${drawProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleEdit(variant)}
                        className="flex-1 text-center py-2.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium active:bg-amber-500/20 transition-colors min-h-[44px] cursor-pointer"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id, `${variant.prize} ${variant.name}`)}
                        className="py-2.5 px-5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium active:bg-red-500/20 transition-colors min-h-[44px] cursor-pointer"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 桌面版：表格 */}
          <div className="hidden md:block bg-surface-1/60 rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-deep">
                  <tr>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">ID</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">賞等</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">獎項名稱</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">稀有度</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">抽取狀況</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">狀態</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {variants.map((variant) => {
                    const rarityInfo = getRarityInfo(variant.rarity);
                    return (
                      <tr key={variant.id} className="hover:bg-white/[0.04]">
                        <td className="px-6 py-4 text-zinc-300">{variant.id}</td>
                        <td className="px-6 py-4">
                          <span className="text-amber-400 font-bold">{variant.prize}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {variant.imageUrl && (
                              <Image
                                src={variant.imageUrl}
                                alt={variant.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="font-medium text-white">{variant.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={rarityInfo.color}>
                            {variant.rarity || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs gap-3">
                              <span className="text-red-400 font-bold">已抽: {variant._count?.lotteryDraws || 0}</span>
                              <span className="text-green-400 font-bold">剩餘: {variant.stock - (variant._count?.lotteryDraws || 0)}</span>
                            </div>
                            <div className="text-xs text-zinc-400">
                              總數: {variant.stock}
                            </div>
                            <div className="w-32 bg-surface-3 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${variant.stock > 0 ? ((variant._count?.lotteryDraws || 0) / variant.stock) * 100 : 0}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {variant.isActive ? (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                              啟用
                            </span>
                          ) : (
                            <span className="bg-gray-500/20 text-zinc-400 px-2 py-1 rounded text-xs">
                              停用
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEdit(variant)}
                              className="text-amber-400 hover:text-amber-300 text-sm transition-colors cursor-pointer"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDelete(variant.id, `${variant.prize} ${variant.name}`)}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer"
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

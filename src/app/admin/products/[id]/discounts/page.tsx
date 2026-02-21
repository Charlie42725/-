'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Discount {
  id: number;
  type: string;
  drawCount: number;
  price: number;
  label: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
}

const typeMap: Record<string, { label: string; className: string }> = {
  full_set: { label: '開套優惠', className: 'bg-amber-500/20 text-amber-400' },
  combo: { label: '組合價', className: 'bg-blue-500/20 text-blue-400' },
};

export default function ProductDiscountsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: 'full_set',
    drawCount: '',
    price: '',
    label: '',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [productRes, discountsRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}`),
        fetch(`/api/admin/discounts?productId=${productId}`),
      ]);

      if (!productRes.ok) {
        alert('商品不存在');
        router.push('/admin/products');
        return;
      }

      const productData = await productRes.json();
      const discountsData = await discountsRes.json();

      setProduct(productData.product);
      setDiscounts(discountsData.discounts);
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
        ? `/api/admin/discounts/${editingId}`
        : '/api/admin/discounts';
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
      console.error(editingId ? '更新折扣失敗:' : '新增折扣失敗:', error);
      alert(editingId ? '更新失敗' : '新增失敗');
    }
  }

  function handleEdit(discount: Discount) {
    setFormData({
      type: discount.type,
      drawCount: discount.drawCount.toString(),
      price: discount.price.toString(),
      label: discount.label || '',
      isActive: discount.isActive,
    });
    setEditingId(discount.id);
    setShowForm(true);
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`確定要刪除「${label}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('刪除折扣失敗:', error);
      alert('刪除失敗');
    }
  }

  function resetForm() {
    setFormData({
      type: 'full_set',
      drawCount: '',
      price: '',
      label: '',
      isActive: true,
    });
  }

  function handleCancelEdit() {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-3 rounded w-1/3 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)] animate-pulse">
            <div className="h-5 bg-surface-3 rounded w-1/3 mb-2" />
            <div className="h-4 bg-surface-3 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!product) {
    return <div className="text-white">商品不存在</div>;
  }

  const fullSetCount = discounts.filter(d => d.type === 'full_set').length;
  const comboCount = discounts.filter(d => d.type === 'combo').length;

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
            <p className="text-zinc-400 text-sm">折扣設定（開套優惠、組合價）</p>
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

      {/* 統計卡片 */}
      {discounts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
          <div className="bg-surface-1/60 rounded-xl p-3 md:p-4 border border-[var(--border)]">
            <div className="text-zinc-400 text-xs md:text-sm mb-0.5 md:mb-1">總折扣</div>
            <div className="text-xl md:text-2xl font-bold text-white">{discounts.length}</div>
          </div>
          <div className="bg-surface-1/60 rounded-xl p-3 md:p-4 border border-[var(--border)]">
            <div className="text-zinc-400 text-xs md:text-sm mb-0.5 md:mb-1">開套優惠</div>
            <div className="text-xl md:text-2xl font-bold text-amber-400">{fullSetCount}</div>
          </div>
          <div className="bg-surface-1/60 rounded-xl p-3 md:p-4 border border-[var(--border)]">
            <div className="text-zinc-400 text-xs md:text-sm mb-0.5 md:mb-1">組合價</div>
            <div className="text-xl md:text-2xl font-bold text-blue-400">{comboCount}</div>
          </div>
        </div>
      )}

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)] mb-5 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">
            {editingId ? '編輯折扣' : '新增折扣'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">折扣類型 *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                >
                  <option value="full_set">開套優惠（全新未抽才觸發）</option>
                  <option value="combo">組合價（任何時候都適用）</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">顯示名稱</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：半套優惠、超值組合"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">抽數門檻 *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.drawCount}
                  onChange={(e) => setFormData({ ...formData, drawCount: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：40"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">
                  方案總價（點數） *
                  {formData.drawCount && formData.price && (
                    <span className="text-zinc-500 ml-1">
                      (每抽 {Math.round(parseInt(formData.price) / parseInt(formData.drawCount))} 點)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：3500"
                />
              </div>
            </div>

            {/* 原價參考 */}
            {formData.drawCount && product.price && (
              <div className="bg-surface-2/50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>原價（{formData.drawCount} 抽 x {product.price} 點）</span>
                  <span className="text-white font-medium">
                    {parseInt(formData.drawCount) * product.price} 點
                  </span>
                </div>
                {formData.price && (
                  <div className="flex justify-between text-zinc-400 mt-1">
                    <span>優惠後</span>
                    <span className="text-amber-400 font-medium">{parseInt(formData.price)} 點</span>
                  </div>
                )}
                {formData.price && formData.drawCount && (
                  <div className="flex justify-between mt-1">
                    <span className="text-green-400">省</span>
                    <span className="text-green-400 font-medium">
                      {parseInt(formData.drawCount) * product.price - parseInt(formData.price)} 點
                    </span>
                  </div>
                )}
              </div>
            )}

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
              <span className="ml-3 text-zinc-300">啟用此折扣</span>
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

      {/* 折扣列表 */}
      {discounts.length === 0 ? (
        <div className="bg-surface-1/60 rounded-xl p-8 md:p-12 border border-[var(--border)] text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-zinc-400 text-sm">此商品尚未設定任何折扣</p>
        </div>
      ) : (
        <>
          {/* 手機版：卡片列表 */}
          <div className="md:hidden space-y-3">
            {discounts.map((discount) => {
              const typeInfo = typeMap[discount.type] || typeMap.full_set;
              const originalPrice = product.price * discount.drawCount;
              const savings = originalPrice - discount.price;
              const perDraw = Math.round(discount.price / discount.drawCount);

              return (
                <div
                  key={discount.id}
                  className="bg-surface-1/60 rounded-xl border border-[var(--border)] overflow-hidden"
                >
                  <div className="p-4">
                    {/* 頂部：類型 + 狀態 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`${typeInfo.className} px-2.5 py-0.5 rounded-md text-xs font-medium`}>
                          {typeInfo.label}
                        </span>
                        {!discount.isActive && (
                          <span className="bg-gray-500/20 text-zinc-500 px-2 py-0.5 rounded-md text-xs">
                            停用
                          </span>
                        )}
                      </div>
                      <span className="text-amber-400 font-bold">{discount.drawCount} 抽</span>
                    </div>

                    {/* 名稱 + 價格 */}
                    <div className="mb-2">
                      {discount.label && (
                        <h3 className="font-medium text-white text-sm mb-1">{discount.label}</h3>
                      )}
                      <div className="flex items-baseline justify-between">
                        <p className="text-amber-400 font-bold text-xl">{discount.price.toLocaleString()} 點</p>
                        <p className="text-zinc-500 text-xs">每抽 {perDraw} 點</p>
                      </div>
                    </div>

                    {/* 折扣資訊 */}
                    {savings > 0 && (
                      <div className="bg-green-500/10 rounded-lg px-3 py-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">原價 {originalPrice.toLocaleString()} 點</span>
                          <span className="text-green-400 font-medium">省 {savings.toLocaleString()} 點</span>
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="flex-1 text-center py-2.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium active:bg-amber-500/20 transition-colors min-h-[44px] cursor-pointer"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id, discount.label || `${typeInfo.label} ${discount.drawCount}抽`)}
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
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">類型</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">名稱</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">抽數</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">方案價格</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">折扣</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">狀態</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {discounts.map((discount) => {
                    const typeInfo = typeMap[discount.type] || typeMap.full_set;
                    const originalPrice = product.price * discount.drawCount;
                    const savings = originalPrice - discount.price;

                    return (
                      <tr key={discount.id} className="hover:bg-white/[0.04]">
                        <td className="px-6 py-4 text-zinc-300">{discount.id}</td>
                        <td className="px-6 py-4">
                          <span className={`${typeInfo.className} px-2 py-1 rounded text-xs`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {discount.label || '-'}
                        </td>
                        <td className="px-6 py-4 text-amber-400 font-bold">
                          {discount.drawCount} 抽
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{discount.price.toLocaleString()} 點</div>
                          <div className="text-zinc-500 text-xs">每抽 {Math.round(discount.price / discount.drawCount)} 點</div>
                        </td>
                        <td className="px-6 py-4">
                          {savings > 0 ? (
                            <div>
                              <span className="text-green-400 font-medium">-{savings.toLocaleString()} 點</span>
                              <div className="text-zinc-500 text-xs line-through">{originalPrice.toLocaleString()} 點</div>
                            </div>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {discount.isActive ? (
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
                              onClick={() => handleEdit(discount)}
                              className="text-amber-400 hover:text-amber-300 text-sm transition-colors cursor-pointer"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDelete(discount.id, discount.label || `${typeInfo.label} ${discount.drawCount}抽`)}
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

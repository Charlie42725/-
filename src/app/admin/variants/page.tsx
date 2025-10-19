'use client';

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';

interface Product {
  id: number;
  name: string;
  slug: string;
}

interface Variant {
  id: number;
  name: string;
  rarity: string | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  product: Product;
}

const rarityOptions = [
  { value: 'SSR', label: 'SSR（超稀有）', color: 'text-yellow-400' },
  { value: 'SR', label: 'SR（稀有）', color: 'text-purple-400' },
  { value: 'R', label: 'R（普通）', color: 'text-blue-400' },
  { value: 'N', label: 'N（一般）', color: 'text-gray-400' },
];

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    rarity: '',
    stock: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [variantsRes, productsRes] = await Promise.all([
        fetch('/api/admin/variants'),
        fetch('/api/admin/products'),
      ]);

      const variantsData = await variantsRes.json();
      const productsData = await productsRes.json();

      setVariants(variantsData.variants);
      setProducts(productsData.products);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/admin/variants/${editingId}`
        : '/api/admin/variants';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      productId: variant.product.id.toString(),
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
      productId: '',
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

  function getRarityColor(rarity: string | null) {
    if (!rarity) return 'text-gray-400';
    const option = rarityOptions.find((opt) => opt.value === rarity);
    return option?.color || 'text-gray-400';
  }

  if (loading) {
    return <div className="text-white">載入中...</div>;
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">獎項管理</h1>
          <p className="text-slate-400">管理商品的各種獎項（A賞、B賞等）</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all"
        >
          {showForm ? '取消' : '+ 新增獎項'}
        </button>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? '編輯獎項' : '新增獎項'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2">選擇商品 *</label>
                <select
                  required
                  disabled={!!editingId}
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <option value="">請選擇商品</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {editingId && (
                  <p className="text-xs text-slate-500 mt-1">
                    編輯時無法更改所屬商品
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-2">獎項名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：A賞 - 特等獎"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2">稀有度</label>
                <select
                  value={formData.rarity}
                  onChange={(e) =>
                    setFormData({ ...formData, rarity: e.target.value })
                  }
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-slate-300 mb-2">庫存數量 *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：5"
                />
              </div>
            </div>

            <ImageUpload
              label="獎項圖片"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="ml-2 text-slate-300">
                啟用此獎項
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-500 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 獎項列表 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  ID
                </th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  獎項名稱
                </th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  所屬商品
                </th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  稀有度
                </th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  庫存
                </th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  狀態
                </th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    目前沒有獎項
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-slate-300">{variant.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {variant.imageUrl && (
                          <img
                            src={variant.imageUrl}
                            alt={variant.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="font-medium text-white">
                          {variant.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {variant.product.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={getRarityColor(variant.rarity)}>
                        {variant.rarity || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{variant.stock}</td>
                    <td className="px-6 py-4">
                      {variant.isActive ? (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                          啟用
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                          停用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(variant.id, variant.name)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
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
    </div>
  );
}

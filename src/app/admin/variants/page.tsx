'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface Product {
  id: number;
  name: string;
  slug: string;
  series: {
    id: number;
    name: string;
    brand: {
      id: number;
      name: string;
    };
  };
}

interface Variant {
  id: number;
  prize: string;
  name: string;
  rarity: string | null;
  value: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  product: Product;
  _count?: {
    lotteryDraws: number;
  };
}

interface Brand {
  id: number;
  name: string;
  series: { id: number; name: string }[];
}

const rarityOptions = [
  { value: 'SSR', label: 'SSR（超稀有）', color: 'text-yellow-400' },
  { value: 'SR', label: 'SR（稀有）', color: 'text-indigo-400' },
  { value: 'R', label: 'R（普通）', color: 'text-blue-400' },
  { value: 'N', label: 'N（一般）', color: 'text-gray-400' },
];

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 篩選狀態
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterSeries, setFilterSeries] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');

  const [formData, setFormData] = useState({
    productId: '',
    prize: '',
    name: '',
    rarity: '',
    value: '3000',
    stock: '',
    imageUrl: '',
    isActive: true,
  });

  const applyFilters = useCallback(() => {
    let filtered = [...variants];

    if (filterBrand) {
      filtered = filtered.filter(
        (v) => v.product.series?.brand?.id.toString() === filterBrand
      );
    }

    if (filterSeries) {
      filtered = filtered.filter(
        (v) => v.product.series?.id.toString() === filterSeries
      );
    }

    if (filterProduct) {
      filtered = filtered.filter(
        (v) => v.product.id.toString() === filterProduct
      );
    }

    setFilteredVariants(filtered);
  }, [variants, filterBrand, filterSeries, filterProduct]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  async function fetchData() {
    try {
      const [variantsRes, productsRes, brandsRes] = await Promise.all([
        fetch('/api/admin/variants'),
        fetch('/api/admin/products'),
        fetch('/api/brands'),
      ]);

      const variantsData = await variantsRes.json();
      const productsData = await productsRes.json();
      const brandsData = await brandsRes.json();

      setVariants(variantsData.variants);
      setFilteredVariants(variantsData.variants);
      setProducts(productsData.products);
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
      prize: variant.prize,
      name: variant.name,
      rarity: variant.rarity || '',
      value: variant.value.toString(),
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
      prize: '',
      name: '',
      rarity: '',
      value: '3000',
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

  function getAvailableSeries() {
    if (!filterBrand) return [];
    const brand = brands.find((b) => b.id.toString() === filterBrand);
    return brand?.series || [];
  }

  function getAvailableProducts() {
    let filtered = [...products];

    if (filterBrand) {
      filtered = filtered.filter(
        (p) => p.series?.brand?.id.toString() === filterBrand
      );
    }

    if (filterSeries) {
      filtered = filtered.filter(
        (p) => p.series?.id.toString() === filterSeries
      );
    }

    return filtered;
  }

  function clearFilters() {
    setFilterBrand('');
    setFilterSeries('');
    setFilterProduct('');
  }

  if (loading) {
    return <div className="text-white">載入中...</div>;
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">全局獎項管理</h1>
          <p className="text-gray-400">
            查看所有獎項（共 {filteredVariants.length} 個）
            <span className="text-gray-500 ml-2">
              提示：建議從「商品管理」進入各商品的獎項頁面進行管理
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-600 transition-all"
        >
          {showForm ? '取消' : '+ 新增獎項'}
        </button>
      </div>

      {/* 篩選器 */}
      <div className="bg-gray-900/60 rounded-lg p-6 border border-white/[0.06] mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">篩選條件</h3>
          {(filterBrand || filterSeries || filterProduct) && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              清除篩選
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">品牌</label>
            <select
              value={filterBrand}
              onChange={(e) => {
                setFilterBrand(e.target.value);
                setFilterSeries('');
                setFilterProduct('');
              }}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部品牌</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">系列</label>
            <select
              value={filterSeries}
              onChange={(e) => {
                setFilterSeries(e.target.value);
                setFilterProduct('');
              }}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              disabled={!filterBrand}
            >
              <option value="">全部系列</option>
              {getAvailableSeries().map((series) => (
                <option key={series.id} value={series.id}>
                  {series.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">商品</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部商品</option>
              {getAvailableProducts().map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-gray-900/60 rounded-lg p-6 border border-white/[0.06] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? '編輯獎項' : '新增獎項'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">選擇商品 *</label>
              <select
                required
                disabled={!!editingId}
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">請選擇商品</option>
                {brands.map((brand) => (
                  <optgroup key={brand.id} label={brand.name}>
                    {products
                      .filter((p) => p.series?.brand?.id === brand.id)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          [{product.series?.name || '未知系列'}] {product.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {editingId && (
                <p className="text-xs text-gray-500 mt-1">
                  編輯時無法更改所屬商品
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">賞等 *</label>
                <input
                  type="text"
                  required
                  value={formData.prize}
                  onChange={(e) =>
                    setFormData({ ...formData, prize: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：A賞、B賞、Last賞"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">獎項名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：特等獎公仔、限定海報"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">稀有度</label>
                <select
                  value={formData.rarity}
                  onChange={(e) =>
                    setFormData({ ...formData, rarity: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
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
                <label className="block text-gray-300 mb-2">獎項價值 (¥) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：3000"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">庫存數量 *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
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
                className="w-4 h-4 text-indigo-500 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="ml-2 text-gray-300">
                啟用此獎項
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 獎項列表 */}
      <div className="bg-gray-900/60 rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  ID
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  賞等
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  獎項名稱
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  所屬商品
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  稀有度
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  價值
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  抽取狀況
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  狀態
                </th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    {variants.length === 0 ? '目前沒有獎項' : '沒有符合條件的獎項'}
                  </td>
                </tr>
              ) : (
                filteredVariants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-white/[0.04]">
                    <td className="px-6 py-4 text-gray-300">{variant.id}</td>
                    <td className="px-6 py-4">
                      <span className="text-indigo-400 font-bold">
                        {variant.prize}
                      </span>
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
                        <div className="font-medium text-white">
                          {variant.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-white">
                          {variant.product.name}
                        </div>
                        {variant.product.series && (
                          <div className="text-xs text-gray-400">
                            {variant.product.series.brand?.name || '未知品牌'} •{' '}
                            {variant.product.series.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getRarityColor(variant.rarity)}>
                        {variant.rarity || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-yellow-400 font-semibold">
                        ¥{variant.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-400 font-bold">已抽: {variant._count?.lotteryDraws || 0}</span>
                          <span className="text-green-400 font-bold">剩餘: {variant.stock}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          總數: {variant.stock + (variant._count?.lotteryDraws || 0)}
                        </div>
                        <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${(variant.stock + (variant._count?.lotteryDraws || 0)) > 0 ? ((variant._count?.lotteryDraws || 0) / (variant.stock + (variant._count?.lotteryDraws || 0))) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
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
                        <Link
                          href={`/admin/products/${variant.product.id}/variants`}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          管理
                        </Link>
                        <button
                          onClick={() => handleEdit(variant)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              variant.id,
                              `${variant.prize} ${variant.name}`
                            )
                          }
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

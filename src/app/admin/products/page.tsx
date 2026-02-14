'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  status: string;
  series: {
    id: number;
    name: string;
    brand: {
      id: number;
      name: string;
    };
  };
}

interface Brand {
  id: number;
  name: string;
  series: { id: number; name: string }[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 篩選狀態
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterSeries, setFilterSeries] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [formData, setFormData] = useState({
    seriesId: '',
    name: '',
    slug: '',
    shortDescription: '',
    price: '',
    totalTickets: '',
    status: 'draft',
    coverImage: '',
    galleryImages: [] as string[],
  });

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    if (filterBrand) {
      filtered = filtered.filter(p => p.series.brand.id.toString() === filterBrand);
    }

    if (filterSeries) {
      filtered = filtered.filter(p => p.series.id.toString() === filterSeries);
    }

    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    setFilteredProducts(filtered);
  }, [products, filterBrand, filterSeries, filterStatus]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  async function fetchData() {
    try {
      const [productsRes, brandsRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/brands'),
      ]);

      const productsData = await productsRes.json();
      const brandsData = await brandsRes.json();

      setProducts(productsData.products);
      setFilteredProducts(productsData.products);
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
        ? `/api/admin/products/${editingId}`
        : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          seriesId: '',
          name: '',
          slug: '',
          shortDescription: '',
          price: '',
          totalTickets: '',
          status: 'draft',
          coverImage: '',
          galleryImages: [],
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || (editingId ? '更新失敗' : '新增失敗'));
      }
    } catch (error) {
      console.error(editingId ? '更新商品失敗:' : '新增商品失敗:', error);
    }
  }

  async function handleEdit(product: Product) {
    // 獲取完整商品資料（包含圖片）
    try {
      const res = await fetch(`/api/products/${product.slug}`);
      const data = await res.json();

      setFormData({
        seriesId: product.series.id?.toString() || '',
        name: product.name,
        slug: product.slug,
        shortDescription: data.product.shortDescription || '',
        price: product.price.toString(),
        totalTickets: product.totalTickets.toString(),
        status: product.status,
        coverImage: data.product.coverImage || '',
        galleryImages: data.product.images?.map((img: { url: string }) => img.url) || [],
      });
      setEditingId(product.id);
      setShowForm(true);
    } catch (error) {
      console.error('載入商品資料失敗:', error);
      alert('載入商品資料失敗');
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('刪除商品失敗:', error);
      alert('刪除失敗');
    }
  }

  function handleCancelEdit() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      seriesId: '',
      name: '',
      slug: '',
      shortDescription: '',
      price: '',
      totalTickets: '',
      status: 'draft',
      coverImage: '',
      galleryImages: [],
    });
  }

  function getAvailableSeries() {
    if (!filterBrand) return [];
    const brand = brands.find(b => b.id.toString() === filterBrand);
    return brand?.series || [];
  }

  function clearFilters() {
    setFilterBrand('');
    setFilterSeries('');
    setFilterStatus('');
  }

  if (loading) {
    return <div className="text-white">載入中...</div>;
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">商品管理</h1>
          <p className="text-gray-400">管理所有一番賞商品（共 {filteredProducts.length} 件）</p>
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
          {showForm ? '取消' : '+ 新增商品'}
        </button>
      </div>

      {/* 篩選器 */}
      <div className="bg-gray-900/60 rounded-lg p-6 border border-white/[0.06] mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">篩選條件</h3>
          {(filterBrand || filterSeries || filterStatus) && (
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
                setFilterSeries(''); // 切換品牌時清除系列篩選
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
              onChange={(e) => setFilterSeries(e.target.value)}
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
            <label className="block text-gray-300 mb-2 text-sm">狀態</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部狀態</option>
              <option value="draft">草稿</option>
              <option value="active">進行中</option>
              <option value="sold_out">已完售</option>
              <option value="archived">已結束</option>
            </select>
          </div>
        </div>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-gray-900/60 rounded-lg p-6 border border-white/[0.06] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? '編輯商品' : '新增商品'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">選擇系列 *</label>
                <select
                  required
                  value={formData.seriesId}
                  onChange={(e) => setFormData({ ...formData, seriesId: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">請選擇系列</option>
                  {brands.map((brand) => (
                    <optgroup key={brand.id} label={brand.name}>
                      {brand.series.map((series) => (
                        <option key={series.id} value={series.id}>
                          {series.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">商品名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：原神須彌主題一番賞"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：genshin-sumeru"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">狀態 *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">草稿</option>
                  <option value="active">進行中</option>
                  <option value="sold_out">已完售</option>
                  <option value="archived">已結束</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">簡短描述</label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="簡短描述..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">單抽價格 (NT$) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：120"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">總抽數 *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：500"
                />
              </div>
            </div>

            <ImageUpload
              label="商品封面圖"
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
            />

            <MultiImageUpload
              label="商品圖片集（最多 4 張）"
              images={formData.galleryImages}
              onChange={(images) => setFormData({ ...formData, galleryImages: images })}
              maxImages={4}
            />

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

      {/* 商品列表 */}
      <div className="bg-gray-900/60 rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">ID</th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">商品名稱</th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">品牌/系列</th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">價格</th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">抽取進度</th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">狀態</th>
                <th className="text-left px-6 py-4 text-gray-300 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    {products.length === 0 ? '目前沒有商品' : '沒有符合條件的商品'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const progress = Math.round(
                    (product.soldTickets / product.totalTickets) * 100
                  );

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.04]">
                      <td className="px-6 py-4 text-gray-300">{product.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-sm text-gray-400">{product.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="text-sm font-medium">{product.series.brand.name}</div>
                        <div className="text-xs text-gray-500">{product.series.name}</div>
                      </td>
                      <td className="px-6 py-4 text-indigo-400 font-medium">
                        NT$ {product.price}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-indigo-400 font-bold">已抽: {product.soldTickets}</span>
                            <span className="text-green-400 font-bold">剩餘: {product.totalTickets - product.soldTickets}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            總數: {product.totalTickets} ({progress}%)
                          </div>
                          <div className="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                progress === 100 ? 'bg-red-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.status === 'active' && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                            進行中
                          </span>
                        )}
                        {product.status === 'draft' && (
                          <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                            草稿
                          </span>
                        )}
                        {product.status === 'sold_out' && (
                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                            已完售
                          </span>
                        )}
                        {product.status === 'archived' && (
                          <span className="bg-slate-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                            已結束
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          >
                            查看
                          </Link>
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="text-red-400 hover:text-red-300 text-sm transition-colors"
                          >
                            刪除
                          </button>
                          <Link
                            href={`/admin/products/${product.id}/variants`}
                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            獎項管理
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

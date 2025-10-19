'use client';

import { useEffect, useState } from 'react';
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsRes, brandsRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/brands'),
      ]);

      const productsData = await productsRes.json();
      const brandsData = await brandsRes.json();

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
        galleryImages: data.product.images?.map((img: any) => img.url) || [],
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

  if (loading) {
    return <div className="text-white">載入中...</div>;
  }

  const selectedBrand = brands.find((b) =>
    b.series.some((s) => s.id === parseInt(formData.seriesId))
  );
  const availableSeries = selectedBrand?.series || [];

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">商品管理</h1>
          <p className="text-slate-400">管理所有一番賞商品</p>
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
          {showForm ? '取消' : '+ 新增商品'}
        </button>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? '編輯商品' : '新增商品'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2">選擇系列 *</label>
                <select
                  required
                  value={formData.seriesId}
                  onChange={(e) => setFormData({ ...formData, seriesId: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-slate-300 mb-2">商品名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：原神須彌主題一番賞"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：genshin-sumeru"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">狀態 *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="draft">草稿</option>
                  <option value="active">進行中</option>
                  <option value="sold_out">已完售</option>
                  <option value="archived">已結束</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-2">簡短描述</label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                rows={2}
                placeholder="簡短描述..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2">單抽價格 (NT$) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：120"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">總抽數 *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
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

      {/* 商品列表 */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">ID</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">商品名稱</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">品牌/系列</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">價格</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">進度</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">狀態</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    目前沒有商品
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const progress = Math.round(
                    (product.soldTickets / product.totalTickets) * 100
                  );

                  return (
                    <tr key={product.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-slate-300">{product.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-sm text-slate-400">{product.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="text-sm">{product.series.brand.name}</div>
                        <div className="text-xs text-slate-500">{product.series.name}</div>
                      </td>
                      <td className="px-6 py-4 text-orange-400 font-medium">
                        NT$ {product.price}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">
                          {product.soldTickets} / {product.totalTickets}
                        </div>
                        <div className="w-24 bg-slate-600 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
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
                          <span className="bg-slate-500/20 text-slate-400 px-2 py-1 rounded text-xs">
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
                            className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="text-red-400 hover:text-red-300 text-sm transition-colors"
                          >
                            刪除
                          </button>
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

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
  brand: {
    id: number;
    name: string;
  };
}

interface Brand {
  id: number;
  name: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: '上架', className: 'bg-green-500/20 text-green-400' },
  draft: { label: '待定', className: 'bg-gray-500/20 text-zinc-400' },
  sold_out: { label: '已完售', className: 'bg-red-500/20 text-red-400' },
  archived: { label: '已結束', className: 'bg-slate-500/20 text-zinc-400' },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 篩選狀態
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [formData, setFormData] = useState({
    brandId: '',
    name: '',
    slug: '',
    shortDescription: '',
    price: '',
    totalTickets: '',
    status: 'active',
    coverImage: '',
    galleryImages: [] as string[],
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleProductNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      ...(!slugManuallyEdited ? { slug: generateSlug(name) } : {}),
    }));
  }

  function handleProductSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  }

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    if (filterBrand) {
      filtered = filtered.filter(p => p.brand.id.toString() === filterBrand);
    }

    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    setFilteredProducts(filtered);
  }, [products, filterBrand, filterStatus]);

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
        fetch('/api/admin/brands'),
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
        setSlugManuallyEdited(false);
        setFormData({
          brandId: '',
          name: '',
          slug: '',
          shortDescription: '',
          price: '',
          totalTickets: '',
          status: 'active',
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
    try {
      const res = await fetch(`/api/products/${product.slug}`);
      const data = await res.json();

      setFormData({
        brandId: product.brand.id?.toString() || '',
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
      setSlugManuallyEdited(true);
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
    setSlugManuallyEdited(false);
    setFormData({
      brandId: '',
      name: '',
      slug: '',
      shortDescription: '',
      price: '',
      totalTickets: '',
      status: 'active',
      coverImage: '',
      galleryImages: [],
    });
  }

  function clearFilters() {
    setFilterBrand('');
    setFilterStatus('');
  }

  const hasActiveFilters = filterBrand || filterStatus;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)] animate-pulse">
            <div className="h-5 bg-surface-3 rounded w-1/3 mb-3" />
            <div className="h-4 bg-surface-3 rounded w-2/3 mb-2" />
            <div className="h-8 bg-surface-3 rounded w-full mt-3" />
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
          <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">商品管理</h1>
          <p className="text-zinc-400 text-sm">共 {filteredProducts.length} 件商品</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-amber-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-all text-sm md:text-base min-h-[44px]"
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </div>

      {/* 篩選器 */}
      <div className="mb-4 md:mb-6">
        {/* 折疊篩選按鈕 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white active:text-white transition-colors mb-3 min-h-[44px] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          篩選
          {hasActiveFilters && (
            <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs">
              篩選中
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showFilters && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)]">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-sm md:text-lg font-medium text-white">篩選條件</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-amber-400 hover:text-amber-300 active:text-amber-200 transition-colors min-h-[44px] flex items-center cursor-pointer"
              >
                清除篩選
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-zinc-300 mb-1.5 text-sm">品牌</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
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
              <label className="block text-zinc-300 mb-1.5 text-sm">狀態</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
              >
                <option value="">全部狀態</option>
                <option value="draft">待定</option>
                <option value="active">上架</option>
                <option value="sold_out">已完售</option>
                <option value="archived">已結束</option>
              </select>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)] mb-5 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">
            {editingId ? '編輯商品' : '新增商品'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">選擇品牌 *</label>
                <select
                  required
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                >
                  <option value="">請選擇品牌</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">商品名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="例如：原神須彌主題一番賞"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => handleProductSlugChange(e.target.value)}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="自動產生，也可手動修改"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">狀態 *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                >
                  <option value="draft">草稿</option>
                  <option value="active">進行中</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 mb-1.5 text-sm">簡短描述</label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                rows={2}
                placeholder="簡短描述..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">單抽價格 (NT$) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">總抽數 *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                  className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base"
                  placeholder="500"
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

      {/* 商品列表 */}
      {filteredProducts.length === 0 ? (
        <div className="bg-surface-1/60 rounded-xl p-8 md:p-12 border border-[var(--border)] text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
          </svg>
          <p className="text-zinc-400 text-sm">
            {products.length === 0 ? '目前沒有商品' : '沒有符合條件的商品'}
          </p>
        </div>
      ) : (
        <>
          {/* 手機版：卡片列表 */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product) => {
              const progress = Math.round(
                (product.soldTickets / product.totalTickets) * 100
              );
              const status = statusMap[product.status] || statusMap.draft;

              return (
                <div
                  key={product.id}
                  className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)]"
                >
                  {/* 頂部：名稱 + 狀態 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-base truncate">{product.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{product.brand.name}</p>
                    </div>
                    <span className={`${status.className} px-2.5 py-1 rounded-full text-xs flex-shrink-0 ml-2`}>
                      {status.label}
                    </span>
                  </div>

                  {/* 中間：價格 + 進度 */}
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <span className="text-amber-400 font-bold text-lg">NT$ {product.price}</span>
                    <span className="text-xs text-zinc-400">
                      {product.soldTickets}/{product.totalTickets} ({progress}%)
                    </span>
                  </div>

                  {/* 進度條 */}
                  <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress === 100 ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* 底部操作按鈕 */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                    <Link
                      href={`/admin/products/${product.id}/variants`}
                      className="flex-1 text-center py-2.5 rounded-lg bg-amber-500/15 text-amber-400 text-sm font-medium active:bg-amber-500/25 transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      獎項管理
                    </Link>
                    <button
                      onClick={() => handleEdit(product)}
                      className="py-2.5 px-4 rounded-lg bg-surface-3/50 text-zinc-300 text-sm active:bg-surface-3 transition-colors min-h-[44px] cursor-pointer"
                    >
                      編輯
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      className="py-2.5 px-4 rounded-lg bg-surface-3/50 text-zinc-300 text-sm active:bg-surface-3 transition-colors min-h-[44px] flex items-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="py-2.5 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm active:bg-red-500/20 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
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
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">商品名稱</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">品牌</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">價格</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">抽取進度</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">狀態</th>
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredProducts.map((product) => {
                    const progress = Math.round(
                      (product.soldTickets / product.totalTickets) * 100
                    );
                    const status = statusMap[product.status] || statusMap.draft;

                    return (
                      <tr key={product.id} className="hover:bg-white/[0.04]">
                        <td className="px-6 py-4 text-zinc-300">{product.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-sm text-zinc-400">{product.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          <div className="text-sm font-medium">{product.brand.name}</div>
                        </td>
                        <td className="px-6 py-4 text-amber-400 font-medium">
                          NT$ {product.price}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-400 font-bold">已抽: {product.soldTickets}</span>
                              <span className="text-green-400 font-bold">剩餘: {product.totalTickets - product.soldTickets}</span>
                            </div>
                            <div className="text-xs text-zinc-400">
                              總數: {product.totalTickets} ({progress}%)
                            </div>
                            <div className="w-32 bg-surface-3 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  progress === 100 ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${status.className} px-2 py-1 rounded text-xs`}>
                            {status.label}
                          </span>
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
                              className="text-amber-400 hover:text-amber-300 text-sm transition-colors cursor-pointer"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer"
                            >
                              刪除
                            </button>
                            <Link
                              href={`/admin/products/${product.id}/variants`}
                              className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 transition-colors"
                            >
                              獎項管理
                            </Link>
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

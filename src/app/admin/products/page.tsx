'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  brand: { id: number; name: string };
}

interface Brand {
  id: number;
  name: string;
}

interface DiscountEntry {
  drawCount: string;
  price: string;
  label: string;
}

interface VariantEntry {
  _id?: number; // DB id — undefined = new
  prize: string;
  name: string;
  rarity: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: '上架', className: 'bg-green-500/20 text-green-400' },
  draft: { label: '待定', className: 'bg-gray-500/20 text-zinc-400' },
  sold_out: { label: '已完售', className: 'bg-red-500/20 text-red-400' },
  archived: { label: '已結束', className: 'bg-slate-500/20 text-zinc-400' },
};

const rarityOptions = [
  { value: 'SSR', label: 'SSR' },
  { value: 'SR', label: 'SR' },
  { value: 'R', label: 'R' },
  { value: 'N', label: 'N' },
];

const emptyFormData = {
  brandId: '',
  name: '',
  slug: '',
  shortDescription: '',
  price: '',
  totalTickets: '',
  status: 'active',
  coverImage: '',
  galleryImages: [] as string[],
  comboDiscounts: [] as DiscountEntry[],
  fullSetDiscounts: [] as DiscountEntry[],
  variants: [] as VariantEntry[],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // 記錄載入時的 variant IDs，用來算需要刪除哪些
  const [loadedVariantIds, setLoadedVariantIds] = useState<number[]>([]);

  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // SSR guard for createPortal
  useEffect(() => { setMounted(true); }, []);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setOpenMenuId(null);
    }
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenuId]);

  // ─── slug ───
  function generateSlug(name: string): string {
    return name.toLowerCase().trim()
      .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\s-]/g, '')
      .replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function handleProductNameChange(name: string) {
    setFormData(p => ({ ...p, name, ...(!slugManuallyEdited ? { slug: generateSlug(name) } : {}) }));
  }
  function handleProductSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setFormData(p => ({ ...p, slug }));
  }

  // ─── discount helpers ───
  function addDiscount(type: 'comboDiscounts' | 'fullSetDiscounts') {
    setFormData(p => ({ ...p, [type]: [...p[type], { drawCount: '', price: '', label: '' }] }));
  }
  function removeDiscount(type: 'comboDiscounts' | 'fullSetDiscounts', i: number) {
    setFormData(p => ({ ...p, [type]: p[type].filter((_, j) => j !== i) }));
  }
  function updateDiscount(type: 'comboDiscounts' | 'fullSetDiscounts', i: number, field: keyof DiscountEntry, value: string) {
    setFormData(p => ({ ...p, [type]: p[type].map((d, j) => j === i ? { ...d, [field]: value } : d) }));
  }

  // ─── variant helpers ───
  function addVariant() {
    setFormData(p => ({
      ...p,
      variants: [...p.variants, { prize: '', name: '', rarity: '', stock: '', imageUrl: '', isActive: true }],
    }));
  }
  function removeVariant(i: number) {
    setFormData(p => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }));
  }
  function updateVariant(i: number, field: keyof VariantEntry, value: string | boolean) {
    setFormData(p => ({ ...p, variants: p.variants.map((v, j) => j === i ? { ...v, [field]: value } : v) }));
  }

  // ─── 儲存折扣 ───
  async function saveDiscounts(productId: number) {
    const existingRes = await fetch(`/api/admin/discounts?productId=${productId}`);
    if (existingRes.ok) {
      const { discounts } = await existingRes.json();
      if (discounts.length > 0) {
        await Promise.all(discounts.map((d: { id: number }) =>
          fetch(`/api/admin/discounts/${d.id}`, { method: 'DELETE' })));
      }
    }
    const all = [
      ...formData.comboDiscounts.filter(d => d.drawCount && d.price).map(d => ({ ...d, type: 'combo', productId })),
      ...formData.fullSetDiscounts.filter(d => d.drawCount && d.price).map(d => ({ ...d, type: 'full_set', productId })),
    ];
    if (all.length > 0) {
      await Promise.all(all.map(d =>
        fetch('/api/admin/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })));
    }
  }

  // ─── 儲存獎項 ───
  async function saveVariants(productId: number) {
    const currentIds = formData.variants.filter(v => v._id).map(v => v._id!);
    const toDelete = loadedVariantIds.filter(id => !currentIds.includes(id));

    await Promise.all([
      // 刪除被移除的
      ...toDelete.map(id =>
        fetch(`/api/admin/variants/${id}`, { method: 'DELETE' })),
      // 新增 / 更新
      ...formData.variants.filter(v => v.prize && v.name).map(v => {
        const payload = { productId, prize: v.prize, name: v.name, rarity: v.rarity || null, stock: v.stock, imageUrl: v.imageUrl || null, isActive: v.isActive };
        if (v._id) {
          return fetch(`/api/admin/variants/${v._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        return fetch('/api/admin/variants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }),
    ]);
  }

  // ─── filters ───
  const applyFilters = useCallback(() => {
    let f = [...products];
    if (filterBrand) f = f.filter(p => p.brand.id.toString() === filterBrand);
    if (filterStatus) f = f.filter(p => p.status === filterStatus);
    setFilteredProducts(f);
  }, [products, filterBrand, filterStatus]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [applyFilters]);

  async function fetchData() {
    try {
      const [pRes, bRes] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/brands')]);
      const pData = await pRes.json();
      const bData = await bRes.json();
      setProducts(pData.products);
      setFilteredProducts(pData.products);
      setBrands(bData.brands);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  }

  // ─── submit ───
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';
      const { comboDiscounts: _c, fullSetDiscounts: _f, variants: _v, ...productPayload } = formData;

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productPayload) });
      if (res.ok) {
        const data = await res.json();
        const pid = editingId || data.product?.id;
        if (pid) {
          await Promise.all([saveDiscounts(pid), saveVariants(pid)]);
        }
        setShowForm(false);
        setEditingId(null);
        setSlugManuallyEdited(false);
        setLoadedVariantIds([]);
        setFormData({ ...emptyFormData });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || (editingId ? '更新失敗' : '新增失敗'));
      }
    } catch (error) {
      console.error('儲存失敗:', error);
    } finally {
      setSaving(false);
    }
  }

  // ─── edit：用 admin API 一次取完 ───
  async function handleEdit(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`);
      if (!res.ok) { alert('載入商品資料失敗'); return; }
      const { product: p } = await res.json();

      const combos: DiscountEntry[] = [];
      const fullSets: DiscountEntry[] = [];
      for (const d of p.discounts || []) {
        const entry = { drawCount: d.drawCount.toString(), price: d.price.toString(), label: d.label || '' };
        if (d.type === 'combo') combos.push(entry);
        else fullSets.push(entry);
      }

      const variants: VariantEntry[] = (p.variants || []).map((v: { id: number; prize: string; name: string; rarity: string | null; stock: number; imageUrl: string | null; isActive: boolean }) => ({
        _id: v.id, prize: v.prize, name: v.name, rarity: v.rarity || '', stock: v.stock.toString(), imageUrl: v.imageUrl || '', isActive: v.isActive,
      }));
      setLoadedVariantIds(variants.map(v => v._id!));

      setFormData({
        brandId: p.brand?.id?.toString() || product.brand.id.toString(),
        name: product.name,
        slug: product.slug,
        shortDescription: p.shortDescription || '',
        price: product.price.toString(),
        totalTickets: product.totalTickets.toString(),
        status: product.status,
        coverImage: p.coverImage || '',
        galleryImages: (p.images || []).filter((img: { type: string }) => img.type === 'gallery').map((img: { url: string }) => img.url),
        comboDiscounts: combos,
        fullSetDiscounts: fullSets,
        variants,
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
    if (!confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData(); else alert('刪除失敗');
    } catch { alert('刪除失敗'); }
  }

  function handleCancelEdit() {
    setShowForm(false);
    setEditingId(null);
    setSlugManuallyEdited(false);
    setLoadedVariantIds([]);
    setFormData({ ...emptyFormData });
  }

  function clearFilters() { setFilterBrand(''); setFilterStatus(''); }

  const hasActiveFilters = filterBrand || filterStatus;
  const unitPrice = parseInt(formData.price) || 0;

  // ─── Discount Row Component ───
  const DiscountRow = ({ type, d, idx }: { type: 'comboDiscounts' | 'fullSetDiscounts'; d: DiscountEntry; idx: number }) => {
    const drawNum = parseInt(d.drawCount) || 0;
    const priceNum = parseInt(d.price) || 0;
    const orig = drawNum * unitPrice;
    const save = orig - priceNum;
    return (
      <div className="bg-surface-2/50 rounded-xl p-3 border border-surface-3/50">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <div>
            <label className="block text-zinc-500 text-xs mb-1">抽數</label>
            <input type="number" min="1" value={d.drawCount} onChange={e => updateDiscount(type, idx, 'drawCount', e.target.value)}
              className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" placeholder="3" />
          </div>
          <div>
            <label className="block text-zinc-500 text-xs mb-1">總價</label>
            <input type="number" min="0" value={d.price} onChange={e => updateDiscount(type, idx, 'price', e.target.value)}
              className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" placeholder="280" />
          </div>
          <div>
            <label className="block text-zinc-500 text-xs mb-1">名稱</label>
            <input type="text" value={d.label} onChange={e => updateDiscount(type, idx, 'label', e.target.value)}
              className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" placeholder="選填" />
          </div>
          <button type="button" onClick={() => removeDiscount(type, idx)} className="text-red-400 hover:text-red-300 p-2 cursor-pointer" title="移除">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {drawNum > 0 && priceNum > 0 && unitPrice > 0 && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-zinc-500">原價 {orig} 點</span>
            {save > 0 && <span className="text-green-400 font-medium">省 {save} 點</span>}
            <span className="text-zinc-500">每抽 {Math.round(priceNum / drawNum)} 點</span>
          </div>
        )}
      </div>
    );
  };

  // ─── Action Dropdown Component (Portal-based) ───
  const ActionMenu = ({ product }: { product: Product }) => {
    const isOpen = openMenuId === product.id;
    const localBtnRef = useRef<HTMLButtonElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
      if (!isOpen || !localBtnRef.current) { setPos(null); return; }
      const rect = localBtnRef.current.getBoundingClientRect();
      const menuW = 170;
      let left = rect.right - menuW;
      if (left < 8) left = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuH = 240; // approx
      const top = spaceBelow > menuH ? rect.bottom + 4 : rect.top - menuH - 4;
      setPos({ top, left });
    }, [isOpen]);

    // Sync shared ref so click-outside works
    useEffect(() => {
      if (isOpen) {
        (btnRef as React.MutableRefObject<HTMLButtonElement | null>).current = localBtnRef.current;
      }
    }, [isOpen]);

    const dropdown = isOpen && pos && mounted ? createPortal(
      <div
        ref={menuRef}
        style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
        className="bg-surface-1 border border-[var(--border)] rounded-xl shadow-2xl min-w-[170px] py-1"
      >
        <Link href={`/products/${product.slug}`} target="_blank" onClick={() => setOpenMenuId(null)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
          查看
        </Link>
        <button onClick={() => { setOpenMenuId(null); handleEdit(product); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
          編輯
        </button>
        <Link href={`/admin/products/${product.id}/variants`} onClick={() => setOpenMenuId(null)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-2.27.853 6.003 6.003 0 01-2.27-.853" /></svg>
          獎項管理
        </Link>
        <Link href={`/admin/products/${product.id}/discounts`} onClick={() => setOpenMenuId(null)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
          折扣設定
        </Link>
        <div className="border-t border-white/[0.06] my-1" />
        <button onClick={() => { setOpenMenuId(null); handleDelete(product.id, product.name); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          刪除
        </button>
      </div>,
      document.body
    ) : null;

    return (
      <>
        <button
          ref={localBtnRef}
          onClick={(e) => { e.stopPropagation(); setOpenMenuId(isOpen ? null : product.id); }}
          className="p-2 rounded-lg hover:bg-surface-3/50 active:bg-surface-3 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
        {dropdown}
      </>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
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
          onClick={() => { if (showForm) handleCancelEdit(); else setShowForm(true); }}
          className="bg-amber-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-all text-sm md:text-base min-h-[44px]"
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </div>

      {/* 篩選器 */}
      <div className="mb-4 md:mb-6">
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white active:text-white transition-colors mb-3 min-h-[44px] cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
          篩選
          {hasActiveFilters && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs">篩選中</span>}
          <svg className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        {showFilters && (
          <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm md:text-lg font-medium text-white">篩選條件</h3>
              {hasActiveFilters && <button onClick={clearFilters} className="text-sm text-amber-400 hover:text-amber-300 active:text-amber-200 transition-colors min-h-[44px] flex items-center cursor-pointer">清除篩選</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">品牌</label>
                <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base">
                  <option value="">全部品牌</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">狀態</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base">
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

      {/* ==================== 新增/編輯表單 ==================== */}
      {showForm && (
        <div className="bg-surface-1/60 rounded-xl p-4 md:p-6 border border-[var(--border)] mb-5 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">{editingId ? '編輯商品' : '新增商品'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── 基本資訊 ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">選擇品牌 *</label>
                <select required value={formData.brandId} onChange={e => setFormData({ ...formData, brandId: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base">
                  <option value="">請選擇品牌</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">商品名稱 *</label>
                <input type="text" required value={formData.name} onChange={e => handleProductNameChange(e.target.value)} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="例如：原神須彌主題一番賞" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">Slug *</label>
                <input type="text" required value={formData.slug} onChange={e => handleProductSlugChange(e.target.value)} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="自動產生" />
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">狀態 *</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base">
                  <option value="active">上架</option>
                  <option value="draft">待定</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-zinc-300 mb-1.5 text-sm">簡短描述</label>
              <textarea value={formData.shortDescription} onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" rows={2} placeholder="簡短描述..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">單抽價格 (NT$) *</label>
                <input type="number" required min="1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="120" />
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">總抽數 *</label>
                <input type="number" required min="1" value={formData.totalTickets} onChange={e => setFormData({ ...formData, totalTickets: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="500" />
              </div>
            </div>

            <ImageUpload label="商品封面圖" value={formData.coverImage} onChange={url => setFormData({ ...formData, coverImage: url })} />
            <MultiImageUpload label="商品圖片集（最多 4 張）" images={formData.galleryImages} onChange={images => setFormData({ ...formData, galleryImages: images })} maxImages={4} />

            {/* ── 組合價設定 ── */}
            <div className="border-t border-white/[0.06] pt-5 mt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">組合價設定（選填）</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">任何時候都適用，例如：3 抽 280 元、5 抽 450 元</p>
                </div>
                <button type="button" onClick={() => addDiscount('comboDiscounts')} className="text-amber-400 hover:text-amber-300 active:text-amber-200 text-sm font-medium transition-colors min-h-[44px] cursor-pointer">+ 新增組合價</button>
              </div>
              {formData.comboDiscounts.length === 0
                ? <p className="text-zinc-600 text-sm py-2">尚未新增任何組合價</p>
                : <div className="space-y-3">{formData.comboDiscounts.map((d, i) => <DiscountRow key={i} type="comboDiscounts" d={d} idx={i} />)}</div>
              }
            </div>

            {/* ── 開套優惠 ── */}
            <div className="border-t border-white/[0.06] pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">開套優惠（選填）</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">僅在整套完全未抽過時適用</p>
                </div>
                <button type="button" onClick={() => addDiscount('fullSetDiscounts')} className="text-amber-400 hover:text-amber-300 active:text-amber-200 text-sm font-medium transition-colors min-h-[44px] cursor-pointer">+ 新增開套優惠</button>
              </div>
              {formData.fullSetDiscounts.length === 0
                ? <p className="text-zinc-600 text-sm py-2">尚未新增任何開套優惠</p>
                : <div className="space-y-3">{formData.fullSetDiscounts.map((d, i) => <DiscountRow key={i} type="fullSetDiscounts" d={d} idx={i} />)}</div>
              }
            </div>

            {/* ── 賞項設定 ── */}
            <div className="border-t border-white/[0.06] pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">賞項設定</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">A 賞、B 賞等獎項</p>
                </div>
                <button type="button" onClick={addVariant} className="text-amber-400 hover:text-amber-300 active:text-amber-200 text-sm font-medium transition-colors min-h-[44px] cursor-pointer">+ 新增賞項</button>
              </div>
              {formData.variants.length === 0 ? (
                <p className="text-zinc-600 text-sm py-2">尚未新增任何賞項，點擊上方按鈕新增</p>
              ) : (
                <div className="space-y-3">
                  {formData.variants.map((v, i) => (
                    <div key={i} className="bg-surface-2/50 rounded-xl p-3 border border-surface-3/50">
                      <div className="grid grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_80px_80px_auto] gap-2 items-end">
                        <div>
                          <label className="block text-zinc-500 text-xs mb-1">賞等 *</label>
                          <input type="text" value={v.prize} onChange={e => updateVariant(i, 'prize', e.target.value)}
                            className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" placeholder="A賞" />
                        </div>
                        <div>
                          <label className="block text-zinc-500 text-xs mb-1">名稱 *</label>
                          <input type="text" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)}
                            className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" placeholder="獎項名稱" />
                        </div>
                        <div>
                          <label className="block text-zinc-500 text-xs mb-1">稀有度</label>
                          <select value={v.rarity} onChange={e => updateVariant(i, 'rarity', e.target.value)}
                            className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                            <option value="">-</option>
                            {rarityOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-zinc-500 text-xs mb-1">庫存 *</label>
                          <input type="number" min="0" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)}
                            className="w-full bg-surface-deep text-white border border-surface-3 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-amber-500" placeholder="5" />
                        </div>
                        <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-300 p-2 cursor-pointer self-end" title="移除">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      {/* 圖片上傳 */}
                      <div className="mt-2">
                        <ImageUpload label="" value={v.imageUrl} onChange={url => updateVariant(i, 'imageUrl', url)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 儲存按鈕 ── */}
            <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
              <button type="submit" disabled={saving}
                className="flex-1 md:flex-none bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors min-h-[44px] disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={handleCancelEdit}
                className="flex-1 md:flex-none bg-surface-3 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 active:bg-gray-700 transition-colors min-h-[44px]">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 商品列表 ==================== */}
      {filteredProducts.length === 0 ? (
        <div className="bg-surface-1/60 rounded-xl p-8 md:p-12 border border-[var(--border)] text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
          </svg>
          <p className="text-zinc-400 text-sm">{products.length === 0 ? '目前沒有商品' : '沒有符合條件的商品'}</p>
        </div>
      ) : (
        <>
          {/* 手機版：卡片列表 */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map(product => {
              const progress = Math.round((product.soldTickets / product.totalTickets) * 100);
              const status = statusMap[product.status] || statusMap.draft;
              return (
                <div key={product.id} className="bg-surface-1/60 rounded-xl p-4 border border-[var(--border)]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-base truncate">{product.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{product.brand.name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <span className={`${status.className} px-2.5 py-1 rounded-full text-xs`}>{status.label}</span>
                      <ActionMenu product={product} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <span className="text-amber-400 font-bold text-lg">NT$ {product.price}</span>
                    <span className="text-xs text-zinc-400">{product.soldTickets}/{product.totalTickets} ({progress}%)</span>
                  </div>
                  <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
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
                    <th className="text-left px-6 py-4 text-zinc-300 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredProducts.map(product => {
                    const progress = Math.round((product.soldTickets / product.totalTickets) * 100);
                    const status = statusMap[product.status] || statusMap.draft;
                    return (
                      <tr key={product.id} className="hover:bg-white/[0.04]">
                        <td className="px-6 py-4 text-zinc-300">{product.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-sm text-zinc-400">{product.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300"><div className="text-sm font-medium">{product.brand.name}</div></td>
                        <td className="px-6 py-4 text-amber-400 font-medium">NT$ {product.price}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-400 font-bold">已抽: {product.soldTickets}</span>
                              <span className="text-green-400 font-bold">剩餘: {product.totalTickets - product.soldTickets}</span>
                            </div>
                            <div className="text-xs text-zinc-400">總數: {product.totalTickets} ({progress}%)</div>
                            <div className="w-32 bg-surface-3 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${status.className} px-2 py-1 rounded text-xs`}>{status.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <ActionMenu product={product} />
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

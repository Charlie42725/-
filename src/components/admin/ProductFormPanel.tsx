'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────
export interface DiscountEntry {
  drawCount: string;
  price: string;
  label: string;
}

export interface VariantEntry {
  _id?: number;
  prize: string;
  name: string;
  rarity: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

export interface ProductFormData {
  brandId: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: string;
  totalTickets: string;
  status: string;
  coverImage: string;
  galleryImages: string[];
  comboDiscounts: DiscountEntry[];
  fullSetDiscounts: DiscountEntry[];
  variants: VariantEntry[];
}

interface Brand {
  id: number;
  name: string;
}

interface ProductFormPanelProps {
  open: boolean;
  editingId: number | null;
  formData: ProductFormData;
  brands: Brand[];
  saving: boolean;
  onFormDataChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onSlugManualEdit: () => void;
  slugManuallyEdited: boolean;
}

const rarityOptions = [
  { value: 'SSR', label: 'SSR' },
  { value: 'SR', label: 'SR' },
  { value: 'R', label: 'R' },
  { value: 'N', label: 'N' },
];

type TabKey = 'basic' | 'images' | 'discounts' | 'variants';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'basic', label: '基本資訊' },
  { key: 'images', label: '圖片' },
  { key: 'discounts', label: '折扣' },
  { key: 'variants', label: '賞項' },
];

// ─── Component ───────────────────────────────────────────
export default function ProductFormPanel({
  open,
  editingId,
  formData,
  brands,
  saving,
  onFormDataChange,
  onSubmit,
  onCancel,
  onSlugManualEdit,
  slugManuallyEdited,
}: ProductFormPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setClosing(false);
      setActiveTab('basic');
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onCancel();
    }, 250);
  }, [onCancel]);

  // ─── Field helpers ───
  function generateSlug(name: string): string {
    return name.toLowerCase().trim()
      .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\s-]/g, '')
      .replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  function update(patch: Partial<ProductFormData>) {
    onFormDataChange({ ...formData, ...patch });
  }

  function handleNameChange(name: string) {
    update({ name, ...(!slugManuallyEdited ? { slug: generateSlug(name) } : {}) });
  }

  function handleSlugChange(slug: string) {
    onSlugManualEdit();
    update({ slug });
  }

  // ─── Discount helpers ───
  function addDiscount(type: 'comboDiscounts' | 'fullSetDiscounts') {
    update({ [type]: [...formData[type], { drawCount: '', price: '', label: '' }] });
  }
  function removeDiscount(type: 'comboDiscounts' | 'fullSetDiscounts', i: number) {
    update({ [type]: formData[type].filter((_, j) => j !== i) });
  }
  function updateDiscount(type: 'comboDiscounts' | 'fullSetDiscounts', i: number, field: keyof DiscountEntry, value: string) {
    update({ [type]: formData[type].map((d, j) => j === i ? { ...d, [field]: value } : d) });
  }

  // ─── Variant helpers ───
  function addVariant() {
    const newVariants = [...formData.variants, { prize: '', name: '', rarity: '', stock: '', imageUrl: '', isActive: true }];
    update({ variants: newVariants });
    setExpandedVariant(newVariants.length - 1);
  }
  function removeVariant(i: number) {
    update({ variants: formData.variants.filter((_, j) => j !== i) });
    if (expandedVariant === i) setExpandedVariant(null);
    else if (expandedVariant !== null && expandedVariant > i) setExpandedVariant(expandedVariant - 1);
  }
  function updateVariant(i: number, field: keyof VariantEntry, value: string | boolean) {
    update({ variants: formData.variants.map((v, j) => j === i ? { ...v, [field]: value } : v) });
  }

  const unitPrice = parseInt(formData.price) || 0;

  // ─── Tab badge counts ───
  function tabBadge(key: TabKey): string | null {
    switch (key) {
      case 'images': {
        const n = (formData.coverImage ? 1 : 0) + formData.galleryImages.length;
        return n > 0 ? String(n) : null;
      }
      case 'discounts': {
        const n = formData.comboDiscounts.length + formData.fullSetDiscounts.length;
        return n > 0 ? String(n) : null;
      }
      case 'variants':
        return formData.variants.length > 0 ? String(formData.variants.length) : null;
      default:
        return null;
    }
  }

  // ─── Discount Row ───
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

  // ─── Render nothing if not open or SSR ───
  if (!mounted || (!open && !closing)) return null;

  const panel = (
    <div className="fixed inset-0 z-[9998]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 ${closing ? 'fade-out' : 'fade-in'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`absolute inset-y-0 right-0 w-full md:max-w-2xl bg-surface-0 flex flex-col shadow-2xl ${closing ? 'slide-out-right' : 'slide-in-right'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {editingId ? '編輯商品' : '新增商品'}
          </h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-surface-3/50 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] overflow-x-auto flex-shrink-0 px-2 md:px-4">
          {tabs.map(t => {
            const badge = tabBadge(t.key);
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === t.key
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
                {badge && (
                  <span className="ml-1.5 inline-flex items-center justify-center bg-amber-500/20 text-amber-400 text-xs rounded-full min-w-[18px] h-[18px] px-1">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* ─── Tab: 基本資訊 ─── */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1.5 text-sm">選擇品牌 *</label>
                  <select required value={formData.brandId} onChange={e => update({ brandId: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base">
                    <option value="">請選擇品牌</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1.5 text-sm">商品名稱 *</label>
                  <input type="text" required value={formData.name} onChange={e => handleNameChange(e.target.value)} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="例如：原神須彌主題一番賞" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1.5 text-sm">Slug *</label>
                  <input type="text" required value={formData.slug} onChange={e => handleSlugChange(e.target.value)} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="自動產生" />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1.5 text-sm">狀態 *</label>
                  <select value={formData.status} onChange={e => update({ status: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base">
                    <option value="active">上架</option>
                    <option value="draft">待定</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-300 mb-1.5 text-sm">簡短描述</label>
                <textarea value={formData.shortDescription} onChange={e => update({ shortDescription: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" rows={2} placeholder="簡短描述..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1.5 text-sm">單抽價格 (NT$) *</label>
                  <input type="number" required min="1" value={formData.price} onChange={e => update({ price: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="120" />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1.5 text-sm">總抽數 *</label>
                  <input type="number" required min="1" value={formData.totalTickets} onChange={e => update({ totalTickets: e.target.value })} className="w-full bg-surface-2 text-white border border-surface-3 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 text-base" placeholder="500" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab: 圖片 ─── */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <ImageUpload id="panel-cover" label="商品封面圖" value={formData.coverImage} onChange={url => update({ coverImage: url })} />
              <MultiImageUpload label="商品圖片集" images={formData.galleryImages} onChange={images => update({ galleryImages: images })} />
            </div>
          )}

          {/* ─── Tab: 折扣 ─── */}
          {activeTab === 'discounts' && (
            <div className="space-y-6">
              {/* 組合價 */}
              <div>
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

              {/* 開套優惠 */}
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
            </div>
          )}

          {/* ─── Tab: 賞項 ─── */}
          {activeTab === 'variants' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">賞項設定</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">A 賞、B 賞等獎項</p>
                </div>
                <button type="button" onClick={addVariant} className="text-amber-400 hover:text-amber-300 active:text-amber-200 text-sm font-medium transition-colors min-h-[44px] cursor-pointer">+ 新增賞項</button>
              </div>
              {formData.variants.length === 0 ? (
                <p className="text-zinc-600 text-sm py-2">尚未新增任何賞項，點擊上方按鈕新增</p>
              ) : (
                <div className="space-y-2">
                  {formData.variants.map((v, i) => {
                    const isExpanded = expandedVariant === i;
                    return (
                      <div key={i} className="bg-surface-2/50 rounded-xl border border-surface-3/50 overflow-hidden">
                        {/* Compact row */}
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-surface-3 flex-shrink-0 overflow-hidden relative">
                            {v.imageUrl ? (
                              <Image src={v.imageUrl} alt={v.name || '賞項'} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm truncate">
                                {v.prize || '?賞'} - {v.name || '未命名'}
                              </span>
                              {v.rarity && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  v.rarity === 'SSR' ? 'bg-amber-500/20 text-amber-400' :
                                  v.rarity === 'SR' ? 'bg-purple-500/20 text-purple-400' :
                                  v.rarity === 'R' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-zinc-500/20 text-zinc-400'
                                }`}>
                                  {v.rarity}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">庫存: {v.stock || '0'}</div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={() => setExpandedVariant(isExpanded ? null : i)}
                              className="p-2 rounded-lg hover:bg-surface-3/50 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer" title={isExpanded ? '收合' : '編輯'}>
                              <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => removeVariant(i)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer" title="刪除">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>

                        {/* Expanded editing area */}
                        {isExpanded && (
                          <div className="border-t border-surface-3/50 p-3 space-y-3">
                            <div className="grid grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_80px_80px] gap-2 items-end">
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
                            </div>
                            <ImageUpload id={`variant-img-${i}`} label="" value={v.imageUrl} onChange={url => updateVariant(i, 'imageUrl', url)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
        <div className="flex-shrink-0 border-t border-white/[0.06] bg-surface-0 px-4 md:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <button type="button" disabled={saving} onClick={onSubmit}
              className="flex-1 md:flex-none bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer">
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button type="button" onClick={handleClose}
              className="flex-1 md:flex-none bg-surface-3 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 active:bg-gray-700 transition-colors min-h-[44px] cursor-pointer">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

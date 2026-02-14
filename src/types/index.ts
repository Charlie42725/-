import { Product, Series, Brand, ProductVariant, Image, ProductStatus } from '@prisma/client';

// ======================================
// 🔹 前端顯示用的完整商品類型
// ======================================
export type ProductWithDetails = Product & {
  series: Series & {
    brand: Brand;
  };
  variants: ProductVariant[];
  images: Image[];
};

// ======================================
// 🔹 商品卡片用的簡化類型
// ======================================
export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  totalTickets: number;
  soldTickets: number;
  status: ProductStatus;
  coverImage: string | null;
  series: {
    name: string;
    slug: string;
    brand: {
      name: string;
      slug: string;
    };
  };
  variants?: {
    id: number;
    name: string;
    prize: string;
    rarity: string;
  }[];
};

// ======================================
// 🔹 品牌與系列
// ======================================
export type BrandWithSeries = Brand & {
  series: Series[];
};

export type SeriesWithProducts = Series & {
  brand: Brand;
  products: Product[];
};

// ======================================
// 🔹 篩選參數
// ======================================
export type FilterParams = {
  brandSlug?: string;
  seriesSlug?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'popular';
};

// ======================================
// 🔹 進度計算
// ======================================
export function calculateProgress(soldTickets: number, totalTickets: number): number {
  if (totalTickets === 0) return 0;
  return Math.round((soldTickets / totalTickets) * 100);
}

// ======================================
// 🔹 狀態文字映射
// ======================================
export const statusText: Record<ProductStatus, string> = {
  draft: '準備中',
  active: '進行中',
  sold_out: '已完抽',
  archived: '已結束',
};

// ======================================
// 🔹 狀態顏色映射
// ======================================
export const statusColor: Record<ProductStatus, string> = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  sold_out: 'bg-red-500',
  archived: 'bg-gray-600',
};

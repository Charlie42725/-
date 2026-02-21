/**
 * 折扣計算引擎（純函數）
 * 優先級：開套 (full_set) > 組合價 (combo) > 原價
 */

export interface Discount {
  id: number;
  type: 'full_set' | 'combo';
  drawCount: number;
  price: number;
  label: string | null;
  isActive: boolean;
}

export interface PriceSegment {
  type: 'full_set' | 'combo' | 'regular';
  drawCount: number;
  price: number;
  label: string | null;
  times: number; // combo 套用幾次，full_set 和 regular 固定為 1
}

export interface PriceBreakdown {
  totalPrice: number;
  regularPrice: number;
  savings: number;
  segments: PriceSegment[];
}

export function calculateDiscountedPrice(
  drawCount: number,
  unitPrice: number,
  soldTickets: number,
  discounts: Discount[]
): PriceBreakdown {
  const regularPrice = unitPrice * drawCount;

  if (drawCount <= 0) {
    return { totalPrice: 0, regularPrice: 0, savings: 0, segments: [] };
  }

  const activeDiscounts = discounts.filter(d => d.isActive);
  const fullSetDiscounts = activeDiscounts
    .filter(d => d.type === 'full_set')
    .sort((a, b) => b.drawCount - a.drawCount); // 大的優先
  const comboDiscounts = activeDiscounts
    .filter(d => d.type === 'combo')
    .sort((a, b) => b.drawCount - a.drawCount); // 大的優先（貪心）

  const segments: PriceSegment[] = [];
  let totalPrice = 0;
  let remaining = drawCount;

  // 1. 開套優惠：soldTickets === 0 時，找 drawCount <= N 的最大 full_set
  if (soldTickets === 0 && fullSetDiscounts.length > 0) {
    const matched = fullSetDiscounts.find(d => d.drawCount <= drawCount);
    if (matched) {
      segments.push({
        type: 'full_set',
        drawCount: matched.drawCount,
        price: matched.price,
        label: matched.label,
        times: 1,
      });
      totalPrice += matched.price;
      remaining -= matched.drawCount;
    }
  }

  // 2. 組合價：貪心填充剩餘抽數
  for (const combo of comboDiscounts) {
    if (remaining <= 0) break;
    const times = Math.floor(remaining / combo.drawCount);
    if (times > 0) {
      segments.push({
        type: 'combo',
        drawCount: combo.drawCount,
        price: combo.price,
        label: combo.label,
        times,
      });
      totalPrice += combo.price * times;
      remaining -= combo.drawCount * times;
    }
  }

  // 3. 剩餘用原價
  if (remaining > 0) {
    segments.push({
      type: 'regular',
      drawCount: remaining,
      price: unitPrice * remaining,
      label: null,
      times: 1,
    });
    totalPrice += unitPrice * remaining;
  }

  return {
    totalPrice,
    regularPrice,
    savings: regularPrice - totalPrice,
    segments,
  };
}

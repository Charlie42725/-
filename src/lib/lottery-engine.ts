/**
 * 一番賞抽獎引擎
 * 功能：
 * 1. 稀有度保底機制
 * 2. 動態機率調整
 * 3. Last 賞特殊處理
 */

import { prisma } from './db';

export interface PrizeVariant {
  id: number;
  prize: string;
  name: string;
  rarity: string;
  stock: number;
  isLastPrize: boolean;
  probability?: number;
}

export interface PrizePool {
  variants: PrizeVariant[];
  totalTickets: number;
  soldTickets: number;
}

export interface DrawConfig {
  enablePitySystem: boolean;
  pityThreshold: number;
  lastPrizeMultiplier: number;
}

const DEFAULT_CONFIG: DrawConfig = {
  enablePitySystem: true,
  pityThreshold: 10,
  lastPrizeMultiplier: 2.0,
};

// 稀有度權重（數值越小越稀有）
const RARITY_WEIGHTS = {
  'SSR': 1,
  'SR': 3,
  'R': 10,
  'N': 20,
};

/**
 * 計算每個獎項的實際抽中機率
 */
export function calculateProbabilities(
  pool: PrizePool,
  config: DrawConfig = DEFAULT_CONFIG
): Map<number, number> {
  const probabilities = new Map<number, number>();
  let totalWeight = 0;

  pool.variants.forEach(variant => {
    if (variant.stock <= 0) {
      probabilities.set(variant.id, 0);
      return;
    }

    // 使用自定義機率或根據稀有度計算
    const rarityWeight = RARITY_WEIGHTS[variant.rarity as keyof typeof RARITY_WEIGHTS] || 10;
    let weight = variant.probability
      ? variant.probability * 100
      : rarityWeight * variant.stock;

    // Last 賞檢測：剩餘總數 <= 10% 時提升機率
    const remainingRatio = (pool.totalTickets - pool.soldTickets) / pool.totalTickets;
    if (remainingRatio <= 0.1) {
      weight *= config.lastPrizeMultiplier;
    }

    probabilities.set(variant.id, weight);
    totalWeight += weight;
  });

  // 正規化為真實機率（0-1）
  if (totalWeight > 0) {
    probabilities.forEach((weight, id) => {
      probabilities.set(id, weight / totalWeight);
    });
  }

  return probabilities;
}

/**
 * 保底系統：檢查用戶最近 N 抽是否有高稀有度
 */
export async function checkPitySystem(
  userId: number,
  productId: number,
  config: DrawConfig
): Promise<boolean> {
  if (!config.enablePitySystem) {
    return false;
  }

  const recentDraws = await prisma.lotteryDraw.findMany({
    where: {
      userId,
      productId,
    },
    include: {
      variant: {
        select: {
          rarity: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: config.pityThreshold,
  });

  // 如果抽取次數不足保底閾值，不觸發保底
  if (recentDraws.length < config.pityThreshold) {
    return false;
  }

  // 如果最近 N 抽都沒有 SSR/SR，觸發保底
  const hasHighRarity = recentDraws.some(
    draw => draw.variant.rarity === 'SSR' || draw.variant.rarity === 'SR'
  );

  return !hasHighRarity;
}

/**
 * 執行抽獎（帶保底）
 */
export async function drawWithPity(
  pool: PrizePool,
  userId: number,
  productId: number,
  config: DrawConfig = DEFAULT_CONFIG
): Promise<{ variantId: number; triggeredPity: boolean }> {
  // 檢查是否為最後一抽
  const remainingTickets = pool.totalTickets - pool.soldTickets;
  if (remainingTickets === 1) {
    // 強制抽到 Last 賞（如果存在）
    const lastPrize = pool.variants.find(v => v.isLastPrize && v.stock > 0);
    if (lastPrize) {
      return {
        variantId: lastPrize.id,
        triggeredPity: false,
      };
    }
  }

  // 檢查保底
  const shouldTriggerPity = await checkPitySystem(userId, productId, config);

  let probabilities = calculateProbabilities(pool, config);

  // 保底觸發：強制選擇 SSR 或 SR
  if (shouldTriggerPity) {
    const highRarityVariants = pool.variants.filter(
      v => (v.rarity === 'SSR' || v.rarity === 'SR') && v.stock > 0
    );

    if (highRarityVariants.length > 0) {
      // 重新計算只包含高稀有度的機率
      probabilities = new Map();
      const totalStock = highRarityVariants.reduce((sum, v) => sum + v.stock, 0);
      highRarityVariants.forEach(v => {
        probabilities.set(v.id, v.stock / totalStock);
      });
    }
  }

  // 加權隨機抽取
  const random = Math.random();
  let cumulative = 0;

  for (const [variantId, prob] of probabilities.entries()) {
    cumulative += prob;
    if (random <= cumulative) {
      return {
        variantId,
        triggeredPity: shouldTriggerPity,
      };
    }
  }

  // 兜底：返回第一個有庫存的獎項
  const fallback = pool.variants.find(v => v.stock > 0);
  if (!fallback) {
    throw new Error('沒有可用的獎項');
  }

  return {
    variantId: fallback.id,
    triggeredPity: shouldTriggerPity,
  };
}

/**
 * 獲取用戶的保底進度
 */
export async function getPityProgress(
  userId: number,
  productId: number,
  config: DrawConfig = DEFAULT_CONFIG
): Promise<{
  drawCount: number;
  pityThreshold: number;
  remainingDraws: number;
  nextPityDraw: number;
}> {
  const recentDraws = await prisma.lotteryDraw.findMany({
    where: {
      userId,
      productId,
    },
    include: {
      variant: {
        select: {
          rarity: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: config.pityThreshold,
  });

  // 計算距離上次高稀有度的抽數
  let drawsSinceHighRarity = 0;
  for (const draw of recentDraws) {
    if (draw.variant.rarity === 'SSR' || draw.variant.rarity === 'SR') {
      break;
    }
    drawsSinceHighRarity++;
  }

  const remainingDraws = Math.max(0, config.pityThreshold - drawsSinceHighRarity);

  return {
    drawCount: drawsSinceHighRarity,
    pityThreshold: config.pityThreshold,
    remainingDraws,
    nextPityDraw: config.pityThreshold - drawsSinceHighRarity,
  };
}

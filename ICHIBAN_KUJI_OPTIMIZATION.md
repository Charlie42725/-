# 一番賞抽賞平台 - 完整功能優化方案

> **專案定位**: 線上一番賞（日式盲抽）電商平台
> **目標用戶**: 動漫、遊戲周邊愛好者
> **核心玩法**: 盲抽機制 + 限量稀有度系統 + 點數經濟

---

## 📊 當前狀態評估

### ✅ 已完成功能
- 基礎商品管理（品牌、系列、產品、獎項）
- 用戶註冊登入系統
- 抽獎核心邏輯
- 訂單系統
- 點數系統
- 後台管理介面
- 前台商品展示

### ❌ 缺失的核心功能
1. **真實支付整合**（目前只有 mock）
2. **Email/SMS 通知**（只有 TODO）
3. **庫存實時同步**
4. **抽獎動畫與視覺反饋**
5. **中獎紀錄展示**
6. **社群分享功能**
7. **物流追蹤**
8. **會員等級制度**

---

## 🎯 第一階段：核心業務邏輯優化（2週）

### 1. 抽獎系統增強 ⭐⭐⭐⭐⭐

#### 1.1 賞池機制優化
**問題**: 目前完全隨機，無法控制稀有獎項出現率

**解決方案**: 實作「保底機制」+「機率池」

**新檔案**: `src/lib/lottery-engine.ts`

```typescript
/**
 * 一番賞抽獎引擎
 * 特點：
 * 1. 稀有度保底機制
 * 2. 動態機率調整
 * 3. Last 賞特殊處理
 */

export interface PrizePool {
  variants: {
    id: number;
    prize: string;
    name: string;
    rarity: 'SSR' | 'SR' | 'R' | 'N';
    stock: number;
    probability?: number; // 自定義機率
  }[];
  totalTickets: number;
  soldTickets: number;
}

export interface DrawConfig {
  enablePitySystem: boolean;      // 啟用保底
  pityThreshold: number;           // 保底觸發次數（如：10 抽必出 SR+）
  lastPrizeMultiplier: number;     // Last 賞機率倍增
}

const DEFAULT_CONFIG: DrawConfig = {
  enablePitySystem: true,
  pityThreshold: 10,
  lastPrizeMultiplier: 2.0,
};

/**
 * 計算每個獎項的實際抽中機率
 */
export function calculateProbabilities(pool: PrizePool, config: DrawConfig = DEFAULT_CONFIG): Map<number, number> {
  const probabilities = new Map<number, number>();
  let totalWeight = 0;

  // 基礎權重：稀有度越高權重越低
  const rarityWeights = {
    'SSR': 1,    // 最稀有
    'SR': 3,
    'R': 10,
    'N': 20,     // 最常見
  };

  pool.variants.forEach(variant => {
    if (variant.stock <= 0) {
      probabilities.set(variant.id, 0);
      return;
    }

    // 使用自定義機率或根據稀有度計算
    let weight = variant.probability
      ? variant.probability * 100
      : rarityWeights[variant.rarity] * variant.stock;

    // Last 賞檢測：剩餘總數 <= 10% 時提升機率
    const remainingRatio = (pool.totalTickets - pool.soldTickets) / pool.totalTickets;
    if (remainingRatio <= 0.1) {
      weight *= config.lastPrizeMultiplier;
    }

    probabilities.set(variant.id, weight);
    totalWeight += weight;
  });

  // 正規化為真實機率（0-1）
  probabilities.forEach((weight, id) => {
    probabilities.set(id, weight / totalWeight);
  });

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
  const { prisma } = await import('./db');

  const recentDraws = await prisma.lotteryDraw.findMany({
    where: {
      userId,
      productId,
    },
    include: {
      variant: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: config.pityThreshold,
  });

  // 如果最近 N 抽都沒有 SSR/SR，觸發保底
  const hasHighRarity = recentDraws.some(
    draw => draw.variant.rarity === 'SSR' || draw.variant.rarity === 'SR'
  );

  return !hasHighRarity && recentDraws.length >= config.pityThreshold;
}

/**
 * 執行抽獎（帶保底）
 */
export async function drawWithPity(
  pool: PrizePool,
  userId: number,
  productId: number,
  ticketNumber: number,
  config: DrawConfig = DEFAULT_CONFIG
): Promise<{ variantId: number; triggeredPity: boolean }> {
  const shouldTriggerPity = config.enablePitySystem
    ? await checkPitySystem(userId, productId, config)
    : false;

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
      return { variantId, triggeredPity: shouldTriggerPity };
    }
  }

  // 兜底：返回第一個有庫存的獎項
  const fallback = pool.variants.find(v => v.stock > 0);
  return {
    variantId: fallback!.id,
    triggeredPity: shouldTriggerPity
  };
}
```

**修改抽獎 API**: `src/app/api/lottery/draw/route.ts`

在現有抽獎邏輯中整合保底系統：

```typescript
import { drawWithPity, calculateProbabilities } from '@/lib/lottery-engine';

// 在 transaction 中使用
const { variantId, triggeredPity } = await drawWithPity(
  prizePool,
  payload.userId,
  productId,
  ticketNumber
);

// 記錄是否觸發保底（用於前端顯示特效）
await prisma.lotteryDraw.create({
  data: {
    // ... 其他欄位
    metadata: {
      triggeredPity,
      timestamp: new Date().toISOString(),
    }
  }
});
```

#### 1.2 「Last 賞」特殊機制

**功能**: 當商品只剩最後一抽時，保證抽到指定的 Last 賞

**實作**:

在 `ProductVariant` schema 中添加標記：

```prisma
model ProductVariant {
  // ... 現有欄位
  isLastPrize Boolean @default(false)  // 標記為 Last 賞
}
```

在抽獎邏輯中：

```typescript
// 檢查是否為最後一抽
const remainingTickets = product.totalTickets - product.soldTickets;

if (remainingTickets === 1) {
  // 強制抽到 Last 賞
  const lastPrize = availableVariants.find(v => v.isLastPrize && v.stock > 0);

  if (lastPrize) {
    selectedVariantId = lastPrize.id;
    console.log(`🎉 Last 賞觸發！用戶 ${userId} 抽到 ${lastPrize.name}`);
  }
}
```

---

### 2. 實時庫存與防超賣 ⭐⭐⭐⭐⭐

**問題**: 高並發下可能出現超賣

**解決方案**: 樂觀鎖 + 資料庫級別約束

**修改抽獎 API**:

```typescript
// 使用 Prisma transaction + 原子更新
const result = await prisma.$transaction(async (tx) => {
  // 1. 檢查並鎖定獎項庫存
  const variant = await tx.productVariant.findUnique({
    where: { id: selectedVariantId },
  });

  if (!variant || variant.stock <= 0) {
    throw new Error('該獎項已售罄');
  }

  // 2. 原子性減少庫存（防止超賣）
  const updated = await tx.productVariant.updateMany({
    where: {
      id: selectedVariantId,
      stock: { gt: 0 }, // 只有庫存 > 0 才更新
    },
    data: {
      stock: { decrement: 1 },
    },
  });

  if (updated.count === 0) {
    throw new Error('庫存不足，請重試');
  }

  // 3. 創建抽獎記錄
  const draw = await tx.lotteryDraw.create({
    data: {
      userId: payload.userId,
      productId,
      variantId: selectedVariantId,
      ticketNumber,
    },
  });

  // 4. 更新商品已售票數
  await tx.product.update({
    where: { id: productId },
    data: { soldTickets: { increment: 1 } },
  });

  return draw;
}, {
  maxWait: 5000,      // 最多等待 5 秒
  timeout: 10000,     // 超時時間 10 秒
  isolationLevel: 'Serializable', // 最高隔離級別
});
```

**添加資料庫約束** (`prisma/schema.prisma`):

```prisma
model LotteryDraw {
  // ... 其他欄位

  @@unique([productId, ticketNumber]) // 確保同一票號不會被抽兩次
  @@index([userId, createdAt])
  @@index([productId, variantId])
}
```

執行 migration:
```bash
npx prisma migrate dev --name add_unique_ticket_constraint
```

---

### 3. 中獎紀錄實時展示 ⭐⭐⭐⭐

**功能**: 首頁顯示最新中獎紀錄，營造氛圍

**新 API**: `src/app/api/lottery/recent-draws/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    const recentDraws = await prisma.lotteryDraw.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            nickname: true,
            // 隱藏敏感資訊
          },
        },
        variant: {
          select: {
            prize: true,
            name: true,
            rarity: true,
            imageUrl: true,
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // 脫敏處理：隱藏部分用戶名
    const sanitizedDraws = recentDraws.map(draw => ({
      ...draw,
      user: {
        nickname: maskNickname(draw.user.nickname), // 如：「張***」
      },
    }));

    return NextResponse.json({ draws: sanitizedDraws });
  } catch (error) {
    console.error('獲取中獎紀錄失敗:', error);
    return NextResponse.json({ error: '獲取失敗' }, { status: 500 });
  }
}

function maskNickname(name: string): string {
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}
```

**前端組件**: `src/components/RecentDraws.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Draw {
  id: number;
  user: { nickname: string };
  variant: {
    prize: string;
    name: string;
    rarity: string;
    imageUrl: string | null;
  };
  product: {
    name: string;
    slug: string;
  };
  createdAt: string;
}

export default function RecentDraws() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDraws() {
      try {
        const res = await fetch('/api/lottery/recent-draws?limit=10');
        const data = await res.json();
        setDraws(data.draws);
      } catch (error) {
        console.error('載入中獎紀錄失敗:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDraws();

    // 每 30 秒刷新一次
    const interval = setInterval(fetchDraws, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-slate-400">載入中...</div>;
  }

  const rarityColors = {
    SSR: 'text-yellow-400 bg-yellow-500/20',
    SR: 'text-purple-400 bg-purple-500/20',
    R: 'text-blue-400 bg-blue-500/20',
    N: 'text-gray-400 bg-gray-500/20',
  };

  return (
    <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <span className="mr-2">🎊</span>
        最新中獎
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {draws.map((draw) => (
          <div
            key={draw.id}
            className="flex items-center space-x-4 bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors"
          >
            {/* 獎項圖片 */}
            {draw.variant.imageUrl && (
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={draw.variant.imageUrl}
                  alt={draw.variant.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}

            {/* 中獎資訊 */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm text-slate-400">{draw.user.nickname}</span>
                <span className="text-xs text-slate-500">抽中了</span>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    rarityColors[draw.variant.rarity as keyof typeof rarityColors]
                  }`}
                >
                  {draw.variant.prize}
                </span>
                <span className="text-white font-medium text-sm truncate">
                  {draw.variant.name}
                </span>
              </div>

              <div className="text-xs text-slate-500 mt-1">
                來自「{draw.product.name}」
              </div>
            </div>

            {/* 時間 */}
            <div className="text-xs text-slate-500 flex-shrink-0">
              {formatTime(draw.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;

  return `${Math.floor(hours / 24)} 天前`;
}
```

在首頁添加：

```typescript
// src/app/page.tsx
import RecentDraws from '@/components/RecentDraws';

export default function HomePage() {
  return (
    <div>
      <Header />
      <Banner />

      {/* 新增：中獎紀錄 */}
      <section className="max-w-screen-xl mx-auto px-4 py-12">
        <RecentDraws />
      </section>

      <FilterSection />
      <ProductGrid />
      <Footer />
    </div>
  );
}
```

---

### 4. 抽獎動畫與視覺反饋 ⭐⭐⭐⭐

**功能**: 提升抽獎體驗，增加儀式感

**新組件**: `src/components/DrawAnimation.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface DrawResult {
  variant: {
    prize: string;
    name: string;
    rarity: string;
    imageUrl: string | null;
  };
  triggeredPity?: boolean;
}

interface Props {
  isDrawing: boolean;
  result: DrawResult | null;
  onComplete: () => void;
}

export default function DrawAnimation({ isDrawing, result, onComplete }: Props) {
  const [stage, setStage] = useState<'idle' | 'spinning' | 'reveal' | 'celebrate'>('idle');

  useEffect(() => {
    if (isDrawing) {
      setStage('spinning');
    }
  }, [isDrawing]);

  useEffect(() => {
    if (result && stage === 'spinning') {
      // 延遲 2 秒後顯示結果
      const timer = setTimeout(() => {
        setStage('reveal');

        // 高稀有度觸發彩帶
        if (result.variant.rarity === 'SSR' || result.variant.rarity === 'SR') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }

        // 保底觸發特殊效果
        if (result.triggeredPity) {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#FFD700', '#FFA500'],
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [result, stage]);

  const rarityBg = {
    SSR: 'from-yellow-500 to-orange-500',
    SR: 'from-purple-500 to-pink-500',
    R: 'from-blue-500 to-cyan-500',
    N: 'from-gray-500 to-slate-500',
  };

  return (
    <AnimatePresence>
      {stage !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={stage === 'reveal' ? onComplete : undefined}
        >
          <div className="text-center">
            {stage === 'spinning' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-32 h-32 border-8 border-orange-400 border-t-transparent rounded-full mx-auto"
              />
            )}

            {stage === 'reveal' && result && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className={`bg-gradient-to-br ${rarityBg[result.variant.rarity as keyof typeof rarityBg]} p-8 rounded-2xl shadow-2xl max-w-md`}
              >
                {result.triggeredPity && (
                  <div className="text-yellow-300 font-bold text-lg mb-4 animate-pulse">
                    🎊 保底觸發！
                  </div>
                )}

                <div className="text-6xl font-bold text-white mb-4">
                  {result.variant.prize}
                </div>

                {result.variant.imageUrl && (
                  <div className="relative w-64 h-64 mx-auto mb-4">
                    <img
                      src={result.variant.imageUrl}
                      alt={result.variant.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="text-2xl text-white font-bold mb-2">
                  {result.variant.name}
                </div>

                <div className="text-white/80 text-sm">
                  點擊任意處關閉
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

安裝依賴：
```bash
npm install framer-motion canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## 🎯 第二階段：會員系統與經濟體系（2週）

### 5. 會員等級制度 ⭐⭐⭐⭐

**Schema 更新**:

```prisma
model User {
  // ... 現有欄位
  level         Int      @default(1)        // 會員等級
  experience    Int      @default(0)        // 經驗值
  totalSpent    Int      @default(0)        // 累計消費（用於升級）
  vipExpireAt   DateTime?                   // VIP 到期時間
}

model UserLevel {
  id            Int      @id @default(autoincrement())
  level         Int      @unique                // 等級
  name          String                           // 等級名稱（如：青銅、白銀）
  minExperience Int                              // 所需最低經驗
  benefits      Json                             // 權益（折扣、專屬商品等）
  icon          String?                          // 等級圖標
  color         String   @default("#gray")      // 顯示顏色
}
```

**等級權益範例**:

| 等級 | 名稱 | 所需經驗 | 權益 |
|------|------|----------|------|
| 1 | 見習玩家 | 0 | - |
| 2 | 青銅收藏家 | 1000 | 購物 9.5 折 |
| 3 | 白銀獵人 | 5000 | 購物 9 折、生日禮包 |
| 4 | 黃金大師 | 15000 | 購物 8.5 折、專屬商品、優先購買權 |
| 5 | 鉑金傳說 | 50000 | 購物 8 折、免運、每月贈點 |

**升級邏輯** (`src/lib/user-level.ts`):

```typescript
export async function updateUserExperience(userId: number, amount: number) {
  const { prisma } = await import('./db');

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      experience: { increment: amount },
      totalSpent: { increment: amount },
    },
  });

  // 檢查是否升級
  const newLevel = await prisma.userLevel.findFirst({
    where: {
      minExperience: { lte: user.experience },
    },
    orderBy: { level: 'desc' },
  });

  if (newLevel && newLevel.level > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel.level },
    });

    // TODO: 發送升級通知
    console.log(`🎉 用戶 ${userId} 升級到 ${newLevel.name}！`);
  }

  return user;
}
```

---

### 6. 簽到與每日任務 ⭐⭐⭐

**Schema**:

```prisma
model DailyCheckIn {
  id          Int      @id @default(autoincrement())
  userId      Int
  checkInDate DateTime @default(now())
  streak      Int      @default(1)  // 連續簽到天數
  reward      Int                   // 獲得的點數

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, checkInDate])
  @@index([userId])
}

model DailyTask {
  id          Int      @id @default(autoincrement())
  userId      Int
  taskType    String   // 任務類型：draw, share, invite
  completed   Boolean  @default(false)
  completedAt DateTime?
  reward      Int      // 獎勵點數
  date        DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
}
```

**簽到 API**: `src/app/api/user/check-in/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUser } from '@/lib/auth';

export async function POST(request: Request) {
  const authResult = await verifyUser(request.headers);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const userId = authResult.payload!.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // 檢查今天是否已簽到
    const existingCheckIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        checkInDate: { gte: today },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: '今天已經簽到過了' },
        { status: 400 }
      );
    }

    // 獲取昨天的簽到記錄
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckIn = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        checkInDate: { gte: yesterday, lt: today },
      },
    });

    // 計算連續簽到天數
    const streak = yesterdayCheckIn ? yesterdayCheckIn.streak + 1 : 1;

    // 獎勵遞增：連續簽到獎勵更多
    const reward = Math.min(10 + (streak - 1) * 2, 50); // 最多 50 點

    // 創建簽到記錄
    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId,
        checkInDate: today,
        streak,
        reward,
      },
    });

    // 發放點數
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: reward },
      },
    });

    // 記錄點數交易
    await prisma.pointTransaction.create({
      data: {
        userId,
        amount: reward,
        type: 'earned',
        description: `每日簽到（連續 ${streak} 天）`,
      },
    });

    return NextResponse.json({
      success: true,
      checkIn,
      message: `簽到成功！獲得 ${reward} 點（連續簽到 ${streak} 天）`,
    });
  } catch (error) {
    console.error('簽到失敗:', error);
    return NextResponse.json({ error: '簽到失敗' }, { status: 500 });
  }
}
```

---

## 🎯 第三階段：社群與分享（1週）

### 7. 社群分享功能 ⭐⭐⭐

**功能**: 分享中獎結果到社群媒體，獲得獎勵

**新組件**: `src/components/ShareButton.tsx`

```typescript
'use client';

interface Props {
  variant: {
    prize: string;
    name: string;
    rarity: string;
  };
  productName: string;
  onShare?: () => void;
}

export default function ShareButton({ variant, productName, onShare }: Props) {
  const shareText = `我在良級懸賞抽中了【${variant.prize} ${variant.name}】！來自「${productName}」一番賞 🎊`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const platforms = [
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LINE',
      icon: '💚',
      url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.();

    // 記錄分享行為（可用於任務系統）
    fetch('/api/user/track-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    }).catch(console.error);
  };

  return (
    <div className="flex space-x-4">
      {platforms.map((platform) => (
        <button
          key={platform.name}
          onClick={() => handleShare(platform.name, platform.url)}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
        >
          <span>{platform.icon}</span>
          <span className="text-white text-sm">{platform.name}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## 🎯 第四階段：支付與物流（1週）

### 8. NewebPay 藍新金流整合 ⭐⭐⭐⭐⭐

**目前狀態**: 只有 mock API

**實作步驟**:

1. **安裝 SDK**:
```bash
npm install crypto
```

2. **環境變數**:
```env
NEWEBPAY_MERCHANT_ID="your_merchant_id"
NEWEBPAY_HASH_KEY="your_hash_key"
NEWEBPAY_HASH_IV="your_hash_iv"
NEWEBPAY_VERSION="2.0"
NEWEBPAY_RETURN_URL="https://yourdomain.com/api/payment/newebpay-return"
NEWEBPAY_NOTIFY_URL="https://yourdomain.com/api/payment/newebpay-notify"
```

3. **加密工具** (`src/lib/newebpay.ts`):

```typescript
import crypto from 'crypto';

export interface PaymentData {
  MerchantOrderNo: string;
  Amt: number;
  ItemDesc: string;
  Email: string;
  LoginType?: number;
}

export function generateNewebPayData(data: PaymentData): string {
  const merchantID = process.env.NEWEBPAY_MERCHANT_ID!;
  const hashKey = process.env.NEWEBPAY_HASH_KEY!;
  const hashIV = process.env.NEWEBPAY_HASH_IV!;
  const version = process.env.NEWEBPAY_VERSION || '2.0';
  const returnURL = process.env.NEWEBPAY_RETURN_URL!;
  const notifyURL = process.env.NEWEBPAY_NOTIFY_URL!;

  const tradeInfo = {
    MerchantID: merchantID,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    Version: version,
    MerchantOrderNo: data.MerchantOrderNo,
    Amt: data.Amt,
    ItemDesc: data.ItemDesc,
    Email: data.Email,
    ReturnURL: returnURL,
    NotifyURL: notifyURL,
    LoginType: data.LoginType || 0,
  };

  // AES 加密
  const cipher = crypto.createCipheriv('aes256', hashKey, hashIV);
  const encrypted = cipher.update(JSON.stringify(tradeInfo), 'utf8', 'hex') + cipher.final('hex');

  // SHA256 簽章
  const shaText = `HashKey=${hashKey}&${encrypted}&HashIV=${hashIV}`;
  const tradeSha = crypto.createHash('sha256').update(shaText).digest('hex').toUpperCase();

  return JSON.stringify({
    MerchantID: merchantID,
    TradeInfo: encrypted,
    TradeSha: tradeSha,
    Version: version,
  });
}

export function decryptNewebPayData(encryptedData: string): any {
  const hashKey = process.env.NEWEBPAY_HASH_KEY!;
  const hashIV = process.env.NEWEBPAY_HASH_IV!;

  const decipher = crypto.createDecipheriv('aes256', hashKey, hashIV);
  const decrypted = decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');

  return JSON.parse(decrypted);
}
```

4. **支付發起 API** (替換 mock):

```typescript
// src/app/api/payment/create/route.ts
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { generateNewebPayData } from '@/lib/newebpay';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const authResult = await verifyUser(request.headers);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const body = await request.json();
  const { orderId } = body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { user: true },
    });

    if (!order || order.userId !== authResult.payload!.userId) {
      return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '訂單狀態錯誤' }, { status: 400 });
    }

    // 生成藍新金流參數
    const paymentData = generateNewebPayData({
      MerchantOrderNo: `ORD${order.id}${Date.now()}`,
      Amt: order.amount,
      ItemDesc: `一番賞訂單 #${order.id}`,
      Email: order.user.email,
    });

    // 返回加密後的資料給前端
    return NextResponse.json({
      paymentUrl: 'https://ccore.newebpay.com/MPG/mpg_gateway',
      paymentData: JSON.parse(paymentData),
    });
  } catch (error) {
    console.error('創建支付失敗:', error);
    return NextResponse.json({ error: '創建支付失敗' }, { status: 500 });
  }
}
```

5. **支付回調處理**:

```typescript
// src/app/api/payment/newebpay-notify/route.ts
import { NextResponse } from 'next/server';
import { decryptNewebPayData } from '@/lib/newebpay';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    // 解密藍新金流回傳資料
    const result = decryptNewebPayData(body.TradeInfo);

    if (result.Status !== 'SUCCESS') {
      console.error('支付失敗:', result.Message);
      return NextResponse.json({ error: '支付失敗' }, { status: 400 });
    }

    // 解析訂單號
    const orderIdMatch = result.MerchantOrderNo.match(/ORD(\d+)/);
    if (!orderIdMatch) {
      return NextResponse.json({ error: '訂單號格式錯誤' }, { status: 400 });
    }

    const orderId = parseInt(orderIdMatch[1]);

    // 更新訂單狀態
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: result.PaymentType,
        transactionId: result.TradeNo,
      },
    });

    // TODO: 發送訂單確認 Email

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('處理支付回調失敗:', error);
    return NextResponse.json({ error: '處理失敗' }, { status: 500 });
  }
}
```

---

## 📝 完整實作清單

### Critical（立即執行）
- [x] 資料庫連接池優化
- [ ] 抽獎保底機制
- [ ] Last 賞特殊處理
- [ ] 防超賣機制
- [ ] 藍新金流整合

### High（本週完成）
- [ ] 中獎紀錄展示
- [ ] 抽獎動畫
- [ ] 會員等級制度
- [ ] 簽到系統
- [ ] 每日任務

### Medium（下週完成）
- [ ] 社群分享功能
- [ ] Email 通知系統
- [ ] SMS 通知系統
- [ ] 物流追蹤
- [ ] 後台數據統計

### Low（有空再做）
- [ ] 推薦系統
- [ ] 優惠券系統
- [ ] 限時活動
- [ ] 直播抽獎
- [ ] AI 推薦

---

## 🚀 立即開始實作

接下來我將為你實作以下功能：

1. ✅ **資料庫連接池優化**（已完成）
2. **抽獎保底機制**
3. **Last 賞特殊處理**
4. **防超賣機制**
5. **中獎紀錄展示**

請確認是否開始執行？

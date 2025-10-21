# 安全性與優化實作指南

> 本文件包含專案全面優化的詳細指南與實作步驟

## 📋 目錄

1. [已完成的修復](#已完成的修復)
2. [Critical 優先級修復（立即執行）](#critical-優先級修復)
3. [High 優先級優化](#high-優先級優化)
4. [Medium 優先級改進](#medium-優先級改進)
5. [環境變數配置](#環境變數配置)
6. [資料庫優化](#資料庫優化)
7. [部署前檢查清單](#部署前檢查清單)

---

## ✅ 已完成的修復

### 1. JWT Secret 安全性修復
**檔案**: `src/lib/auth.ts`

```typescript
// ❌ 修復前（不安全）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ✅ 修復後（安全）
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**影響**: 應用啟動時如果缺少 JWT_SECRET 會直接報錯，避免使用弱密鑰。

### 2. 新增管理員驗證函數
**檔案**: `src/lib/auth.ts`

新增兩個驗證函數：
- `verifyAdmin(headers)`: 驗證管理員權限
- `verifyUser(headers)`: 驗證一般用戶權限

### 3. 新增輸入驗證工具
**檔案**: `src/lib/validation.ts`

提供以下驗證函數：
- `validateId()`: ID 格式驗證
- `validatePagination()`: 分頁參數驗證
- `validateSlug()`: Slug 格式驗證
- `validateEnum()`: 枚舉值驗證
- `validateTicketNumbers()`: 票號驗證
- `validateEmail()`: Email 驗證
- `validatePhone()`: 台灣手機號碼驗證

### 4. 示範 API 安全修復
**檔案**: `src/app/api/admin/products/[id]/route.ts`

已為 GET、DELETE、PUT 方法添加：
- 管理員權限驗證
- ID 格式驗證
- 數值範圍驗證
- 關聯資料檢查

---

## 🔴 Critical 優先級修復（立即執行）

### 1. 為所有後台 API 添加授權驗證

需要修復的檔案（共 8 個 API 路由）：

#### 1.1 品牌管理 API
**檔案**: `src/app/api/admin/brands/route.ts` 和 `src/app/api/admin/brands/[id]/route.ts`

```typescript
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  // 添加此區塊到所有 POST/PUT/DELETE 方法開頭
  const authResult = await verifyAdmin(request.headers);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
    );
  }

  // 原有邏輯...
}
```

應用到以下方法：
- `POST /api/admin/brands` - 創建品牌
- `PUT /api/admin/brands/[id]` - 更新品牌
- `DELETE /api/admin/brands/[id]` - 刪除品牌

#### 1.2 系列管理 API
**檔案**: `src/app/api/admin/series/route.ts` 和 `src/app/api/admin/series/[id]/route.ts`

應用授權驗證到：
- `POST /api/admin/series`
- `PUT /api/admin/series/[id]`
- `DELETE /api/admin/series/[id]`

#### 1.3 產品管理 API
**檔案**: `src/app/api/admin/products/route.ts`

應用授權驗證到：
- `POST /api/admin/products`

#### 1.4 獎項管理 API
**檔案**: `src/app/api/admin/variants/route.ts` 和 `src/app/api/admin/variants/[id]/route.ts`

應用授權驗證到：
- `POST /api/admin/variants`
- `PUT /api/admin/variants/[id]`
- `DELETE /api/admin/variants/[id]`

### 2. 移除開發模式下的驗證碼洩漏

#### 2.1 Email 驗證碼 API
**檔案**: `src/app/api/auth/send-email-code/route.ts`

```typescript
// ❌ 移除此行（第 76 行）
...(process.env.NODE_ENV === 'development' && { devCode: code }),

// ✅ 替換為
// 驗證碼已發送（開發環境請查看伺服器日誌）
```

同時在伺服器端添加日誌：
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`[DEV] Email verification code for ${email}: ${code}`);
}
```

#### 2.2 手機驗證碼 API
**檔案**: `src/app/api/auth/send-phone-code/route.ts`

同樣處理方式移除客戶端驗證碼洩漏。

### 3. 登入 API 的 Secret 重複定義

**檔案**: `src/app/api/auth/login/route.ts`

```typescript
// ❌ 移除重複定義（第 7 行）
const JWT_SECRET = process.env.JWT_SECRET || '...';

// ✅ 改為從 auth.ts 導入
// JWT_SECRET 已在 src/lib/auth.ts 中統一管理，不需重複定義
// 使用 jwt.sign() 時從環境變數直接讀取
const token = jwt.sign(
  { userId: user.id, email: user.email, nickname: user.nickname },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);
```

---

## 🟠 High 優先級優化

### 1. 添加輸入驗證到所有 API

#### 1.1 產品查詢 API
**檔案**: `src/app/api/products/route.ts`

```typescript
import { validatePagination, validateSlug, validateEnum } from '@/lib/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // ✅ 使用驗證工具
  const { limit, offset } = validatePagination(
    searchParams.get('limit'),
    searchParams.get('offset')
  );

  // 驗證 status 枚舉
  const statusStr = searchParams.get('status');
  if (statusStr) {
    const statusValidation = validateEnum(
      statusStr,
      ['draft', 'active', 'sold_out', 'archived'] as const,
      'Status'
    );
    if (!statusValidation.valid) {
      return NextResponse.json({ error: statusValidation.error }, { status: 400 });
    }
  }

  // ... 其餘邏輯
}
```

#### 1.2 訂單查詢 API
**檔案**: `src/app/api/orders/route.ts`

添加 OrderStatus 驗證：
```typescript
import { validateEnum } from '@/lib/validation';

const statusStr = searchParams.get('status');
if (statusStr) {
  const validation = validateEnum(
    statusStr,
    ['pending', 'paid', 'completed', 'cancelled', 'refunded'] as const,
    'Order status'
  );
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  where.status = validation.value;
}
```

#### 1.3 抽獎 API
**檔案**: `src/app/api/lottery/draw/route.ts`

```typescript
import { validateId, validateTicketNumbers } from '@/lib/validation';

export async function POST(request: Request) {
  // 驗證用戶身份
  const authResult = await verifyUser(request.headers);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const body = await request.json();
  const { productId: productIdStr, ticketNumbers } = body;

  // 驗證 productId
  const idValidation = validateId(productIdStr?.toString());
  if (!idValidation.valid) {
    return NextResponse.json({ error: idValidation.error }, { status: 400 });
  }

  // 驗證 ticketNumbers
  const ticketValidation = validateTicketNumbers(ticketNumbers);
  if (!ticketValidation.valid) {
    return NextResponse.json({ error: ticketValidation.error }, { status: 400 });
  }

  // ... 其餘邏輯
}
```

### 2. 檔案上傳安全性優化

**檔案**: `src/app/api/upload/route.ts`

```typescript
import { verifyAdmin } from '@/lib/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Magic bytes 驗證
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magic = MAGIC_BYTES[mimeType as keyof typeof MAGIC_BYTES];
  if (!magic) return false;

  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}

export async function POST(request: Request) {
  // 添加管理員驗證
  const authResult = await verifyAdmin(request.headers);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: '未選擇文件' }, { status: 400 });
  }

  // 檢查 MIME 類型
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: '只允許上傳 JPEG、PNG、GIF 或 WebP 圖片' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 檢查文件大小
  if (buffer.length > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `文件大小不能超過 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // 驗證 magic bytes
  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: '文件內容與聲明的類型不符' },
      { status: 400 }
    );
  }

  // ... 其餘上傳邏輯
}
```

### 3. 統一 API 響應格式

創建統一的響應工具：

**新檔案**: `src/lib/api-response.ts`

```typescript
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function errorResponse(
  error: string,
  errors?: Record<string, string>,
  meta?: Record<string, unknown>
) {
  return {
    success: false,
    error,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}
```

使用範例：
```typescript
import { successResponse, errorResponse } from '@/lib/api-response';

// 成功響應
return NextResponse.json(successResponse({ products, total, limit, offset }));

// 錯誤響應
return NextResponse.json(
  errorResponse('商品不存在'),
  { status: 404 }
);
```

---

## 🟡 Medium 優先級改進

### 1. 添加資料庫索引

**檔案**: `prisma/schema.prisma`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([email])
  @@index([createdAt])
  @@index([isActive])
}

model Product {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([slug])
  @@index([status])
  @@index([createdAt])
  @@index([seriesId, status])
  @@index([status, createdAt])
}

model Brand {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([slug])
  @@index([isActive])
}

model Series {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([slug])
  @@index([brandId, isActive])
}

model ProductVariant {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([productId])
  @@index([isActive])
}

model LotteryDraw {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([userId])
  @@index([productId])
  @@index([variantId])
  @@index([createdAt])
  @@unique([productId, ticketNumber])
}

model Order {
  id        Int      @id @default(autoincrement())
  // ... 其他欄位

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

執行遷移：
```bash
npx prisma migrate dev --name add_indexes
```

### 2. 改進前端組件性能

#### 2.1 Header 組件優化
**檔案**: `src/components/Header.tsx`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';

export default function Header() {
  const [points, setPoints] = useState(0);
  const [isAuth, setIsAuth] = useState(false);

  // 使用 useCallback 避免重複創建函數
  const loadUserPoints = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      const token = getAuthToken();
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPoints(data.user?.points || 0);
      }
    } catch (error) {
      console.error('載入點數失敗:', error);
    }
  }, []);

  useEffect(() => {
    setIsAuth(isAuthenticated());

    if (!isAuthenticated()) {
      return; // 未登入直接返回
    }

    loadUserPoints();

    // 降低輪詢頻率到 60 秒
    const intervalId = setInterval(loadUserPoints, 60000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        setIsAuth(isAuthenticated());
        if (isAuthenticated()) {
          loadUserPoints();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [loadUserPoints]);

  // ... 其餘組件邏輯
}
```

#### 2.2 使用 SWR 優化資料獲取

安裝 SWR：
```bash
npm install swr
```

創建自訂 Hook：

**新檔案**: `src/hooks/useUser.ts`

```typescript
import useSWR from 'swr';
import { getAuthToken } from '@/lib/auth';

const fetcher = async (url: string) => {
  const token = getAuthToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error('Failed to fetch');

  return res.json();
};

export function useUser() {
  const { data, error, mutate } = useSWR('/api/user/profile', fetcher, {
    refreshInterval: 60000, // 60 秒刷新一次
    revalidateOnFocus: false,
  });

  return {
    user: data?.user,
    points: data?.user?.points || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

在組件中使用：
```typescript
import { useUser } from '@/hooks/useUser';

export default function Header() {
  const { points, isLoading } = useUser();

  // 不再需要 useEffect 和手動管理狀態
}
```

### 3. 添加速率限制

安裝依賴：
```bash
npm install express-rate-limit
```

創建速率限制中間件：

**新檔案**: `src/lib/rate-limit.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: {
  windowMs: number;
  max: number;
}) {
  return async function (request: NextRequest) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    if (!store[ip] || store[ip].resetTime < now) {
      store[ip] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return null; // 允許通過
    }

    if (store[ip].count >= options.max) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    store[ip].count++;
    return null; // 允許通過
  };
}

// 清理過期記錄
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // 每分鐘清理一次
```

使用範例：
```typescript
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 10, // 最多 10 次請求
});

export async function POST(request: Request) {
  const limitResult = await limiter(request as NextRequest);
  if (limitResult) return limitResult;

  // ... 其餘邏輯
}
```

---

## 🌱 環境變數配置

創建完整的環境變數範例檔案：

**檔案**: `.env.example`

```env
# 資料庫連接（Supabase）
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"

# JWT 密鑰（必須設置，建議使用強隨機字串）
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Next.js 配置
NEXT_PUBLIC_API_URL="http://localhost:3000"

# 檔案上傳
MAX_FILE_SIZE_MB=5
UPLOAD_DIR="./public/uploads"

# Email 配置（可選，未實作時留空）
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# SMS 配置（可選，未實作時留空）
SMS_API_KEY=""
SMS_API_SECRET=""

# 支付配置（NewebPay）
NEWEBPAY_MERCHANT_ID=""
NEWEBPAY_HASH_KEY=""
NEWEBPAY_HASH_IV=""

# 日誌級別
LOG_LEVEL="info"  # debug | info | warn | error

# CORS 配置
ALLOWED_ORIGIN="http://localhost:3000"
```

添加環境變數驗證：

**新檔案**: `src/lib/env.ts`

```typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
];

export function validateEnv() {
  const missing: string[] = [];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // 驗證 JWT_SECRET 長度
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is too short. Recommended minimum length is 32 characters.');
  }
}

// 在應用啟動時調用
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}
```

在 `src/lib/auth.ts` 頂部導入：
```typescript
import { validateEnv } from './env';

validateEnv();
```

---

## 🚀 部署前檢查清單

### Critical（必須完成）
- [ ] 設置強隨機 JWT_SECRET（至少 32 字符）
- [ ] 所有後台 API 已添加 `verifyAdmin` 驗證
- [ ] 移除開發模式驗證碼洩漏
- [ ] 檔案上傳已添加大小和類型驗證
- [ ] 所有 ID 參數已添加格式驗證
- [ ] 資料庫連接字串不包含密碼明文

### High（強烈建議）
- [ ] 添加分頁參數邊界檢查
- [ ] 添加 API 速率限制
- [ ] 統一 API 響應格式
- [ ] 添加資料庫索引並執行 migration
- [ ] 設置 CORS 允許來源
- [ ] 啟用 HTTPS

### Medium（建議完成）
- [ ] 實作 Email 發送功能（目前只有 TODO）
- [ ] 實作 SMS 發送功能（目前只有 TODO）
- [ ] 添加健康檢查端點 `/api/health`
- [ ] 配置日誌系統（Winston/Pino）
- [ ] 添加錯誤追蹤（Sentry）
- [ ] 編寫 API 文檔（OpenAPI/Swagger）

### Low（可選）
- [ ] 添加單元測試
- [ ] 添加端到端測試（Playwright/Cypress）
- [ ] 實作 API 版本控制
- [ ] 優化圖片（使用 CDN）
- [ ] 添加性能監控

---

## 📝 快速修復腳本

創建一個腳本來快速應用所有修復：

**新檔案**: `scripts/apply-security-fixes.sh`

```bash
#!/bin/bash

echo "🔧 應用安全性修復..."

# 1. 檢查環境變數
echo "📋 檢查環境變數..."
if [ ! -f .env ]; then
  echo "❌ .env 文件不存在，請從 .env.example 複製並填寫"
  exit 1
fi

if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=\"\"" .env; then
  echo "❌ JWT_SECRET 未設置"
  exit 1
fi

# 2. 生成強隨機密鑰（如果需要）
echo "🔑 生成新的 JWT Secret（可選）..."
echo "建議的 JWT_SECRET: $(openssl rand -base64 32)"

# 3. 執行資料庫 migration
echo "🗄️  執行資料庫 migration..."
npx prisma generate
npx prisma migrate dev --name add_security_improvements

# 4. 檢查依賴
echo "📦 檢查依賴..."
npm install

# 5. 執行類型檢查
echo "🔍 執行類型檢查..."
npx tsc --noEmit

# 6. 執行 linter
echo "✨ 執行代碼檢查..."
npm run lint

echo "✅ 安全性修復應用完成！"
echo "⚠️  請手動完成以下項目："
echo "  1. 為所有後台 API 添加 verifyAdmin 驗證"
echo "  2. 移除驗證碼洩漏（send-email-code.ts, send-phone-code.ts）"
echo "  3. 更新檔案上傳驗證（upload/route.ts）"
echo "  4. 檢查並更新所有 TODO 註釋"
```

執行權限：
```bash
chmod +x scripts/apply-security-fixes.sh
./scripts/apply-security-fixes.sh
```

---

## 🎯 總結

### 已完成（本次修復）
✅ JWT Secret 安全性修復
✅ 新增管理員驗證函數
✅ 新增輸入驗證工具庫
✅ 示範產品 API 的完整安全修復

### 待辦事項（按優先級）

**Critical（立即執行）**
1. 為所有 8 個後台 API 路由添加 `verifyAdmin` 驗證
2. 移除驗證碼洩漏（2 個文件）
3. 移除登入 API 的 JWT_SECRET 重複定義

**High（本週完成）**
4. 添加輸入驗證到所有公開 API
5. 優化檔案上傳安全性
6. 統一 API 響應格式
7. 添加資料庫索引

**Medium（兩週內完成）**
8. 改進前端組件性能（使用 SWR）
9. 添加 API 速率限制
10. 實作 Email/SMS 發送功能

### 預估工時
- Critical 修復：**4-6 小時**
- High 優化：**8-10 小時**
- Medium 改進：**12-16 小時**

### 下一步行動
1. 設置生產環境的 `JWT_SECRET`
2. 按照本指南逐一修復後台 API
3. 執行資料庫 migration 添加索引
4. 部署前完成所有 Critical 和 High 優先級項目

---

**文件版本**: 1.0
**更新日期**: 2025-10-21
**作者**: Claude Code

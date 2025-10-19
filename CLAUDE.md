# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 項目概述

這是一個基於 Next.js 15 開發的**一番賞抽賞平台**（良級懸賞），使用 TypeScript 和 Tailwind CSS 構建。項目將原有的靜態 HTML 設計轉換為現代化的 React 組件架構。

## 開發命令

```bash
# 啟動開發服務器（使用 Turbopack）
npm run dev

# 生產構建（使用 Turbopack）
npm run build

# 啟動生產服務器
npm start

# 代碼檢查
npm run lint

# Prisma 相關命令
npx prisma generate          # 生成 Prisma Client
npx prisma db push           # 推送 schema 到資料庫（開發環境）
npx prisma migrate dev       # 創建並執行 migration（開發環境）
npx prisma migrate deploy    # 執行 migration（生產環境）
npx prisma studio            # 啟動資料庫 GUI 管理工具
```

**注意**: 此項目使用 Next.js 15 的 Turbopack 作為構建工具（`--turbopack` 標誌）。

## 資料庫設定

### 技術棧
- **資料庫**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.17.1
- **Schema 位置**: `prisma/schema.prisma`

### 環境變量設定

複製 `.env.example` 為 `.env` 並填入你的 Supabase 資料庫連接字串：

```bash
# 應用程式連線（透過 PgBouncer）
DATABASE_URL="postgresql://..."

# 直接連線（用於 migrations）
DIRECT_URL="postgresql://..."
```

### 首次設定流程

1. 設定環境變量（`.env` 文件）
2. 生成 Prisma Client: `npx prisma generate`
3. 推送 schema 到資料庫: `npx prisma db push`
4. （可選）使用 Prisma Studio 管理資料: `npx prisma studio`

## 核心架構

### 應用結構

項目採用 Next.js App Router 架構：

- **`src/app/`**: Next.js App Router 入口
  - `layout.tsx`: 根佈局，定義全局結構
  - `page.tsx`: 首頁，組合所有組件
  - `globals.css`: 全局樣式、CSS 變量、動畫定義
  - `api/`: API Routes
    - `products/route.ts`: 商品列表 API（支援篩選、排序、分頁）
    - `products/[slug]/route.ts`: 單一商品詳情 API
    - `brands/route.ts`: 品牌列表 API
  - `products/[slug]/page.tsx`: 商品詳情頁面（Server Component）
  - `brands/[slug]/page.tsx`: 品牌頁面（Server Component）
  - `series/[slug]/page.tsx`: 系列頁面（Server Component）

- **`src/components/`**: React 組件（標記為 `'use client'` 的客戶端組件）
  - `Header.tsx`: 頂部導航（包含響應式選單）
  - `Banner.tsx`: 輪播圖組件（自動輪播 + 手動控制）
  - `FilterSection.tsx`: 篩選區域（可展開面板，從 API 載入品牌資料）
  - `ProductGrid.tsx`: 商品網格展示（從 API 載入商品資料）
  - `Footer.tsx`: 頁腳組件

- **`src/lib/`**: 工具函數與配置
  - `db.ts`: Prisma Client 單例實例

- **`src/types/`**: TypeScript 類型定義
  - `index.ts`: 共用類型（ProductWithDetails, ProductCard, FilterParams 等）

- **`prisma/`**: Prisma ORM 配置
  - `schema.prisma`: 資料庫 schema 定義

### 頁面組合模式

`page.tsx` 作為主要組裝點，按順序組合各個獨立組件：
```tsx
<Header /> → <Banner /> → <FilterSection /> → <ProductGrid /> → <Footer />
```

每個組件都是自包含的，具有自己的狀態管理（使用 React hooks）。

## 設計系統

### 主題色彩（定義於 `globals.css`）

```css
--accent-orange: #fb923c    /* 主色調 */
--accent-pink: #f472b6      /* 輔助色 */
--accent-yellow: #fbbf24    /* 強調色 */
--accent-purple: #a855f7    /* 特殊效果 */
```

**漸變背景**: 使用 Tailwind 類 `bg-gradient-to-r from-orange-400 to-pink-400` 或 CSS 變量

### 響應式斷點

- 手機: `< 768px` (默認)
- 平板: `md:` (768px+)
- 桌面: `lg:` (1024px+)
- 超寬: `xl:` (1280px+)

**容器居中**: 使用 `max-w-screen-xl mx-auto px-4` 模式

### 自定義 CSS 類

全局樣式中定義的重要類：

- `.btn-gradient`: 漸變按鈕（橙色到粉色）
- `.card-hover`: 卡片懸停效果（向上移動 + 陰影）
- `.product-card`: 商品卡片背景漸變
- `.nav-link`: 導航鏈接下劃線動畫
- `.progress-bar`: 進度條填充動畫
- `.fade-in-up`: 淡入上升動畫

## 組件特性

### Header 組件
- 使用 `useState` 管理手機選單開關狀態
- Logo 圖片失敗時自動降級為文字 Logo（`onError` 處理）
- 桌面版使用 `hidden md:flex`，手機版使用條件渲染

### Banner 組件
- 應包含輪播邏輯（自動播放 + 手動控制）
- 使用 `useEffect` 實現自動輪播定時器
- 指示點導航顯示當前幻燈片

### FilterSection 組件
- 可展開/收起的篩選面板
- 使用 `useState` 管理展開狀態
- 從 `/api/brands` API 載入品牌和系列資料
- 品牌選擇會動態更新可用系列選項
- 包含多維度篩選選項和排序功能

### ProductGrid 組件
- 響應式網格佈局：`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- 使用 `useEffect` 從 `/api/products` API 載入商品資料
- 每個商品卡片包含進度條、狀態標籤、品牌資訊
- 點擊卡片導航到 `/products/[slug]` 商品詳情頁
- 載入狀態使用 skeleton loading 動畫
- 使用 `.product-card` 和 `.card-hover` 類實現懸停效果

## 圖片資源

- **路徑**: `/public/assets/images/`
- **Logo**: `/assets/images/logos/logo.png`
- **佔位圖**: 當前使用 `picsum.photos` 作為佔位圖片
- **優化**: 所有圖片使用 Next.js `Image` 組件進行自動優化

參考 `public/assets/images/README.md` 了解完整的圖片資源需求。

## 樣式規範

1. **CSS 優先級**: Tailwind 類 > 自定義全局類 > 內聯樣式
2. **動畫**: 優先使用 `globals.css` 中定義的 `@keyframes` 動畫
3. **漸變**: 統一使用 45° 或 90° 漸變角度，保持品牌一致性
4. **間距**: 使用 Tailwind 間距系統（4px 增量）
5. **陰影**: 懸停效果使用 `shadow-xl` 或自定義 `box-shadow`

## 狀態管理

目前使用 React 內置 hooks（`useState`, `useEffect`），無需外部狀態管理庫。

未來擴展（如用戶登入、購物車）可能需要：
- React Context API
- 或輕量級狀態管理方案

## 技術約束

- **Next.js 版本**: 15.5.6（App Router 模式）
- **React 版本**: 19.1.0
- **構建工具**: Turbopack（必須使用 `--turbopack` 標誌）
- **TypeScript**: 嚴格模式
- **Tailwind CSS**: v4（使用 PostCSS 插件）

## 特殊功能

### Hash 驗證系統
頁面中提到使用區塊鏈 Hash 值進行抽選驗證，確保公平性。未來可能需要實現相關邏輯。

### 任務回饋系統
計劃中的功能，需要實現任務完成 → 獎賞幣 → 優惠券的流程。

## 資料庫結構

### 核心 Models

**Brand（品牌）**
- 一番賞的 IP 品牌（如：原神、海賊王等）
- 包含多個 Series

**Series（系列）**
- 品牌下的系列（如：原神 Ver.3、海賊王劇場版系列）
- 包含多個 Product
- 關聯到單一 Brand

**Product（商品）**
- 具體的一番賞商品
- 狀態：`draft`（草稿）、`active`（進行中）、`sold_out`（完售）、`archived`（已結束）
- 包含銷售進度（soldTickets / totalTickets）
- 包含多個 ProductVariant（獎項）和 Image

**ProductVariant（獎項/版本）**
- 商品的具體獎項（A賞、B賞、C賞等）
- 包含稀有度（rarity）和庫存（stock）

**Image（圖片）**
- 類型：`cover`（封面）、`gallery`（畫廊）、`variant`（獎項圖片）

### 資料查詢模式

**載入商品列表**（用於首頁、篩選頁）：
```typescript
const products = await prisma.product.findMany({
  include: {
    series: {
      include: { brand: true }
    }
  }
});
```

**載入完整商品詳情**（用於商品頁）：
```typescript
const product = await prisma.product.findFirst({
  where: { slug: params.slug },
  include: {
    series: { include: { brand: true } },
    variants: true,
    images: true,
  }
});
```

## API Routes

### GET `/api/products`
查詢參數：
- `brand`: 品牌 slug
- `series`: 系列 slug
- `status`: 商品狀態（draft/active/sold_out/archived）
- `sortBy`: 排序方式（newest/price_low/price_high/popular）
- `limit`: 每頁數量（默認 50）
- `offset`: 偏移量（用於分頁）

返回：`{ products, total, limit, offset }`

### GET `/api/products/[slug]`
返回：`{ product }` - 包含完整關聯資料

### GET `/api/brands`
返回：`{ brands }` - 包含系列和商品計數

## 代碼風格

- 組件文件使用 PascalCase（如 `Header.tsx`）
- 客戶端組件必須包含 `'use client'` 指令（頁面默認為 Server Components）
- 優先使用函數組件和 hooks
- 導出使用 `export default`
- 中文註釋用於解釋業務邏輯
- 保持組件單一職責，避免過度嵌套
- Server Components 直接使用 Prisma 查詢，Client Components 通過 API Routes 獲取資料

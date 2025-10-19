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
```

**注意**: 此項目使用 Next.js 15 的 Turbopack 作為構建工具（`--turbopack` 標誌）。

## 核心架構

### 應用結構

項目採用 Next.js App Router 架構：

- **`src/app/`**: Next.js App Router 入口
  - `layout.tsx`: 根佈局，定義全局結構
  - `page.tsx`: 首頁，組合所有組件
  - `globals.css`: 全局樣式、CSS 變量、動畫定義

- **`src/components/`**: React 組件（所有組件均為客戶端組件 `'use client'`）
  - `Header.tsx`: 頂部導航（包含響應式選單）
  - `Banner.tsx`: 輪播圖組件（自動輪播 + 手動控制）
  - `FilterSection.tsx`: 篩選區域（可展開面板）
  - `ProductGrid.tsx`: 商品網格展示
  - `Footer.tsx`: 頁腳組件

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
- 包含多維度篩選選項和排序功能

### ProductGrid 組件
- 響應式網格佈局：`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- 每個商品卡片包含進度條、標籤系統
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

## 代碼風格

- 組件文件使用 PascalCase（如 `Header.tsx`）
- 客戶端組件必須包含 `'use client'` 指令
- 優先使用函數組件和 hooks
- 導出使用 `export default`
- 中文註釋用於解釋業務邏輯
- 保持組件單一職責，避免過度嵌套

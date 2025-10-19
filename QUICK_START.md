# 🚀 快速開始指南

## 5 分鐘啟動網站

### 第 1 步：設定資料庫連接

```bash
# 複製環境變量範例
cp .env.example .env

# 編輯 .env 文件，填入你的 Supabase 連接字串
# DATABASE_URL="postgresql://..."
# DIRECT_URL="postgresql://..."
```

### 第 2 步：安裝依賴並生成 Prisma Client

```bash
npm install
npx prisma generate
```

### 第 3 步：推送資料庫 Schema

```bash
npx prisma db push
```

### 第 4 步：添加測試資料

**選項 A：使用 Prisma Studio（推薦）**

```bash
npx prisma studio
```

在瀏覽器中打開 http://localhost:5555，然後：

1. 點擊 `Brand` → 創建一個品牌（例如：原神）
2. 點擊 `Series` → 創建一個系列，選擇剛才的品牌
3. 點擊 `Product` → 創建商品，選擇剛才的系列
   - 設定 `status` 為 `active`
   - 填入 `name`, `slug`, `price`, `totalTickets` 等

**選項 B：使用 SQL（快速批量導入）**

在 Supabase SQL Editor 或 Prisma Studio 中執行：

```sql
-- 創建品牌
INSERT INTO "Brand" (name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES
  ('原神 Genshin Impact', 'genshin-impact', '來自米哈遊的開放世界冒險遊戲', true, NOW(), NOW()),
  ('海賊王 One Piece', 'one-piece', '尾田榮一郎的經典海賊冒險漫畫', true, NOW(), NOW());

-- 創建系列
INSERT INTO "Series" ("brandId", name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES
  (1, '原神 Ver.3.0 須彌篇', 'genshin-ver-3', '須彌篇章主題一番賞', true, NOW(), NOW()),
  (2, '海賊王劇場版系列', 'one-piece-movie', '劇場版周邊商品', true, NOW(), NOW());

-- 創建商品
INSERT INTO "Product" ("seriesId", name, slug, "shortDescription", price, "totalTickets", "soldTickets", status, "createdAt", "updatedAt")
VALUES
  (1, '原神須彌主題一番賞', 'genshin-sumeru', '包含提納里、柯萊等角色', 120, 500, 150, 'active', NOW(), NOW()),
  (2, '海賊王魯夫限定款', 'luffy-special', '魯夫五檔主題周邊', 99, 300, 280, 'active', NOW(), NOW());

-- 創建獎項
INSERT INTO "ProductVariant" ("productId", name, rarity, stock, "isActive", "createdAt")
VALUES
  (1, 'A賞 提納里手辦', 'SSR', 10, true, NOW()),
  (1, 'B賞 柯萊手辦', 'SR', 20, true, NOW()),
  (1, 'C賞 須彌場景模型', 'R', 50, true, NOW());
```

### 第 5 步：啟動開發服務器

```bash
npm run dev
```

打開瀏覽器訪問 http://localhost:3000 🎉

---

## 📖 測試功能

### 首頁
- ✅ 查看商品網格
- ✅ 測試篩選功能
- ✅ 測試排序功能

### 商品詳情頁
訪問：`http://localhost:3000/products/genshin-sumeru`
- ✅ 查看完整商品資訊
- ✅ 查看獎項列表
- ✅ 查看進度條

### 品牌頁面
訪問：`http://localhost:3000/brands/genshin-impact`
- ✅ 查看品牌下的所有系列
- ✅ 查看商品預覽

### 系列頁面
訪問：`http://localhost:3000/series/genshin-ver-3`
- ✅ 查看系列下的所有商品

---

## 🔧 常見問題

### 問題：無法連接資料庫
**解決方案：**
1. 檢查 `.env` 文件中的 `DATABASE_URL` 和 `DIRECT_URL` 是否正確
2. 確認 Supabase 專案沒有暫停
3. 檢查網路連接

### 問題：Prisma Client 錯誤
**解決方案：**
```bash
# 重新生成 Prisma Client
npx prisma generate

# 如果還是有問題，刪除並重新安裝
rm -rf node_modules
npm install
npx prisma generate
```

### 問題：頁面顯示空白
**解決方案：**
1. 確認資料庫中有資料（使用 Prisma Studio 檢查）
2. 檢查瀏覽器控制台是否有錯誤
3. 檢查終端是否有 API 錯誤

### 問題：圖片無法顯示
**解決方案：**
- 目前使用 `picsum.photos` 佔位圖
- 如果要使用真實圖片，在資料庫中設定 `coverImage` 欄位

---

## 🎯 下一步

1. **添加更多測試資料** - 使用 Prisma Studio 添加更多品牌、系列、商品
2. **自定義樣式** - 修改 `src/app/globals.css` 調整主題色彩
3. **上傳真實圖片** - 替換佔位圖片
4. **實現搜索功能** - 添加商品搜索
5. **實現用戶登入** - 整合 NextAuth.js

---

## 📚 更多資訊

- 詳細文檔：查看 `DATABASE_SETUP.md`
- 開發指南：查看 `CLAUDE.md`
- Prisma Schema：查看 `prisma/schema.prisma`
- 專案概述：查看 `PROJECT_SUMMARY.md`

**祝開發順利！** 🚀

-- 移除 Series 層級：Brand → Series → Product → Variant  改為  Brand → Product → Variant

-- Step 1: 在 Product 表新增 brandId 欄位（暫時允許 NULL）
ALTER TABLE "Product" ADD COLUMN "brandId" INTEGER;

-- Step 2: 從 Series 表回填 brandId
UPDATE "Product" p
SET "brandId" = s."brandId"
FROM "Series" s
WHERE p."seriesId" = s."id";

-- Step 3: 設為 NOT NULL（所有資料都已回填）
ALTER TABLE "Product" ALTER COLUMN "brandId" SET NOT NULL;

-- Step 4: 移除舊的 constraint 和 index
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_seriesId_fkey";
DROP INDEX IF EXISTS "Product_seriesId_slug_key";
DROP INDEX IF EXISTS "Product_seriesId_idx";

-- Step 5: 移除 seriesId 欄位
ALTER TABLE "Product" DROP COLUMN "seriesId";

-- Step 6: 加上新的 foreign key、unique constraint 和 index
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Product_brandId_slug_key" ON "Product"("brandId", "slug");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- Step 7: 刪除 Series 表
DROP TABLE IF EXISTS "Series" CASCADE;

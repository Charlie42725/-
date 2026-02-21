-- ======================================
-- 一番賞網站 Database Rebuild SQL
-- Database: PostgreSQL (Neon)
-- 根據 prisma/schema.prisma 生成
-- ======================================

-- ⚠️ 注意：此腳本會刪除所有現有表格和資料！
-- 請在 SQL Editor 中執行

-- -----------------------------
-- 🔸 先刪除所有表格（按照依賴順序）
-- -----------------------------
DROP TABLE IF EXISTS "PrizeRedemption" CASCADE;
DROP TABLE IF EXISTS "LotteryDraw" CASCADE;
DROP TABLE IF EXISTS "PointTransaction" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "ProductLog" CASCADE;
DROP TABLE IF EXISTS "VerificationCode" CASCADE;
DROP TABLE IF EXISTS "AdminUser" CASCADE;
DROP TABLE IF EXISTS "Image" CASCADE;
DROP TABLE IF EXISTS "ProductVariant" CASCADE;
DROP TABLE IF EXISTS "DrawQueue" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Series" CASCADE;
DROP TABLE IF EXISTS "Brand" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- -----------------------------
-- 🔸 刪除並重建 ENUM 類型
-- -----------------------------
DROP TYPE IF EXISTS "ProductStatus" CASCADE;
DROP TYPE IF EXISTS "ImageType" CASCADE;
DROP TYPE IF EXISTS "AdminRole" CASCADE;
DROP TYPE IF EXISTS "Gender" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "CodeType" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "PointTransactionType" CASCADE;
DROP TYPE IF EXISTS "QueueStatus" CASCADE;

CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'sold_out', 'archived');
CREATE TYPE "ImageType" AS ENUM ('cover', 'gallery', 'variant');
CREATE TYPE "AdminRole" AS ENUM ('admin', 'editor');
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "CodeType" AS ENUM ('email', 'phone');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'completed', 'cancelled', 'failed');
CREATE TYPE "PointTransactionType" AS ENUM ('purchase', 'bonus', 'lottery', 'refund', 'redemption', 'admin_adjust');
CREATE TYPE "QueueStatus" AS ENUM ('waiting', 'active', 'completed', 'expired', 'left');

-- -----------------------------
-- 🔹 Brand（品牌）
-- -----------------------------
CREATE TABLE "Brand" (
    "id"          SERIAL       PRIMARY KEY,
    "name"        TEXT         NOT NULL,
    "slug"        TEXT         NOT NULL,
    "description" TEXT,
    "logoUrl"     TEXT,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- -----------------------------
-- 🔹 Product（商品）
-- -----------------------------
CREATE TABLE "Product" (
    "id"               SERIAL            PRIMARY KEY,
    "brandId"          INTEGER           NOT NULL,
    "name"             TEXT              NOT NULL,
    "slug"             TEXT              NOT NULL,
    "shortDescription" TEXT,
    "longDescription"  TEXT,
    "price"            INTEGER           NOT NULL,
    "totalTickets"     INTEGER           NOT NULL DEFAULT 0,
    "soldTickets"      INTEGER           NOT NULL DEFAULT 0,
    "status"           "ProductStatus"   NOT NULL DEFAULT 'draft',
    "coverImage"       TEXT,
    "createdAt"        TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId")
        REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Product_brandId_slug_key" ON "Product"("brandId", "slug");
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- -----------------------------
-- 🔹 ProductVariant（獎項）
-- -----------------------------
CREATE TABLE "ProductVariant" (
    "id"          SERIAL       PRIMARY KEY,
    "productId"   INTEGER      NOT NULL,
    "prize"       TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "rarity"      TEXT,
    "value"       INTEGER      NOT NULL DEFAULT 3000,
    "stock"       INTEGER      NOT NULL DEFAULT 0,
    "imageUrl"    TEXT,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "isLastPrize" BOOLEAN      NOT NULL DEFAULT false,
    "probability" DOUBLE PRECISION,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId")
        REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- -----------------------------
-- 🔹 Image（圖片庫）
-- -----------------------------
CREATE TABLE "Image" (
    "id"        SERIAL       PRIMARY KEY,
    "productId" INTEGER,
    "url"       TEXT         NOT NULL,
    "type"      "ImageType"  NOT NULL DEFAULT 'gallery',
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId")
        REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------
-- 🔹 User（會員用戶）
-- -----------------------------
CREATE TABLE "User" (
    "id"              SERIAL       PRIMARY KEY,
    "email"           TEXT         NOT NULL,
    "passwordHash"    TEXT         NOT NULL,
    "nickname"        TEXT         NOT NULL,
    "gender"          "Gender",
    "phone"           TEXT,
    "points"          INTEGER      NOT NULL DEFAULT 0,
    "role"            "UserRole"   NOT NULL DEFAULT 'user',
    "isEmailVerified" BOOLEAN      NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- -----------------------------
-- 🔹 VerificationCode（驗證碼）
-- -----------------------------
CREATE TABLE "VerificationCode" (
    "id"        SERIAL       PRIMARY KEY,
    "type"      "CodeType"   NOT NULL,
    "target"    TEXT         NOT NULL,
    "code"      TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed"    BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "VerificationCode_target_type_isUsed_idx" ON "VerificationCode"("target", "type", "isUsed");

-- -----------------------------
-- 🔹 AdminUser（後台管理員）
-- -----------------------------
CREATE TABLE "AdminUser" (
    "id"           SERIAL       PRIMARY KEY,
    "username"     TEXT         NOT NULL,
    "passwordHash" TEXT         NOT NULL,
    "role"         "AdminRole"  NOT NULL DEFAULT 'editor',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- -----------------------------
-- 🔹 ProductLog（商品操作紀錄）
-- -----------------------------
CREATE TABLE "ProductLog" (
    "id"        SERIAL       PRIMARY KEY,
    "productId" INTEGER,
    "adminId"   INTEGER,
    "action"    TEXT         NOT NULL,
    "message"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductLog_productId_fkey" FOREIGN KEY ("productId")
        REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductLog_adminId_fkey" FOREIGN KEY ("adminId")
        REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- -----------------------------
-- 🔹 Order（訂單）
-- -----------------------------
CREATE TABLE "Order" (
    "id"            SERIAL        PRIMARY KEY,
    "userId"        INTEGER       NOT NULL,
    "orderNumber"   TEXT          NOT NULL,
    "packageName"   TEXT          NOT NULL,
    "basePoints"    INTEGER       NOT NULL,
    "bonusPoints"   INTEGER       NOT NULL,
    "totalPoints"   INTEGER       NOT NULL,
    "amount"        INTEGER       NOT NULL,
    "status"        "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "paymentInfo"   TEXT,
    "paidAt"        TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- -----------------------------
-- 🔹 PointTransaction（點數異動紀錄）
-- -----------------------------
CREATE TABLE "PointTransaction" (
    "id"          SERIAL                 PRIMARY KEY,
    "userId"      INTEGER                NOT NULL,
    "type"        "PointTransactionType" NOT NULL,
    "amount"      INTEGER                NOT NULL,
    "balance"     INTEGER                NOT NULL,
    "description" TEXT                   NOT NULL,
    "relatedId"   TEXT,
    "createdAt"   TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PointTransaction_userId_idx" ON "PointTransaction"("userId");
CREATE INDEX "PointTransaction_type_idx" ON "PointTransaction"("type");
CREATE INDEX "PointTransaction_createdAt_idx" ON "PointTransaction"("createdAt");

-- -----------------------------
-- 🔹 LotteryDraw（抽獎記錄）
-- -----------------------------
CREATE TABLE "LotteryDraw" (
    "id"            SERIAL       PRIMARY KEY,
    "userId"        INTEGER      NOT NULL,
    "productId"     INTEGER      NOT NULL,
    "variantId"     INTEGER      NOT NULL,
    "ticketNumber"  INTEGER      NOT NULL,
    "pointsUsed"    INTEGER      NOT NULL,
    "triggeredPity" BOOLEAN      NOT NULL DEFAULT false,
    "isLastPrize"   BOOLEAN      NOT NULL DEFAULT false,
    "isRedeemed"    BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryDraw_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotteryDraw_productId_fkey" FOREIGN KEY ("productId")
        REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotteryDraw_variantId_fkey" FOREIGN KEY ("variantId")
        REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LotteryDraw_productId_ticketNumber_key" ON "LotteryDraw"("productId", "ticketNumber");
CREATE INDEX "LotteryDraw_userId_idx" ON "LotteryDraw"("userId");
CREATE INDEX "LotteryDraw_productId_idx" ON "LotteryDraw"("productId");
CREATE INDEX "LotteryDraw_variantId_idx" ON "LotteryDraw"("variantId");
CREATE INDEX "LotteryDraw_createdAt_idx" ON "LotteryDraw"("createdAt");
CREATE INDEX "LotteryDraw_isRedeemed_idx" ON "LotteryDraw"("isRedeemed");
CREATE INDEX "LotteryDraw_userId_isRedeemed_idx" ON "LotteryDraw"("userId", "isRedeemed");

-- -----------------------------
-- 🔹 PrizeRedemption（獎品兌換記錄）
-- -----------------------------
CREATE TABLE "PrizeRedemption" (
    "id"             SERIAL       PRIMARY KEY,
    "userId"         INTEGER      NOT NULL,
    "lotteryDrawId"  INTEGER      NOT NULL,
    "prizeValue"     INTEGER      NOT NULL,
    "pointsReceived" INTEGER      NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrizeRedemption_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrizeRedemption_lotteryDrawId_fkey" FOREIGN KEY ("lotteryDrawId")
        REFERENCES "LotteryDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PrizeRedemption_lotteryDrawId_key" ON "PrizeRedemption"("lotteryDrawId");
CREATE INDEX "PrizeRedemption_userId_idx" ON "PrizeRedemption"("userId");
CREATE INDEX "PrizeRedemption_createdAt_idx" ON "PrizeRedemption"("createdAt");

-- -----------------------------
-- 🔹 DrawQueue（抽賞排隊）
-- -----------------------------
CREATE TABLE "DrawQueue" (
    "id"            SERIAL        PRIMARY KEY,
    "userId"        INTEGER       NOT NULL,
    "productId"     INTEGER       NOT NULL,
    "status"        "QueueStatus" NOT NULL DEFAULT 'waiting',
    "position"      INTEGER       NOT NULL,
    "joinedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt"   TIMESTAMP(3),
    "expiresAt"     TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3),
    "lastHeartbeat" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawQueue_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DrawQueue_productId_fkey" FOREIGN KEY ("productId")
        REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DrawQueue_productId_status_idx" ON "DrawQueue"("productId", "status");
CREATE INDEX "DrawQueue_productId_position_idx" ON "DrawQueue"("productId", "position");
CREATE INDEX "DrawQueue_userId_idx" ON "DrawQueue"("userId");
CREATE INDEX "DrawQueue_expiresAt_idx" ON "DrawQueue"("expiresAt");

-- ======================================
-- ✅ 資料庫重建完成！
--
-- 接下來請執行：
--   npx prisma generate
-- 來重新生成 Prisma Client
-- ======================================

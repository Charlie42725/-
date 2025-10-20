// 資料庫連線測試腳本
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 開始測試資料庫連線...\n');

  // 顯示環境變數（隱藏密碼）
  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  console.log('📋 環境變數檢查:');
  console.log('DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('DIRECT_URL:', directUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('⏳ 嘗試連線到資料庫...');

    // 測試簡單查詢
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 資料庫連線成功！');

    // 測試 Brand 表
    const brandCount = await prisma.brand.count();
    console.log(`✅ Brand 表查詢成功，共有 ${brandCount} 筆資料`);

    // 測試其他表
    const seriesCount = await prisma.series.count();
    const productCount = await prisma.product.count();

    console.log(`✅ Series 表查詢成功，共有 ${seriesCount} 筆資料`);
    console.log(`✅ Product 表查詢成功，共有 ${productCount} 筆資料`);

    console.log('\n🎉 所有測試通過！');

  } catch (error) {
    console.error('\n❌ 連線失敗！');
    console.error('錯誤類型:', error.constructor.name);
    console.error('錯誤訊息:', error.message);

    if (error.code) {
      console.error('錯誤代碼:', error.code);
    }

    console.error('\n💡 可能的原因:');
    console.error('1. 資料庫已暫停（Neon 免費版會自動暫停）');
    console.error('2. 連線字串錯誤（密碼、主機名稱等）');
    console.error('3. 防火牆封鎖連線');
    console.error('4. SSL 設定問題（需要 sslmode=require）');
    console.error('5. Neon 專案已刪除或連線字串過期');

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

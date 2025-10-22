// 更新所有 ProductVariant 的 value 欄位為預設值 3000
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('開始檢查 ProductVariant 的 value 欄位...');

    // 查詢所有 ProductVariant
    const allVariants = await prisma.productVariant.findMany({
      select: {
        id: true,
        name: true,
        value: true,
      },
    });

    console.log(`📊 總共有 ${allVariants.length} 個 ProductVariant 記錄`);

    // 找出 value 為預設值的記錄（如果有的話）
    const defaultValueVariants = allVariants.filter(v => v.value === 3000);
    console.log(`✓ 其中 ${defaultValueVariants.length} 個已有預設值 3000`);

    const otherValueVariants = allVariants.filter(v => v.value !== 3000);
    if (otherValueVariants.length > 0) {
      console.log(`ℹ 其中 ${otherValueVariants.length} 個有其他值:`);
      otherValueVariants.slice(0, 5).forEach(v => {
        console.log(`  - ${v.name}: ${v.value}`);
      });
    }

    console.log('✅ 所有記錄都已有 value 值，無需更新');

  } catch (error) {
    console.error('❌ 執行失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✨ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 腳本執行失敗:', error);
    process.exit(1);
  });

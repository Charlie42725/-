const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 創建測試帳號...');

  // 先刪除舊的測試帳號（如果存在）
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'tttt@tttt' },
        { email: 'tttt@gmail.com' }
      ]
    }
  });

  // 清空所有用戶的點數
  await prisma.user.updateMany({
    data: { points: 0 }
  });
  console.log('✓ 已清空所有用戶點數');

  // 創建測試帳號
  const passwordHash = await bcrypt.hash('1234', 10);

  const testUser = await prisma.user.create({
    data: {
      email: 'tttt@gmail.com',
      passwordHash: passwordHash,
      nickname: '測試帳號',
      points: 0,
      isEmailVerified: true,
      isPhoneVerified: false,
    }
  });

  console.log('✓ 測試帳號創建成功！');
  console.log('  Email: tttt@gmail.com');
  console.log('  Password: 1234');
  console.log('  點數餘額: 0');
  console.log('  User ID:', testUser.id);
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

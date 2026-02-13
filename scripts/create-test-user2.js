const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('test5678', 10);

    const user = await prisma.user.create({
        data: {
            email: 'testuser2@gmail.com',
            passwordHash: hash,
            nickname: '測試帳號2',
            points: 3000,
            role: 'user',
            isEmailVerified: true,
            isPhoneVerified: false,
        }
    });

    console.log('✅ 測試帳號建立成功！');
    console.log('  Email: testuser2@gmail.com');
    console.log('  Password: test5678');
    console.log('  暱稱: 測試帳號2');
    console.log('  點數: 3000');
    console.log('  User ID:', user.id);
}

main()
    .catch((e) => {
        console.error('❌ 錯誤:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

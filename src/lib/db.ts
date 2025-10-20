import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // 移除 query log 提升效能
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// 優化：預先建立連線，避免第一次請求時的冷啟動延遲
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
  });
}

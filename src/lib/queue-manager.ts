import prisma from '@/lib/db';
import { sseRegistry } from '@/lib/sse-registry';

const ACTIVE_SESSION_DURATION_MS = 3 * 60 * 1000; // 3 分鐘
const HEARTBEAT_TIMEOUT_ACTIVE_MS = 60 * 1000;    // active 60 秒無心跳
const HEARTBEAT_TIMEOUT_WAITING_MS = 120 * 1000;   // waiting 120 秒無心跳
const CHECK_INTERVAL_MS = 15 * 1000;               // 每 15 秒檢查

// 加入排隊
export async function joinQueue(productId: number, userId: number) {
  // 檢查是否已有活躍的排隊記錄
  const existing = await prisma.drawQueue.findFirst({
    where: {
      productId,
      userId,
      status: { in: ['waiting', 'active'] },
    },
  });

  if (existing) {
    return existing;
  }

  // 取得下一個 position
  const lastEntry = await prisma.drawQueue.findFirst({
    where: { productId },
    orderBy: { position: 'desc' },
  });

  const nextPosition = (lastEntry?.position ?? 0) + 1;

  // 檢查是否有其他人正在排隊或抽獎
  const activeCount = await prisma.drawQueue.count({
    where: {
      productId,
      status: { in: ['waiting', 'active'] },
    },
  });

  const now = new Date();
  const isFirstInLine = activeCount === 0;

  const entry = await prisma.drawQueue.create({
    data: {
      userId,
      productId,
      position: nextPosition,
      status: isFirstInLine ? 'active' : 'waiting',
      activatedAt: isFirstInLine ? now : null,
      expiresAt: isFirstInLine
        ? new Date(now.getTime() + ACTIVE_SESSION_DURATION_MS)
        : null,
    },
  });

  // 廣播排隊更新
  broadcastQueueUpdate(productId);

  if (isFirstInLine) {
    // 通知該使用者輪到他了
    sseRegistry.sendToUser(productId, userId, {
      type: 'your_turn',
      expiresAt: entry.expiresAt?.toISOString(),
    });
  }

  return entry;
}

// 查詢排隊狀態
export async function getQueueStatus(productId: number, userId: number) {
  const entry = await prisma.drawQueue.findFirst({
    where: {
      productId,
      userId,
      status: { in: ['waiting', 'active'] },
    },
  });

  if (!entry) {
    // 檢查是否有其他人在排隊
    const queueCount = await prisma.drawQueue.count({
      where: {
        productId,
        status: { in: ['waiting', 'active'] },
      },
    });

    return {
      inQueue: false,
      queueLength: queueCount,
      status: null,
      position: null,
      expiresAt: null,
    };
  }

  // 計算前方等待人數
  const aheadCount = await prisma.drawQueue.count({
    where: {
      productId,
      status: { in: ['waiting', 'active'] },
      position: { lt: entry.position },
    },
  });

  // 排隊總人數
  const totalInQueue = await prisma.drawQueue.count({
    where: {
      productId,
      status: { in: ['waiting', 'active'] },
    },
  });

  return {
    inQueue: true,
    status: entry.status,
    position: aheadCount + 1,
    totalInQueue,
    expiresAt: entry.expiresAt?.toISOString() || null,
    queueLength: totalInQueue,
  };
}

// 離開排隊
export async function leaveQueue(productId: number, userId: number) {
  const entry = await prisma.drawQueue.findFirst({
    where: {
      productId,
      userId,
      status: { in: ['waiting', 'active'] },
    },
  });

  if (!entry) return;

  await prisma.drawQueue.update({
    where: { id: entry.id },
    data: {
      status: 'left',
      completedAt: new Date(),
    },
  });

  // 如果離開的是 active 使用者，啟動下一位
  if (entry.status === 'active') {
    await activateNext(productId);
  }

  broadcastQueueUpdate(productId);
}

// 心跳更新
export async function heartbeat(productId: number, userId: number) {
  const entry = await prisma.drawQueue.findFirst({
    where: {
      productId,
      userId,
      status: { in: ['waiting', 'active'] },
    },
  });

  if (!entry) return null;

  await prisma.drawQueue.update({
    where: { id: entry.id },
    data: { lastHeartbeat: new Date() },
  });

  return entry;
}

// 抽獎完成，結束 session 並啟動下一位
export async function completeSession(productId: number, userId: number) {
  const entry = await prisma.drawQueue.findFirst({
    where: {
      productId,
      userId,
      status: 'active',
    },
  });

  if (!entry) return;

  await prisma.drawQueue.update({
    where: { id: entry.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  await activateNext(productId);
  broadcastQueueUpdate(productId);
}

// 啟動下一位等待者
export async function activateNext(productId: number) {
  // 先檢查商品是否還有庫存
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { status: true, totalTickets: true, soldTickets: true },
  });

  if (!product || product.status === 'sold_out') {
    // 商品完售，通知所有等待者
    const waitingEntries = await prisma.drawQueue.findMany({
      where: { productId, status: 'waiting' },
    });

    for (const entry of waitingEntries) {
      await prisma.drawQueue.update({
        where: { id: entry.id },
        data: { status: 'left', completedAt: new Date() },
      });
    }

    sseRegistry.broadcast(productId, {
      type: 'product_sold_out',
      message: '商品已完售',
    });
    return;
  }

  // 取得下一位等待者
  const nextEntry = await prisma.drawQueue.findFirst({
    where: {
      productId,
      status: 'waiting',
    },
    orderBy: { position: 'asc' },
  });

  if (!nextEntry) return;

  const now = new Date();

  await prisma.drawQueue.update({
    where: { id: nextEntry.id },
    data: {
      status: 'active',
      activatedAt: now,
      expiresAt: new Date(now.getTime() + ACTIVE_SESSION_DURATION_MS),
    },
  });

  // 通知該使用者
  sseRegistry.sendToUser(nextEntry.productId, nextEntry.userId, {
    type: 'your_turn',
    expiresAt: new Date(now.getTime() + ACTIVE_SESSION_DURATION_MS).toISOString(),
  });

  broadcastQueueUpdate(productId);
}

// 檢查使用者是否是 active 狀態
export async function isUserActive(productId: number, userId: number) {
  const entry = await prisma.drawQueue.findFirst({
    where: {
      productId,
      userId,
      status: 'active',
    },
  });

  if (!entry) return false;
  if (entry.expiresAt && entry.expiresAt < new Date()) return false;

  return true;
}

// 定時檢查超時的 session
export async function checkExpiredSessions() {
  const now = new Date();

  // 1. 檢查 active 且 expiresAt 已過期
  const expiredActive = await prisma.drawQueue.findMany({
    where: {
      status: 'active',
      expiresAt: { lt: now },
    },
  });

  const affectedProductIds = new Set<number>();

  for (const entry of expiredActive) {
    await prisma.drawQueue.update({
      where: { id: entry.id },
      data: {
        status: 'expired',
        completedAt: now,
      },
    });

    sseRegistry.sendToUser(entry.productId, entry.userId, {
      type: 'session_expired',
      message: '您的抽獎時間已過期',
    });

    affectedProductIds.add(entry.productId);
  }

  // 2. 檢查 active 且心跳超時
  const heartbeatDeadline = new Date(now.getTime() - HEARTBEAT_TIMEOUT_ACTIVE_MS);
  const staleActive = await prisma.drawQueue.findMany({
    where: {
      status: 'active',
      lastHeartbeat: { lt: heartbeatDeadline },
    },
  });

  for (const entry of staleActive) {
    await prisma.drawQueue.update({
      where: { id: entry.id },
      data: {
        status: 'expired',
        completedAt: now,
      },
    });

    affectedProductIds.add(entry.productId);
  }

  // 3. 檢查 waiting 且心跳超時
  const waitingDeadline = new Date(now.getTime() - HEARTBEAT_TIMEOUT_WAITING_MS);
  const staleWaiting = await prisma.drawQueue.findMany({
    where: {
      status: 'waiting',
      lastHeartbeat: { lt: waitingDeadline },
    },
  });

  for (const entry of staleWaiting) {
    await prisma.drawQueue.update({
      where: { id: entry.id },
      data: {
        status: 'left',
        completedAt: now,
      },
    });

    affectedProductIds.add(entry.productId);
  }

  // 為所有受影響的商品啟動下一位
  for (const productId of affectedProductIds) {
    // 只在沒有 active 的情況下啟動下一位
    const currentActive = await prisma.drawQueue.count({
      where: { productId, status: 'active' },
    });

    if (currentActive === 0) {
      await activateNext(productId);
    }

    broadcastQueueUpdate(productId);
  }
}

// 廣播排隊狀態更新
async function broadcastQueueUpdate(productId: number) {
  const waitingEntries = await prisma.drawQueue.findMany({
    where: {
      productId,
      status: { in: ['waiting', 'active'] },
    },
    orderBy: { position: 'asc' },
    select: {
      userId: true,
      status: true,
      position: true,
    },
  });

  // 通知每位使用者他們的位置
  let queuePosition = 0;
  for (const entry of waitingEntries) {
    queuePosition++;
    sseRegistry.sendToUser(productId, entry.userId, {
      type: 'queue_update',
      position: queuePosition,
      totalInQueue: waitingEntries.length,
      status: entry.status,
    });
  }

  // 廣播整體排隊人數
  sseRegistry.broadcast(productId, {
    type: 'queue_count',
    count: waitingEntries.length,
  });
}

// 啟動定時檢查器（單例）
let checkInterval: ReturnType<typeof setInterval> | null = null;

export function startQueueChecker() {
  if (checkInterval) return;

  checkInterval = setInterval(async () => {
    try {
      await checkExpiredSessions();
    } catch (error) {
      console.error('Queue checker error:', error);
    }
  }, CHECK_INTERVAL_MS);
}

export function stopQueueChecker() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// 自動啟動
startQueueChecker();

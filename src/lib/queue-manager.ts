import prisma from '@/lib/db';
import { sseRegistry } from '@/lib/sse-registry';

const ACTIVE_SESSION_DURATION_MS = 5 * 60 * 1000; // 5 分鐘
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

  // 取得下一個 position + 當前活躍人數（合併為一次查詢）
  const [lastEntry, activeCount] = await Promise.all([
    prisma.drawQueue.findFirst({
      where: { productId },
      orderBy: { position: 'desc' },
      select: { position: true },
    }),
    prisma.drawQueue.count({
      where: {
        productId,
        status: { in: ['waiting', 'active'] },
      },
    }),
  ]);

  const nextPosition = (lastEntry?.position ?? 0) + 1;
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
    sseRegistry.sendToUser(productId, userId, {
      type: 'your_turn',
      expiresAt: entry.expiresAt?.toISOString(),
    });
  }

  return entry;
}

// 查詢排隊狀態 — 合併為單次查詢
export async function getQueueStatus(productId: number, userId: number) {
  // 一次查詢取得：用戶自己的記錄 + 全部活躍記錄
  const allActive = await prisma.drawQueue.findMany({
    where: {
      productId,
      status: { in: ['waiting', 'active'] },
    },
    orderBy: { position: 'asc' },
    select: {
      userId: true,
      status: true,
      position: true,
      expiresAt: true,
    },
  });

  const totalInQueue = allActive.length;

  // 找用戶自己的記錄
  const myIndex = allActive.findIndex(e => e.userId === userId);

  if (myIndex === -1) {
    return {
      inQueue: false,
      queueLength: totalInQueue,
      status: null,
      position: null,
      expiresAt: null,
    };
  }

  const myEntry = allActive[myIndex];

  return {
    inQueue: true,
    status: myEntry.status,
    position: myIndex + 1,
    totalInQueue,
    expiresAt: myEntry.expiresAt?.toISOString() || null,
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
  // 直接用 updateMany 減少 findFirst + update 兩步
  const result = await prisma.drawQueue.updateMany({
    where: {
      productId,
      userId,
      status: { in: ['waiting', 'active'] },
    },
    data: { lastHeartbeat: new Date() },
  });

  return result.count > 0 ? true : null;
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
    select: { status: true },
  });

  if (!product || product.status === 'sold_out') {
    // 商品完售，批次更新所有等待者
    await prisma.drawQueue.updateMany({
      where: { productId, status: 'waiting' },
      data: { status: 'left', completedAt: new Date() },
    });

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
    select: { expiresAt: true },
  });

  if (!entry) return false;
  if (entry.expiresAt && entry.expiresAt < new Date()) return false;

  return true;
}

// 定時檢查超時的 session — 合併為一次查詢
export async function checkExpiredSessions() {
  const now = new Date();
  const heartbeatDeadline = new Date(now.getTime() - HEARTBEAT_TIMEOUT_ACTIVE_MS);
  const waitingDeadline = new Date(now.getTime() - HEARTBEAT_TIMEOUT_WAITING_MS);

  // 單次查詢取得所有需要清理的記錄
  const staleEntries = await prisma.drawQueue.findMany({
    where: {
      OR: [
        // active 且過期
        { status: 'active', expiresAt: { lt: now } },
        // active 且心跳超時
        { status: 'active', lastHeartbeat: { lt: heartbeatDeadline } },
        // waiting 且心跳超時
        { status: 'waiting', lastHeartbeat: { lt: waitingDeadline } },
      ],
    },
    select: { id: true, productId: true, userId: true, status: true },
  });

  if (staleEntries.length === 0) return;

  const affectedProductIds = new Set<number>();
  const expiredIds: number[] = [];
  const leftIds: number[] = [];

  for (const entry of staleEntries) {
    affectedProductIds.add(entry.productId);

    if (entry.status === 'active') {
      expiredIds.push(entry.id);
      // 通知用戶 session 過期
      sseRegistry.sendToUser(entry.productId, entry.userId, {
        type: 'session_expired',
        message: '您的抽獎時間已過期',
      });
    } else {
      leftIds.push(entry.id);
    }
  }

  // 批次更新（2 次 updateMany 取代 N 次 update）
  await Promise.all([
    expiredIds.length > 0 && prisma.drawQueue.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'expired', completedAt: now },
    }),
    leftIds.length > 0 && prisma.drawQueue.updateMany({
      where: { id: { in: leftIds } },
      data: { status: 'left', completedAt: now },
    }),
  ]);

  // 為所有受影響的商品啟動下一位
  for (const productId of affectedProductIds) {
    const currentActive = await prisma.drawQueue.count({
      where: { productId, status: 'active' },
    });

    if (currentActive === 0) {
      await activateNext(productId);
    }

    broadcastQueueUpdate(productId);
  }
}

// 廣播排隊狀態更新 — 只查 count + 只發送給有 SSE 連線的用戶
async function broadcastQueueUpdate(productId: number) {
  // 先檢查有沒有 SSE 連線，沒有就不查 DB
  if (sseRegistry.getConnectionCount(productId) === 0) return;

  const waitingEntries = await prisma.drawQueue.findMany({
    where: {
      productId,
      status: { in: ['waiting', 'active'] },
    },
    orderBy: { position: 'asc' },
    select: {
      userId: true,
      status: true,
    },
  });

  const totalInQueue = waitingEntries.length;

  // 只對有 SSE 連線的用戶發送個人位置
  let queuePosition = 0;
  for (const entry of waitingEntries) {
    queuePosition++;
    sseRegistry.sendToUser(productId, entry.userId, {
      type: 'queue_update',
      position: queuePosition,
      totalInQueue,
      status: entry.status,
    });
  }

  // 廣播整體排隊人數（給旁觀者）
  sseRegistry.broadcast(productId, {
    type: 'queue_count',
    count: totalInQueue,
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

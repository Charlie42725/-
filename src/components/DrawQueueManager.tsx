'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import LotterySystem from './LotterySystem';
import QueueWaitingUI from './QueueWaitingUI';
import QueueCountdown from './QueueCountdown';
import { showToast } from './Toast';

type QueueState =
  | 'checking'
  | 'idle'
  | 'joining'
  | 'waiting'
  | 'active'
  | 'expired';

interface DiscountData {
  id: number;
  type: string;
  drawCount: number;
  price: number;
  label: string | null;
  isActive: boolean;
}

interface DrawQueueManagerProps {
  productId: number;
  productPrice: number;
  totalTickets: number;
  productStatus: string;
  soldTickets: number;
  serverSeedHash?: string | null;
  discounts: DiscountData[];
  onVariantsUpdate?: (variants: { id: number; prize: string; name: string; rarity: string | null; value: number; stock: number; imageUrl: string | null }[]) => void;
}

export default function DrawQueueManager({
  productId,
  productPrice,
  totalTickets,
  productStatus,
  soldTickets,
  serverSeedHash,
  discounts,
  onVariantsUpdate,
}: DrawQueueManagerProps) {
  const [queueState, setQueueState] = useState<QueueState>('checking');
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevQueueRef = useRef(0);

  // 清除 SSE 和心跳
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // 通知 QueueStatusBadge 即時更新
  const emitQueueChange = useCallback((count?: number) => {
    window.dispatchEvent(new CustomEvent('queueChanged', {
      detail: { productId, count },
    }));
  }, [productId]);

  // P1: Browser notification helper
  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/assets/images/logos/apple-touch-icon.png' });
      } catch {
        // 忽略
      }
    }
  }, []);

  // 建立 SSE 連線
  const connectSSE = useCallback(() => {
    const token = getAuthToken();
    if (!token) return;

    cleanup();

    const es = new EventSource(`/api/queue/stream?productId=${productId}&token=${token}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'your_turn':
            setQueueState('active');
            setExpiresAt(data.expiresAt);
            sendNotification('輪到你了！', '你的抽獎回合已開始，5 分鐘內完成抽獎');
            break;

          case 'queue_update':
            setTotalInQueue(data.totalInQueue);
            emitQueueChange(data.totalInQueue);
            if (data.status === 'active') {
              setQueueState('active');
            } else if (data.status === 'waiting') {
              setQueueState('waiting');
            }
            break;

          case 'queue_count':
            setTotalInQueue(data.count);
            emitQueueChange(data.count);
            break;

          case 'session_expired':
            setQueueState('expired');
            break;

          case 'product_sold_out':
            window.location.reload();
            break;

          case 'replaced':
            cleanup();
            break;

          case 'connected':
            break;
        }
      } catch {
        // 忽略解析錯誤（如 keep-alive）
      }
    };

    es.onerror = () => {
      // SSE 會自動重連
    };
  }, [productId, cleanup, emitQueueChange, sendNotification]);

  // 啟動心跳
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;

    const token = getAuthToken();
    if (!token) return;

    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch('/api/queue/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
      } catch {
        // 心跳失敗，忽略
      }
    }, 30000);
  }, [productId]);

  // 檢查初始排隊狀態
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/queue/status?productId=${productId}`, {
          headers,
        });

        if (!res.ok) {
          setQueueState('idle');
          return;
        }

        const data = await res.json();
        setTotalInQueue(data.queueLength || 0);

        if (!data.inQueue) {
          setQueueState('idle');
          return;
        }

        // 恢復排隊狀態
        if (data.status === 'active') {
          setQueueState('active');
          setExpiresAt(data.expiresAt);
        } else {
          setQueueState('waiting');
        }

        // 建立 SSE 連線和心跳
        connectSSE();
        startHeartbeat();
      } catch {
        setQueueState('idle');
      }
    };

    checkStatus();

    return cleanup;
  }, [productId, connectSSE, startHeartbeat, cleanup]);

  // P1: Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      // Defer request so it doesn't block paint
      const t = setTimeout(() => Notification.requestPermission(), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // P1: Notify when queue position is getting close
  useEffect(() => {
    if (queueState === 'waiting' && prevQueueRef.current > 2 && totalInQueue <= 2 && totalInQueue > 0) {
      sendNotification('快輪到你了！', `前面還有 ${totalInQueue} 人，請準備好`);
    }
    prevQueueRef.current = totalInQueue;
  }, [totalInQueue, queueState, sendNotification]);

  // beforeunload 時通知離開
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (queueState === 'waiting' || queueState === 'active') {
        const token = getAuthToken();
        if (token) {
          navigator.sendBeacon(
            '/api/queue/leave',
            JSON.stringify({ productId, token })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [productId, queueState]);

  // 加入排隊
  const handleJoinQueue = async () => {
    if (!isAuthenticated()) {
      showToast('請先登入才能抽獎', 'warning');
      return;
    }

    setQueueState('joining');

    try {
      const token = getAuthToken();
      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || '加入排隊失敗', 'error');
        setQueueState('idle');
        return;
      }

      const data = await res.json();
      const entry = data.entry;

      if (entry.status === 'active') {
        setQueueState('active');
        setExpiresAt(entry.expiresAt);
      } else {
        setQueueState('waiting');
      }

      // 通知 badge 即時更新
      emitQueueChange();

      // 建立 SSE 連線和心跳
      connectSSE();
      startHeartbeat();
    } catch {
      showToast('加入排隊失敗，請重試', 'error');
      setQueueState('idle');
    }
  };

  // 離開排隊
  const handleLeaveQueue = async () => {
    try {
      const token = getAuthToken();
      await fetch('/api/queue/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
    } catch {
      // 忽略
    }

    cleanup();
    setQueueState('idle');
    emitQueueChange();
  };

  // 抽獎完成回調 — soft reset
  const handleDrawComplete = () => {
    cleanup();
    emitQueueChange();
    // 不再 window.location.reload()，LotterySystem 內部會 soft refresh
  };

  // 超時回調
  const handleExpired = () => {
    setQueueState('expired');
  };

  // 商品不是 active 狀態
  if (productStatus !== 'active') {
    return null;
  }

  // 載入中
  if (queueState === 'checking') {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-6 h-6 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-zinc-500 mt-3 text-sm">載入中...</p>
      </div>
    );
  }

  // idle：顯示「開始抽選」按鈕 + 排隊人數
  if (queueState === 'idle') {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto">
          {totalInQueue > 0 && (
            <div className="mb-6">
              <div className="bg-amber-500/12 rounded-xl p-4 border border-amber-400/30">
                <p className="text-amber-400 font-medium">
                  目前 <span className="font-bold text-lg">{totalInQueue}</span> 人排隊中
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleJoinQueue}
            className="bg-amber-500 text-white font-bold py-5 px-16 rounded-2xl hover:bg-amber-600 transition-all transform hover:scale-[1.03] shadow-lg shadow-amber-500/20 text-xl"
          >
            開始抽選
          </button>
          <p className="text-zinc-500 text-sm mt-4">
            點擊後將開始 5 分鐘倒數計時抽獎
          </p>
        </div>
      </div>
    );
  }

  // 加入中
  if (queueState === 'joining') {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-6 h-6 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-zinc-500 mt-3 text-sm">加入排隊中...</p>
      </div>
    );
  }

  // 等待中
  if (queueState === 'waiting') {
    return (
      <QueueWaitingUI
        totalInQueue={totalInQueue}
        onLeave={handleLeaveQueue}
      />
    );
  }

  // 超時
  if (queueState === 'expired') {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-surface-1/50 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-[var(--border)] max-w-lg mx-auto">
          <div className="text-6xl mb-6">⏰</div>
          <h3 className="text-2xl font-bold text-white mb-4">抽獎時間已過期</h3>
          <p className="text-zinc-500 mb-8">
            您的操作時間已結束，請重新排隊。
          </p>
          <button
            onClick={handleJoinQueue}
            className="bg-amber-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-amber-600 transition-all shadow-lg"
          >
            重新排隊
          </button>
        </div>
      </div>
    );
  }

  // active：倒數計時 + 抽獎系統
  return (
    <div>
      {expiresAt && (
        <div className="mb-6">
          <QueueCountdown expiresAt={expiresAt} onExpired={handleExpired} />
        </div>
      )}

      <LotterySystem
        productId={productId}
        productPrice={productPrice}
        totalTickets={totalTickets}
        soldTickets={soldTickets}
        serverSeedHash={serverSeedHash}
        discounts={discounts}
        onVariantsUpdate={onVariantsUpdate}
        onDrawComplete={handleDrawComplete}
      />
    </div>
  );
}

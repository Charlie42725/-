'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import LotterySystem from './LotterySystem';
import QueueWaitingUI from './QueueWaitingUI';
import QueueCountdown from './QueueCountdown';

type QueueState =
  | 'checking'
  | 'no_queue'
  | 'joining'
  | 'waiting'
  | 'your_turn'
  | 'expired';

interface DrawQueueManagerProps {
  productId: number;
  productPrice: number;
  totalTickets: number;
  productStatus: string;
}

export default function DrawQueueManager({
  productId,
  productPrice,
  totalTickets,
  productStatus,
}: DrawQueueManagerProps) {
  const [queueState, setQueueState] = useState<QueueState>('checking');
  const [position, setPosition] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            setQueueState('your_turn');
            setExpiresAt(data.expiresAt);
            break;

          case 'queue_update':
            setPosition(data.position);
            setTotalInQueue(data.totalInQueue);
            if (data.status === 'active') {
              // 已經是 active 但可能沒收到 your_turn
              if (queueState !== 'your_turn') {
                setQueueState('your_turn');
              }
            } else if (data.status === 'waiting') {
              setQueueState('waiting');
            }
            break;

          case 'session_expired':
            setQueueState('expired');
            break;

          case 'product_sold_out':
            // 商品完售，重新載入頁面
            window.location.reload();
            break;

          case 'replaced':
            // 連線被新分頁取代
            cleanup();
            break;

          case 'connected':
            // 連線成功
            break;
        }
      } catch {
        // 忽略解析錯誤（如 keep-alive）
      }
    };

    es.onerror = () => {
      // SSE 會自動重連
    };
  }, [productId, cleanup, queueState]);

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
    if (!isAuthenticated()) {
      setQueueState('no_queue');
      return;
    }

    const checkStatus = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`/api/queue/status?productId=${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setQueueState('no_queue');
          return;
        }

        const data = await res.json();

        if (!data.inQueue) {
          // 檢查是否有其他人在排隊
          if (data.queueLength > 0) {
            // 有人排隊中，需要加入排隊
            setQueueState('no_queue');
            setTotalInQueue(data.queueLength);
          } else {
            // 沒人排隊，直接顯示抽獎
            setQueueState('no_queue');
          }
          return;
        }

        // 恢復排隊狀態
        setPosition(data.position);
        setTotalInQueue(data.totalInQueue);

        if (data.status === 'active') {
          setQueueState('your_turn');
          setExpiresAt(data.expiresAt);
        } else {
          setQueueState('waiting');
        }

        // 建立 SSE 連線和心跳
        connectSSE();
        startHeartbeat();
      } catch {
        setQueueState('no_queue');
      }
    };

    checkStatus();

    return cleanup;
  }, [productId, connectSSE, startHeartbeat, cleanup]);

  // beforeunload 時通知離開
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (queueState === 'waiting' || queueState === 'your_turn') {
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
      alert('請先登入才能抽獎');
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
        alert(data.error || '加入排隊失敗');
        setQueueState('no_queue');
        return;
      }

      const data = await res.json();
      const entry = data.entry;

      if (entry.status === 'active') {
        setQueueState('your_turn');
        setExpiresAt(entry.expiresAt);
      } else {
        setQueueState('waiting');
      }

      // 建立 SSE 連線和心跳
      connectSSE();
      startHeartbeat();
    } catch {
      alert('加入排隊失敗，請重試');
      setQueueState('no_queue');
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
    setQueueState('no_queue');
  };

  // 抽獎完成回調
  const handleDrawComplete = () => {
    cleanup();
    // 重新整理頁面以確保所有資料同步
    window.location.reload();
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
        <div className="text-slate-400">載入中...</div>
      </div>
    );
  }

  // 沒人排隊 → 登入用戶直接顯示號碼牌，未登入則顯示按鈕
  if (queueState === 'no_queue') {
    if (!isAuthenticated()) {
      return (
        <div className="text-center">
          <button
            onClick={handleJoinQueue}
            className="bg-orange-500 text-white font-bold py-4 px-12 rounded-xl hover:bg-orange-600 transition-all transform hover:scale-[1.02] shadow-lg text-lg"
          >
            開始抽獎
          </button>
        </div>
      );
    }

    // 登入用戶直接顯示號碼牌，有人排隊時提示需排隊
    return (
      <>
        {totalInQueue > 0 && (
          <div className="text-center mb-6">
            <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-400/30 max-w-lg mx-auto">
              <p className="text-orange-400 font-medium">
                目前有 <span className="font-bold">{totalInQueue}</span> 人正在排隊中
              </p>
            </div>
          </div>
        )}
        <LotterySystem
          productId={productId}
          productPrice={productPrice}
          totalTickets={totalTickets}
          onDrawComplete={handleDrawComplete}
          onRequireQueue={handleJoinQueue}
        />
      </>
    );
  }

  // 加入中
  if (queueState === 'joining') {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400">加入排隊中...</div>
      </div>
    );
  }

  // 等待中
  if (queueState === 'waiting') {
    return (
      <QueueWaitingUI
        position={position}
        totalInQueue={totalInQueue}
        onLeave={handleLeaveQueue}
      />
    );
  }

  // 超時
  if (queueState === 'expired') {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-slate-800/50 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-slate-700/50 max-w-lg mx-auto">
          <div className="text-6xl mb-6">⏰</div>
          <h3 className="text-2xl font-bold text-white mb-4">抽獎時間已過期</h3>
          <p className="text-slate-400 mb-8">
            您的操作時間已結束，請重新排隊。
          </p>
          <button
            onClick={handleJoinQueue}
            className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition-all shadow-lg"
          >
            重新排隊
          </button>
        </div>
      </div>
    );
  }

  // 輪到你了
  return (
    <div>
      {/* 倒數計時 */}
      {expiresAt && (
        <div className="mb-6">
          <QueueCountdown expiresAt={expiresAt} onExpired={handleExpired} />
        </div>
      )}

      {/* 抽獎系統 */}
      <LotterySystem
        productId={productId}
        productPrice={productPrice}
        totalTickets={totalTickets}
        onDrawComplete={handleDrawComplete}
      />
    </div>
  );
}

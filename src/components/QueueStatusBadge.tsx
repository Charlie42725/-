'use client';

import { useState, useEffect, useCallback } from 'react';

interface QueueStatusBadgeProps {
  productId: number;
}

export default function QueueStatusBadge({ productId }: QueueStatusBadgeProps) {
  const [queueCount, setQueueCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue/status?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueCount(data.queueLength || 0);
      }
    } catch {
      // 忽略
    }
  }, [productId]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 15000);

    // 監聽 DrawQueueManager 發出的即時更新事件
    const handleQueueChange = (e: CustomEvent) => {
      if (e.detail?.productId === productId) {
        if (typeof e.detail.count === 'number') {
          setQueueCount(e.detail.count);
        } else {
          // count 未知時重新 fetch
          fetchCount();
        }
      }
    };

    window.addEventListener('queueChanged', handleQueueChange as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('queueChanged', handleQueueChange as EventListener);
    };
  }, [productId, fetchCount]);

  if (queueCount <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-500/18 border border-amber-400/30 text-amber-400 px-3 py-1.5 rounded-full text-sm font-bold">
      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
      {queueCount} 人排隊中
    </span>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';

interface QueueWaitingUIProps {
  totalInQueue: number;
  onLeave: () => void;
}

export default function QueueWaitingUI({
  totalInQueue,
  onLeave,
}: QueueWaitingUIProps) {
  const [animating, setAnimating] = useState(false);
  const prevCount = useRef(totalInQueue);

  // P2: Animate when queue count changes
  useEffect(() => {
    if (totalInQueue !== prevCount.current) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 600);
      prevCount.current = totalInQueue;
      return () => clearTimeout(t);
    }
  }, [totalInQueue]);

  return (
    <div className="text-center py-12 px-4">
      <div className="bg-surface-1/50 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-[var(--border)] max-w-lg mx-auto">
        {/* Animated hourglass */}
        <div className="text-5xl mb-6 animate-[pulse_2s_ease-in-out_infinite]">⏳</div>

        <h3 className="text-2xl font-bold text-white mb-2">排隊等待中</h3>

        <div className="bg-surface-2/50 rounded-xl p-4 mb-6 mt-6">
          <p className="text-zinc-500 text-sm mb-1">目前排隊人數</p>
          <p className={`text-amber-400 font-bold text-3xl transition-all duration-300 ${
            animating ? 'scale-110' : 'scale-100'
          } ${totalInQueue <= 2 ? 'text-green-400' : ''}`}>
            {totalInQueue}
          </p>
        </div>

        {/* P2: Connection status indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-green-400 text-xs font-medium">連線中 - 即時監控您的順位</span>
        </div>

        <p className="text-zinc-500 text-sm mb-6">
          輪到您時會自動通知，請勿關閉此頁面
        </p>

        <button
          onClick={onLeave}
          className="bg-surface-3 text-zinc-300 font-medium py-3 px-8 rounded-xl hover:bg-surface-3/80 transition-colors"
        >
          離開排隊
        </button>
      </div>
    </div>
  );
}

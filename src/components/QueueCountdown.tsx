'use client';

import { useState, useEffect, useCallback } from 'react';

interface QueueCountdownProps {
  expiresAt: string;
  onExpired: () => void;
}

export default function QueueCountdown({ expiresAt, onExpired }: QueueCountdownProps) {
  const calculateRemaining = useCallback(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calculateRemaining);

  const totalDuration = 180; // 3 分鐘
  const progress = (remaining / totalDuration) * 100;
  const isWarning = remaining <= 30;

  useEffect(() => {
    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const newRemaining = calculateRemaining();
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, calculateRemaining, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className={`rounded-xl p-4 border ${
      isWarning
        ? 'bg-red-500/20 border-red-400/50'
        : 'bg-orange-500/20 border-orange-400/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${isWarning ? 'text-red-400' : 'text-orange-400'}`}>
          剩餘操作時間
        </span>
        <span className={`font-mono text-2xl font-bold ${
          isWarning ? 'text-red-400 queue-countdown-warning' : 'text-white'
        }`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* 進度條 */}
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isWarning
              ? 'bg-gradient-to-r from-red-500 to-red-400'
              : 'bg-orange-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isWarning && (
        <p className="text-red-400 text-xs mt-2 text-center">
          時間即將到期，請盡快完成抽獎！
        </p>
      )}
    </div>
  );
}

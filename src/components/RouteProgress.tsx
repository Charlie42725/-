'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
  }, []);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // 導航完成 — 快速填滿然後隱藏
    cleanup();
    setProgress(100);
    setVisible(true);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }, [pathname, cleanup]);

  // 攔截 Link 點擊：開始進度條
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || anchor.target === '_blank') return;
      if (href === prevPath.current) return;

      cleanup();
      setProgress(15);
      setVisible(true);

      // 緩慢增長到 90%
      let p = 15;
      timerRef.current = setInterval(() => {
        p += (90 - p) * 0.08;
        setProgress(p);
      }, 50);
    }

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      cleanup();
    };
  }, [cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms' }}
    >
      <div
        className="h-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 150ms ease-out' : 'width 80ms linear',
        }}
      />
    </div>
  );
}

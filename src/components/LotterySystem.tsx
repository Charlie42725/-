'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Variant {
  id: number;
  prize: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  value: number;
  rarity: string | null;
}

interface LotterySystemProps {
  productId: number;
  productPrice: number;
  totalTickets: number;
  onVariantsUpdate?: (variants: Variant[]) => void;
  onDrawComplete?: () => void;
}

interface DrawnTicket {
  ticketNumber: number;
  variant: Variant;
}

interface LotteryResult {
  ticketNumber: number;
  variant: Variant;
}

export default function LotterySystem({
  productId,
  productPrice,
  totalTickets,
  onVariantsUpdate,
  onDrawComplete,
}: LotterySystemProps) {
  const router = useRouter();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnTickets, setDrawnTickets] = useState<DrawnTicket[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDrawnTickets = useCallback(async () => {
    try {
      const response = await fetch(`/api/lottery/drawn-tickets?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setDrawnTickets(data.drawnTickets);
      }
    } catch (error) {
      console.error('Failed to load drawn tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadUserPoints = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.user.points);
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    // 並行載入已抽號碼和用戶點數
    Promise.all([loadDrawnTickets(), loadUserPoints()]);
  }, [loadDrawnTickets]);

  const loadLatestVariants = async () => {
    try {
      const response = await fetch(`/api/lottery/variants?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        if (onVariantsUpdate) {
          onVariantsUpdate(data.variants);
        }
        window.dispatchEvent(new CustomEvent('variantsUpdated', {
          detail: { productId, variants: data.variants }
        }));
      }
    } catch (error) {
      console.error('Failed to load latest variants:', error);
    }
  };

  const handleNumberClick = (number: number) => {
    if (isDrawing || drawnTicketMap.has(number)) return;

    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        if (prev.length >= 10) {
          alert('一次最多只能選擇 10 個號碼');
          return prev;
        }
        return [...prev, number];
      }
    });
  };

  const handleConfirmDraw = () => {
    if (!isAuthenticated()) {
      alert('請先登入才能抽獎');
      router.push('/login');
      return;
    }

    const totalCost = productPrice * selectedNumbers.length;
    if (userPoints < totalCost) {
      alert(`點數不足！\n\n需要：${totalCost} 點\n目前：${userPoints} 點\n\n請先購買點數`);
      router.push('/member/points');
      return;
    }

    setShowConfirmDialog(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCancelConfirm = useCallback(() => {
    setShowConfirmDialog(false);
    document.body.style.overflow = '';
  }, []);

  const handleStartDraw = async () => {
    if (selectedNumbers.length === 0 || isDrawing) return;

    setShowConfirmDialog(false);
    setIsDrawing(true);
    setResults([]);
    setCurrentRevealIndex(-1);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          ticketNumbers: selectedNumbers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '抽獎失敗');
      }

      setUserPoints(data.newBalance);

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: data.newBalance.toString()
      }));

      const newResults: LotteryResult[] = data.results.map((r: { ticketNumber: number; variant: Variant }) => ({
        ticketNumber: r.ticketNumber,
        variant: r.variant
      }));

      setResults(newResults);

      // 快速翻牌動畫：每張 150ms
      for (let i = 0; i < newResults.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setCurrentRevealIndex(i);
      }

      setDrawnTickets(prev => [...prev, ...newResults]);
      setSelectedNumbers([]);

      // 非同步更新獎項（不阻塞 UI）
      loadLatestVariants();

      await new Promise(resolve => setTimeout(resolve, 500));
      setIsDrawing(false);

    } catch (error) {
      console.error('Draw error:', error);
      const errorMessage = error instanceof Error ? error.message : '抽獎失敗，請稍後再試';
      alert(errorMessage);
      setIsDrawing(false);
      setResults([]);
      setCurrentRevealIndex(-1);
      document.body.style.overflow = '';
    }
  };

  const handleCloseResults = useCallback(() => {
    setResults([]);
    document.body.style.overflow = '';
    if (onDrawComplete) {
      onDrawComplete();
    } else {
      window.location.reload();
    }
  }, [onDrawComplete]);

  // ESC key handler for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmDialog) {
          handleCancelConfirm();
        } else if (results.length > 0 && !isDrawing) {
          handleCloseResults();
        }
      }
    };

    if (showConfirmDialog || results.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmDialog, results.length, isDrawing, handleCancelConfirm, handleCloseResults]);

  // O(1) lookup map for drawn tickets instead of O(n) array scans
  const drawnTicketMap = useMemo(() => {
    const map = new Map<number, Variant>();
    for (const t of drawnTickets) {
      map.set(t.ticketNumber, t.variant);
    }
    return map;
  }, [drawnTickets]);

  // O(1) lookup set for selected numbers
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);

  // 確認對話框 Portal
  const ConfirmDialogPortal = () => {
    if (!mounted || !showConfirmDialog) return null;

    const totalCost = productPrice * selectedNumbers.length;

    return createPortal(
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="確認抽獎"
      >
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-heading font-bold text-white mb-2">確認開始抽獎？</h3>
            <p className="text-slate-400">
              你已選擇 <span className="text-orange-400 font-bold text-xl">{selectedNumbers.length}</span> 個號碼
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <p className="text-slate-300 text-sm text-center leading-relaxed mb-3">
              選擇的號碼：
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedNumbers.sort((a, b) => a - b).map(num => (
                <span key={num} className="bg-orange-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
                  {num}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-orange-500/10 rounded-xl p-4 mb-6 border border-orange-500/30">
            <div className="text-center">
              <p className="text-slate-300 text-sm mb-2">消耗點數</p>
              <p className="text-orange-400 font-bold text-2xl">{totalCost} 點</p>
              <p className="text-slate-400 text-xs mt-1">
                剩餘點數: {userPoints - totalCost} 點
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancelConfirm}
              className="flex-1 bg-slate-700 text-white font-medium py-3 px-6 rounded-xl hover:bg-slate-600 transition-colors duration-200"
            >
              取消
            </button>
            <button
              onClick={handleStartDraw}
              className="flex-1 bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-lg"
            >
              確認抽獎
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 抽獎結果 Portal
  const ResultsPortal = () => {
    if (!mounted || results.length === 0) return null;

    return createPortal(
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="抽獎結果"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDrawing) {
            handleCloseResults();
          }
        }}
      >
        <div className="max-w-6xl w-full h-full max-h-[90vh] flex flex-col">
          <div className="text-center mb-4 flex-shrink-0">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
              {isDrawing ? '抽獎中...' : '抽獎結果'}
            </h2>
            <p className="text-slate-400">
              共抽出 <span className="text-orange-400 font-bold">{results.length}</span> 個號碼
            </p>
          </div>

          <div
            className="flex-1 overflow-y-auto custom-scrollbar"
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
              {results.map((result, index) => {
                const isRevealed = index <= currentRevealIndex;

                return (
                  <div
                    key={result.ticketNumber}
                    className={`
                      relative aspect-[3/4] transition-all duration-300
                      ${isRevealed ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}
                    `}
                    style={{ perspective: '1000px' }}
                  >
                    <div className={`flip-card ${isRevealed ? 'flipped' : ''}`}>
                      {/* 正面：號碼 */}
                      <div className="flip-card-front rounded-xl overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-orange-500 flex items-center justify-center">
                          <div className="text-white text-6xl font-bold drop-shadow-lg">
                            {result.ticketNumber}
                          </div>
                        </div>
                      </div>

                      {/* 背面：獎品 */}
                      <div className="flip-card-back rounded-xl overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-slate-800 flex flex-col">
                          <div className="relative flex-1">
                            {result.variant.imageUrl ? (
                              <Image
                                src={result.variant.imageUrl}
                                alt={result.variant.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-900 px-3 py-4 flex flex-col justify-center gap-1 flex-shrink-0">
                            <p className="text-orange-400 font-bold text-center text-sm leading-tight">
                              {result.ticketNumber} - {result.variant.prize}
                            </p>
                            <p className="text-white text-center text-xs leading-tight line-clamp-2">
                              {result.variant.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isDrawing && (
            <div className="text-center mt-4 flex-shrink-0">
              <button
                onClick={handleCloseResults}
                className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all duration-200 shadow-lg"
              >
                關閉結果
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse"></div>
          <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(16,minmax(0,1fr))] gap-2 md:gap-3">
          {Array.from({ length: Math.min(totalTickets, 48) }, (_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-slate-700/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialogPortal />
      <ResultsPortal />

      {/* 用戶點數顯示 */}
      {isAuthenticated() && (
        <div className="mb-6 bg-orange-500/12 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">目前點數餘額</p>
              <p className="text-orange-400 font-bold text-2xl">{userPoints.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-sm">每抽價格</p>
              <p className="text-white font-bold text-xl">{productPrice} 點/抽</p>
            </div>
          </div>
        </div>
      )}

      <div className='bg-transparent rounded-none p-0 border-0 shadow-none mb-12'>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold text-white">抽獎號碼池</h2>
          <div className="text-sm text-slate-400">
            已選擇 <span className="text-orange-400 font-bold">{selectedNumbers.length}</span> / 10 個號碼
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(16,minmax(0,1fr))] gap-2 md:gap-3">
          {Array.from({ length: totalTickets }, (_, i) => i + 1).map(number => {
            const variant = drawnTicketMap.get(number) ?? null;
            const drawn = variant !== null;
            const selected = selectedSet.has(number);

            return (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={drawn || isDrawing}
                className={`
                  aspect-square rounded-lg font-bold text-sm transition-all duration-200 relative overflow-hidden
                  ${drawn
                    ? 'bg-slate-700/50 text-slate-500'
                    : selected
                    ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-500/30'
                    : 'bg-slate-700 text-white hover:bg-slate-600 hover:-translate-y-0.5'
                  }
                `}
                title={drawn && variant ? `${variant.prize} - ${variant.name}` : ''}
              >
                {drawn && variant ? (
                  <div className="flex flex-col items-center justify-center h-full p-1">
                    <div className="text-xs leading-none mb-0.5">{number}</div>
                    <div className="text-[0.6rem] leading-none text-orange-400 font-bold">
                      {variant.prize}
                    </div>
                  </div>
                ) : (
                  number
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 -mx-4 px-4 py-4 mt-6 md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:mx-0 md:px-0 md:py-0 md:mt-0">
        <div className="flex gap-4 max-w-2xl mx-auto md:max-w-none">
          <button
            onClick={handleConfirmDraw}
            disabled={selectedNumbers.length === 0 || isDrawing}
            className="flex-1 bg-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isDrawing ? '抽獎中...' : `開始抽獎 (${selectedNumbers.length} 抽 = ${productPrice * selectedNumbers.length} 點)`}
          </button>

          {selectedNumbers.length > 0 && !isDrawing && (
            <button
              onClick={() => setSelectedNumbers([])}
              className="bg-slate-700 text-white font-medium py-4 px-6 rounded-xl hover:bg-slate-600 transition-colors duration-200"
            >
              清除選擇
            </button>
          )}
        </div>
      </div>
    </>
  );
}

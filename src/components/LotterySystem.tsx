'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { calculateDiscountedPrice, type Discount, type PriceBreakdown } from '@/lib/discount-engine';
import { showToast } from './Toast';

interface Variant {
  id: number;
  prize: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  value: number;
  rarity: string | null;
}

interface DiscountData {
  id: number;
  type: string;
  drawCount: number;
  price: number;
  label: string | null;
  isActive: boolean;
}

interface LotterySystemProps {
  productId: number;
  productPrice: number;
  totalTickets: number;
  soldTickets: number;
  serverSeedHash?: string | null;
  discounts: DiscountData[];
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

// ─── Tiny sound helper (Web Audio API) ──────────────────
function playRevealSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // 靜音 fallback
  }
}

export default function LotterySystem({
  productId,
  productPrice,
  totalTickets,
  soldTickets: initialSoldTickets,
  serverSeedHash: initialSeedHash,
  discounts: discountData,
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
  const [showBatchConfirm, setShowBatchConfirm] = useState<Discount | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSoldTickets, setCurrentSoldTickets] = useState(initialSoldTickets);
  const [serverSeedHash, setServerSeedHash] = useState(initialSeedHash || null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // 轉換 discounts 為引擎格式
  const discounts: Discount[] = useMemo(() =>
    discountData.map(d => ({
      ...d,
      type: d.type as 'full_set' | 'combo',
    })),
    [discountData]
  );

  const fullSetDiscounts = useMemo(() =>
    discounts.filter(d => d.type === 'full_set' && d.isActive).sort((a, b) => a.drawCount - b.drawCount),
    [discounts]
  );

  const comboDiscounts = useMemo(() =>
    discounts.filter(d => d.type === 'combo' && d.isActive).sort((a, b) => a.drawCount - b.drawCount),
    [discounts]
  );

  // 即時折扣計算
  const priceBreakdown: PriceBreakdown = useMemo(() =>
    calculateDiscountedPrice(selectedNumbers.length, productPrice, currentSoldTickets, discounts),
    [selectedNumbers.length, productPrice, currentSoldTickets, discounts]
  );

  const loadDrawnTickets = useCallback(async () => {
    try {
      const response = await fetch(`/api/lottery/drawn-tickets?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setDrawnTickets(data.drawnTickets);
        setCurrentSoldTickets(data.drawnTickets.length);
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
    Promise.all([loadDrawnTickets(), loadUserPoints()]);
  }, [loadDrawnTickets]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

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
          showToast('一次最多只能選擇 10 個號碼', 'warning');
          return prev;
        }
        return [...prev, number];
      }
    });
  };

  const handleConfirmDraw = () => {
    if (!isAuthenticated()) {
      showToast('請先登入才能抽獎', 'warning');
      router.push('/login');
      return;
    }

    if (userPoints < priceBreakdown.totalPrice) {
      showToast(`點數不足！需要 ${priceBreakdown.totalPrice.toLocaleString()} 點，目前 ${userPoints.toLocaleString()} 點`, 'error');
      router.push('/member/points');
      return;
    }

    setShowConfirmDialog(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCancelConfirm = useCallback(() => {
    setShowConfirmDialog(false);
    setShowBatchConfirm(null);
    document.body.style.overflow = '';
  }, []);

  // 開套按鈕點擊
  const handleBatchOpen = (discount: Discount) => {
    if (!isAuthenticated()) {
      showToast('請先登入才能抽獎', 'warning');
      router.push('/login');
      return;
    }

    if (userPoints < discount.price) {
      showToast(`點數不足！需要 ${discount.price.toLocaleString()} 點，目前 ${userPoints.toLocaleString()} 點`, 'error');
      router.push('/member/points');
      return;
    }

    setShowBatchConfirm(discount);
    document.body.style.overflow = 'hidden';
  };

  // 共用抽獎 fetch 邏輯（帶 30s timeout）
  const fetchDraw = async (body: Record<string, unknown>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '抽獎失敗');
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  };

  // 共用揭曉動畫
  const revealResults = async (newResults: LotteryResult[]) => {
    setResults(newResults);

    for (let i = 0; i < newResults.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setCurrentRevealIndex(i);
      if (soundEnabled) playRevealSound();
    }

    setDrawnTickets(prev => [...prev, ...newResults]);
    loadLatestVariants();

    await new Promise(resolve => setTimeout(resolve, 500));
    setIsDrawing(false);
  };

  // 執行開套抽獎
  const handleStartBatchDraw = async () => {
    if (!showBatchConfirm || isDrawing) return;

    const discount = showBatchConfirm;
    setShowBatchConfirm(null);
    setIsDrawing(true);
    setResults([]);
    setCurrentRevealIndex(-1);

    try {
      const data = await fetchDraw({
        productId,
        batchOpen: true,
        drawCount: discount.drawCount
      });

      setUserPoints(data.newBalance);
      setCurrentSoldTickets(prev => prev + discount.drawCount);
      if (data.fairness?.serverSeedHash) {
        setServerSeedHash(data.fairness.serverSeedHash);
      }

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: data.newBalance.toString()
      }));

      const newResults: LotteryResult[] = data.results.map((r: { ticketNumber: number; variant: Variant }) => ({
        ticketNumber: r.ticketNumber,
        variant: r.variant
      }));

      await revealResults(newResults);

    } catch (error) {
      console.error('Draw error:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        showToast('抽獎請求逾時，請檢查網路後重試', 'error');
      } else {
        showToast(error instanceof Error ? error.message : '抽獎失敗，請稍後再試', 'error');
      }
      setIsDrawing(false);
      setResults([]);
      setCurrentRevealIndex(-1);
      document.body.style.overflow = '';
    }
  };

  const handleStartDraw = async () => {
    if (selectedNumbers.length === 0 || isDrawing) return;

    setShowConfirmDialog(false);
    setIsDrawing(true);
    setResults([]);
    setCurrentRevealIndex(-1);

    try {
      const data = await fetchDraw({
        productId,
        ticketNumbers: selectedNumbers
      });

      setUserPoints(data.newBalance);
      setCurrentSoldTickets(prev => prev + selectedNumbers.length);
      if (data.fairness?.serverSeedHash) {
        setServerSeedHash(data.fairness.serverSeedHash);
      }

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: data.newBalance.toString()
      }));

      const newResults: LotteryResult[] = data.results.map((r: { ticketNumber: number; variant: Variant }) => ({
        ticketNumber: r.ticketNumber,
        variant: r.variant
      }));

      setSelectedNumbers([]);
      await revealResults(newResults);

    } catch (error) {
      console.error('Draw error:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        showToast('抽獎請求逾時，請檢查網路後重試', 'error');
      } else {
        showToast(error instanceof Error ? error.message : '抽獎失敗，請稍後再試', 'error');
      }
      setIsDrawing(false);
      setResults([]);
      setCurrentRevealIndex(-1);
      document.body.style.overflow = '';
    }
  };

  // P0: Soft reset instead of window.location.reload()
  const handleCloseResults = useCallback(() => {
    setResults([]);
    setCurrentRevealIndex(-1);
    document.body.style.overflow = '';
    if (onDrawComplete) {
      onDrawComplete();
    } else {
      // Soft refresh: reload drawn tickets + variants + points silently
      loadDrawnTickets();
      loadLatestVariants();
      loadUserPoints();
    }
  }, [onDrawComplete, loadDrawnTickets]);

  // ESC key handler for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmDialog || showBatchConfirm) {
          handleCancelConfirm();
        } else if (results.length > 0 && !isDrawing) {
          handleCloseResults();
        }
      }
    };

    if (showConfirmDialog || showBatchConfirm || results.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmDialog, showBatchConfirm, results.length, isDrawing, handleCancelConfirm, handleCloseResults]);

  // O(1) lookup map for drawn tickets
  const drawnTicketMap = useMemo(() => {
    const map = new Map<number, Variant>();
    for (const t of drawnTickets) {
      map.set(t.ticketNumber, t.variant);
    }
    return map;
  }, [drawnTickets]);

  // O(1) lookup set for selected numbers
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);

  // 開套確認彈窗
  const BatchConfirmPortal = () => {
    if (!mounted || !showBatchConfirm) return null;

    const discount = showBatchConfirm;
    const regularPrice = productPrice * discount.drawCount;
    const savings = regularPrice - discount.price;

    return createPortal(
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="確認開套抽獎"
      >
        <div className="bg-surface-1 rounded-2xl p-8 max-w-md w-full border border-[var(--border)] shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-heading font-bold text-white mb-2">確認開套抽獎？</h3>
            <p className="text-zinc-500">
              {discount.label || `${discount.drawCount} 抽開套優惠`}
            </p>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-4 mb-4 border border-amber-500/25">
            <div className="text-center">
              <p className="text-zinc-300 text-sm mb-1">抽取數量</p>
              <p className="text-amber-400 font-bold text-3xl mb-2">{discount.drawCount} 抽</p>
              <p className="text-zinc-300 text-sm mb-1">優惠價格</p>
              <p className="text-amber-400 font-bold text-2xl">{discount.price.toLocaleString()} 點</p>
              {savings > 0 && (
                <p className="text-green-400 text-sm mt-2">
                  原價 {regularPrice.toLocaleString()} 點，省 {savings.toLocaleString()} 點
                </p>
              )}
              <p className="text-zinc-500 text-xs mt-2">
                系統將自動隨機選取號碼
              </p>
            </div>
          </div>

          <div className="bg-surface-2/50 rounded-xl p-3 mb-6">
            <div className="text-center">
              <p className="text-zinc-500 text-xs">剩餘點數</p>
              <p className="text-white font-bold">{(userPoints - discount.price).toLocaleString()} 點</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancelConfirm}
              className="flex-1 bg-zinc-700 text-white font-medium py-3 px-6 rounded-xl hover:bg-zinc-600 transition-colors duration-200"
            >
              取消
            </button>
            <button
              onClick={handleStartBatchDraw}
              className="flex-1 bg-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-amber-600 transition-all duration-200 shadow-lg"
            >
              確認開套
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 確認對話框 Portal
  const ConfirmDialogPortal = () => {
    if (!mounted || !showConfirmDialog) return null;

    const hasDiscount = priceBreakdown.savings > 0;

    return createPortal(
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="確認抽獎"
      >
        <div className="bg-surface-1 rounded-2xl p-8 max-w-md w-full border border-[var(--border)] shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-heading font-bold text-white mb-2">確認開始抽獎？</h3>
            <p className="text-zinc-500">
              你已選擇 <span className="text-amber-400 font-bold text-xl">{selectedNumbers.length}</span> 個號碼
            </p>
          </div>

          <div className="bg-surface-2/50 rounded-xl p-4 mb-4">
            <p className="text-zinc-300 text-sm text-center leading-relaxed mb-3">
              選擇的號碼：
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedNumbers.sort((a, b) => a - b).map(num => (
                <span key={num} className="bg-amber-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
                  {num}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-4 mb-6 border border-amber-500/25">
            <div className="text-center">
              <p className="text-zinc-300 text-sm mb-2">消耗點數</p>
              <p className="text-amber-400 font-bold text-2xl">{priceBreakdown.totalPrice.toLocaleString()} 點</p>
              {hasDiscount && (
                <p className="text-green-400 text-sm mt-1">
                  原價 {priceBreakdown.regularPrice.toLocaleString()} 點，省 {priceBreakdown.savings.toLocaleString()} 點
                </p>
              )}
              <p className="text-zinc-500 text-xs mt-2">
                剩餘點數: {(userPoints - priceBreakdown.totalPrice).toLocaleString()} 點
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancelConfirm}
              className="flex-1 bg-zinc-700 text-white font-medium py-3 px-6 rounded-xl hover:bg-zinc-600 transition-colors duration-200"
            >
              取消
            </button>
            <button
              onClick={handleStartDraw}
              className="flex-1 bg-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-amber-600 transition-all duration-200 shadow-lg"
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

    const revealedCount = Math.max(0, currentRevealIndex + 1);
    const isRevealing = isDrawing && revealedCount < results.length;

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
          {/* Header + Progress */}
          <div className="text-center mb-4 flex-shrink-0">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
              {isRevealing ? (
                <span className="inline-flex items-center gap-3">
                  <span className="inline-block w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  揭曉中 {revealedCount}/{results.length}
                </span>
              ) : isDrawing ? '抽獎中...' : '抽獎結果'}
            </h2>
            <p className="text-zinc-500">
              共抽出 <span className="text-amber-400 font-bold">{results.length}</span> 個號碼
            </p>
            {/* Reveal progress bar */}
            {isDrawing && (
              <div className="w-48 mx-auto mt-2 h-1 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-150"
                  style={{ width: `${(revealedCount / results.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* P1: Fixed mobile scrolling — removed stopPropagation */}
          <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
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
                        <div className="absolute inset-0 bg-amber-500 flex items-center justify-center">
                          <div className="text-white text-6xl font-bold drop-shadow-lg">
                            {result.ticketNumber}
                          </div>
                        </div>
                      </div>

                      {/* 背面：獎品 */}
                      <div className="flip-card-back rounded-xl overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-surface-1 flex flex-col">
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
                              <div className="absolute inset-0 bg-surface-1 flex items-center justify-center">
                                <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="bg-surface-deep px-3 py-4 flex flex-col justify-center gap-1 flex-shrink-0">
                            <p className="text-amber-400 font-bold text-center text-sm leading-tight">
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

          {/* Bottom: Close + Fairness info */}
          {!isDrawing && (
            <div className="text-center mt-4 flex-shrink-0 space-y-3">
              <button
                onClick={handleCloseResults}
                className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-all duration-200 shadow-lg"
              >
                關閉結果
              </button>

              {/* P0: Provably Fair 驗證資訊 */}
              {serverSeedHash && (
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>公平驗證</span>
                  <span className="font-mono text-zinc-600">{serverSeedHash.slice(0, 16)}...</span>
                </div>
              )}
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
          <div className="h-6 w-32 bg-surface-2/50 rounded animate-pulse"></div>
          <div className="h-5 w-24 bg-surface-2/50 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(16,minmax(0,1fr))] gap-2 md:gap-3">
          {Array.from({ length: Math.min(totalTickets, 48) }, (_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-surface-2/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <BatchConfirmPortal />
      <ConfirmDialogPortal />
      <ResultsPortal />

      {/* 用戶點數顯示 */}
      {isAuthenticated() && (
        <div className="mb-6 bg-amber-500/10 rounded-xl p-4 border border-amber-500/18">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-300 text-sm">目前點數餘額</p>
              <p className="text-amber-400 font-bold text-2xl">{userPoints.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-300 text-sm">每抽價格</p>
              <p className="text-white font-bold text-xl">{productPrice} 點/抽</p>
            </div>
          </div>
        </div>
      )}

      {/* 開套優惠區塊（只在 soldTickets === 0 時顯示） */}
      {currentSoldTickets === 0 && fullSetDiscounts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">開套優惠</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fullSetDiscounts.map(discount => {
              const regularPrice = productPrice * discount.drawCount;
              const savings = regularPrice - discount.price;
              return (
                <button
                  key={discount.id}
                  onClick={() => handleBatchOpen(discount)}
                  disabled={isDrawing}
                  className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 text-left hover:border-amber-500/50 hover:from-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-amber-400 font-bold text-lg">{discount.drawCount} 抽</span>
                    {savings > 0 && (
                      <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        省 {savings.toLocaleString()} 點
                      </span>
                    )}
                  </div>
                  <p className="text-white font-bold text-xl">{discount.price.toLocaleString()} 點</p>
                  {discount.label && (
                    <p className="text-zinc-400 text-xs mt-1">{discount.label}</p>
                  )}
                  {savings > 0 && (
                    <p className="text-zinc-500 text-xs mt-1 line-through">
                      原價 {regularPrice.toLocaleString()} 點
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 組合價提示 */}
      {comboDiscounts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {comboDiscounts.map(combo => (
            <span
              key={combo.id}
              className="bg-surface-2/80 border border-[var(--border)] text-zinc-300 px-3 py-1.5 rounded-lg text-xs"
            >
              {combo.drawCount} 抽 {combo.price.toLocaleString()} 點
              {combo.label && <span className="text-zinc-500 ml-1">({combo.label})</span>}
            </span>
          ))}
        </div>
      )}

      <div className='bg-transparent rounded-none p-0 border-0 shadow-none mb-12'>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold text-white">抽獎號碼池</h2>
          <div className="text-sm text-zinc-500">
            已選擇 <span className="text-amber-400 font-bold">{selectedNumbers.length}</span> / 10 個號碼
          </div>
        </div>

        {/* P2: min-h-[44px] 確保觸控目標足夠大 */}
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
                  aspect-square min-h-[44px] rounded-lg font-bold text-sm transition-all duration-200 relative overflow-hidden
                  ${drawn
                    ? 'bg-surface-2/50 text-zinc-500'
                    : selected
                      ? 'bg-amber-500 text-white shadow-lg ring-2 ring-amber-500/25'
                      : 'bg-surface-3 text-white hover:bg-surface-3/80 hover:-translate-y-0.5'
                  }
                `}
                title={drawn && variant ? `${variant.prize} - ${variant.name}` : ''}
              >
                {drawn && variant ? (
                  <div className="flex flex-col items-center justify-center h-full p-1">
                    <div className="text-xs leading-none mb-0.5">{number}</div>
                    <div className="text-[0.6rem] leading-none text-amber-400 font-bold">
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

        {/* P0: Provably Fair badge */}
        {serverSeedHash && (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>公平驗證</span>
            <span className="font-mono">{serverSeedHash.slice(0, 16)}...</span>
          </div>
        )}
      </div>

      {/* P2: Responsive bottom action bar — short text on mobile */}
      <div className="sticky bottom-16 bg-surface-deep/95 backdrop-blur-md border-t border-[var(--border)] -mx-4 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] mt-6 z-40 md:static md:bottom-auto md:bg-transparent md:backdrop-blur-none md:border-0 md:mx-0 md:px-0 md:py-0 md:mt-0 md:z-auto">
        <div className="flex gap-4 max-w-2xl mx-auto md:max-w-none items-center">
          <button
            onClick={handleConfirmDraw}
            disabled={selectedNumbers.length === 0 || isDrawing}
            className="flex-1 bg-amber-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-amber-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isDrawing
              ? '抽獎中...'
              : selectedNumbers.length === 0
                ? '請選擇號碼'
                : (
                  <>
                    {/* Desktop: full text */}
                    <span className="hidden sm:inline">
                      {priceBreakdown.savings > 0
                        ? `開始抽獎 (${selectedNumbers.length} 抽 = ${priceBreakdown.totalPrice.toLocaleString()} 點，省 ${priceBreakdown.savings.toLocaleString()})`
                        : `開始抽獎 (${selectedNumbers.length} 抽 = ${priceBreakdown.totalPrice.toLocaleString()} 點)`
                      }
                    </span>
                    {/* Mobile: short text */}
                    <span className="sm:hidden">
                      抽獎 {selectedNumbers.length} 抽 / {priceBreakdown.totalPrice.toLocaleString()} 點
                    </span>
                  </>
                )
            }
          </button>

          {selectedNumbers.length > 0 && !isDrawing && (
            <button
              onClick={() => setSelectedNumbers([])}
              className="bg-zinc-700 text-white font-medium py-4 px-6 rounded-xl hover:bg-zinc-600 transition-colors duration-200 flex-shrink-0"
            >
              <span className="hidden sm:inline">清除選擇</span>
              <span className="sm:hidden">清除</span>
            </button>
          )}

          {/* P3: Sound toggle */}
          <button
            onClick={() => setSoundEnabled(v => !v)}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-surface-3 text-zinc-400 hover:text-white transition-colors"
            title={soundEnabled ? '關閉音效' : '開啟音效'}
          >
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
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
}

interface LotterySystemProps {
  productId: number;
  productName?: string;
  productPrice: number;
  variants?: Variant[];
  totalTickets: number;
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
  productName,
  productPrice,
  variants,
  totalTickets
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

  useEffect(() => {
    setMounted(true);
    loadDrawnTickets();
    loadUserPoints();
  }, []);

  const loadDrawnTickets = async () => {
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
  };

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

  const handleNumberClick = (number: number) => {
    if (isDrawing || isNumberDrawn(number)) return;

    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
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

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    document.body.style.overflow = '';
  };

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

      // 更新用戶點數
      setUserPoints(data.newBalance);

      // 觸發 storage 事件，通知 Header 組件更新點數
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: data.newBalance.toString()
      }));

      // 準備結果數據
      const newResults: LotteryResult[] = data.results.map((r: { ticketNumber: number; variant: Variant }) => ({
        ticketNumber: r.ticketNumber,
        variant: r.variant
      }));

      setResults(newResults);

      // 快速連續翻牌動畫（每 300ms 翻一張）
      for (let i = 0; i < newResults.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setCurrentRevealIndex(i);
      }

      // 更新已抽號碼列表
      setDrawnTickets(prev => [...prev, ...newResults]);
      setSelectedNumbers([]);

      await new Promise(resolve => setTimeout(resolve, 1500));
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

  const handleCloseResults = () => {
    setResults([]);
    document.body.style.overflow = '';
    // 重新載入已抽號碼（確保同步）
    loadDrawnTickets();
  };

  const isNumberDrawn = (number: number) => {
    return drawnTickets.some(t => t.ticketNumber === number);
  };

  const isNumberSelected = (number: number) => selectedNumbers.includes(number);

  const getDrawnTicketVariant = (number: number): Variant | null => {
    const ticket = drawnTickets.find(t => t.ticketNumber === number);
    return ticket ? ticket.variant : null;
  };

  // 確認對話框 Portal
  const ConfirmDialogPortal = () => {
    if (!mounted || !showConfirmDialog) return null;

    const totalCost = productPrice * selectedNumbers.length;

    return createPortal(
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">確認開始抽獎？</h3>
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
                <span key={num} className="bg-gradient-to-br from-orange-500 to-pink-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
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
              className="flex-1 bg-slate-700 text-white font-medium py-3 px-6 rounded-xl hover:bg-slate-600 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStartDraw}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg"
            >
              確認抽獎
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 抽獎結果 Portal（與之前相同，省略重複代碼）
  const ResultsPortal = () => {
    if (!mounted || results.length === 0) return null;

    return createPortal(
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDrawing) {
            handleCloseResults();
          }
        }}
      >
        <div className="max-w-6xl w-full h-full max-h-[90vh] flex flex-col">
          <div className="text-center mb-4 flex-shrink-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
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
              {results.map((result, index) => (
                <div
                  key={result.ticketNumber}
                  className={`
                    relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300
                    ${index <= currentRevealIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}
                  `}
                >
                  <div className="relative w-full h-full">
                    <div
                      className={`
                        absolute inset-0 transition-transform duration-500 transform-style-3d
                        ${index <= currentRevealIndex ? 'rotate-y-180' : ''}
                      `}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center backface-hidden">
                        <div className="text-white text-6xl font-bold">
                          {result.ticketNumber}
                        </div>
                      </div>

                      <div className="absolute inset-0 rotate-y-180 backface-hidden bg-slate-800 flex flex-col">
                        <div className="relative flex-1">
                          {result.variant.imageUrl ? (
                            <Image
                              src={result.variant.imageUrl}
                              alt={result.variant.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                              <span className="text-slate-500 text-4xl">🎁</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-900 px-3 py-4 flex flex-col justify-center gap-1">
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
              ))}
            </div>
          </div>

          {!isDrawing && (
            <div className="text-center mt-4 flex-shrink-0">
              <button
                onClick={handleCloseResults}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg"
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
      <div className="text-center py-12">
        <div className="text-slate-400">載入中...</div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialogPortal />
      <ResultsPortal />

      {/* 用戶點數顯示 */}
      {isAuthenticated() && (
        <div className="mb-6 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl p-4 border border-orange-400/30">
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
          <h2 className="text-xl font-bold text-white">抽獎號碼池</h2>
          <div className="text-sm text-slate-400">
            已選擇 <span className="text-orange-400 font-bold">{selectedNumbers.length}</span> 個號碼
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
          {Array.from({ length: totalTickets }, (_, i) => i + 1).map(number => {
            const drawn = isNumberDrawn(number);
            const selected = isNumberSelected(number);
            const variant = drawn ? getDrawnTicketVariant(number) : null;

            return (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={drawn || isDrawing}
                className={`
                  aspect-square rounded-lg font-bold text-sm transition-all relative overflow-hidden
                  ${drawn
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : selected
                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white scale-110 shadow-lg'
                    : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-105'
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

      <div className="bg-transparent rounded-none p-0 border-0 shadow-none">
        <div className="flex gap-4">
          <button
            onClick={handleConfirmDraw}
            disabled={selectedNumbers.length === 0 || isDrawing}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isDrawing ? '抽獎中...' : `開始抽獎 (${selectedNumbers.length} 抽 = ${productPrice * selectedNumbers.length} 點)`}
          </button>

          {selectedNumbers.length > 0 && !isDrawing && (
            <button
              onClick={() => setSelectedNumbers([])}
              className="bg-slate-700 text-white font-medium py-4 px-6 rounded-xl hover:bg-slate-600 transition-colors"
            >
              清除選擇
            </button>
          )}
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Variant {
  id: number;
  prize: string;
  name: string;
  imageUrl: string | null;
  stock: number;
}

interface LotterySystemProps {
  variants: Variant[];
  totalTickets: number;
}

interface LotteryResult {
  ticketNumber: number;
  variant: Variant;
}

export default function LotterySystem({ variants, totalTickets }: LotterySystemProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);

  // 生成獎項分配（根據庫存隨機分配給號碼）
  const generatePrizeAllocation = () => {
    const allocation: { [key: number]: Variant } = {};
    const availableNumbers = Array.from({ length: totalTickets }, (_, i) => i + 1);

    // 隨機打亂號碼
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
    }

    let numberIndex = 0;
    variants.forEach(variant => {
      for (let i = 0; i < variant.stock; i++) {
        if (numberIndex < availableNumbers.length) {
          allocation[availableNumbers[numberIndex]] = variant;
          numberIndex++;
        }
      }
    });

    return allocation;
  };

  const [prizeAllocation] = useState(() => generatePrizeAllocation());

  const handleNumberClick = (number: number) => {
    if (isDrawing || drawnNumbers.includes(number)) return;

    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };

  const handleStartDraw = async () => {
    if (selectedNumbers.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setResults([]);
    setCurrentRevealIndex(-1);

    const newResults: LotteryResult[] = selectedNumbers.map(num => ({
      ticketNumber: num,
      variant: prizeAllocation[num],
    }));

    setResults(newResults);

    // 逐個翻牌動畫
    for (let i = 0; i < newResults.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentRevealIndex(i);
    }

    // 標記為已抽出
    setDrawnNumbers(prev => [...prev, ...selectedNumbers]);
    setSelectedNumbers([]);

    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDrawing(false);
  };

  const isNumberDrawn = (number: number) => drawnNumbers.includes(number);
  const isNumberSelected = (number: number) => selectedNumbers.includes(number);

  return (
    <div className="space-y-8">
      {/* 抽獎結果動畫 */}
      {results.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((result, index) => (
                <div
                  key={result.ticketNumber}
                  className={`
                    relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-500
                    ${index <= currentRevealIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
                  `}
                >
                  <div className="relative w-full h-full">
                    {/* 翻牌動畫 */}
                    <div
                      className={`
                        absolute inset-0 transition-transform duration-700 transform-style-3d
                        ${index <= currentRevealIndex ? 'rotate-y-180' : ''}
                      `}
                    >
                      {/* 背面 - 號碼 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center backface-hidden">
                        <div className="text-white text-6xl font-bold">
                          {result.ticketNumber}
                        </div>
                      </div>

                      {/* 正面 - 獎項 */}
                      <div className="absolute inset-0 rotate-y-180 backface-hidden bg-slate-800">
                        <div className="relative h-3/4">
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
                        <div className="h-1/4 bg-slate-900 p-3 flex flex-col justify-center">
                          <p className="text-orange-400 font-bold text-center text-sm">
                            {result.ticketNumber} - {result.variant.prize}
                          </p>
                          <p className="text-white text-center text-xs truncate">
                            {result.variant.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isDrawing && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setResults([])}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-pink-600 transition-all"
                >
                  關閉
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 號碼格子區域 */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">抽獎號碼池</h2>
          <div className="text-sm text-slate-400">
            已選擇 <span className="text-orange-400 font-bold">{selectedNumbers.length}</span> 個號碼
          </div>
        </div>

        {/* 號碼格子 */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 mb-6">
          {Array.from({ length: totalTickets }, (_, i) => i + 1).map(number => {
            const drawn = isNumberDrawn(number);
            const selected = isNumberSelected(number);

            return (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={drawn || isDrawing}
                className={`
                  aspect-square rounded-lg font-bold text-sm transition-all
                  ${drawn
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                    : selected
                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white scale-110 shadow-lg'
                    : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-105'
                  }
                `}
              >
                {number}
              </button>
            );
          })}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <button
            onClick={handleStartDraw}
            disabled={selectedNumbers.length === 0 || isDrawing}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isDrawing ? '抽獎中...' : `開始抽獎 (${selectedNumbers.length} 抽)`}
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
    </div>
  );
}

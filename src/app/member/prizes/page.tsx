'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Image from 'next/image';

interface PrizeVariant {
  id: number;
  prize: string;
  name: string;
  rarity: string | null;
  value: number;
  imageUrl: string | null;
  isLastPrize: boolean;
}

interface PrizeProduct {
  id: number;
  name: string;
  slug: string;
  coverImage: string | null;
  series: {
    id: number;
    name: string;
    brand: {
      id: number;
      name: string;
    };
  };
}

interface Prize {
  id: number;
  ticketNumber: number;
  createdAt: string;
  product: PrizeProduct;
  variant: PrizeVariant;
  isLastPrize: boolean;
  triggeredPity: boolean;
}

interface PrizesResponse {
  prizes: Prize[];
  totalValue: number;
  count: number;
}

export default function PrizesPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [redeemingAll, setRedeemingAll] = useState(false);

  const loadPrizes = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/prizes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load prizes');
      }

      const data: PrizesResponse = await response.json();
      setPrizes(data.prizes);
      setTotalValue(data.totalValue);
    } catch (error) {
      console.error('Load prizes error:', error);
      alert('載入獎品失敗：' + (error as Error).message);
      if ((error as Error).message.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadPrizes();
  }, [router, loadPrizes]);

  const handleRedeem = async (prizeId: number) => {
    if (!confirm('確定要將此獎品兌換成點數嗎？兌換後無法撤銷。')) {
      return;
    }

    setRedeeming(prizeId);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/prizes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lotteryDrawId: prizeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to redeem prize');
      }

      const data = await response.json();

      alert(
        `兌換成功！\n\n` +
        `獲得點數：${data.pointsReceived.toLocaleString()}\n` +
        `新點數餘額：${data.newBalance.toLocaleString()}`
      );

      // 觸發 storage 事件，通知 Header 組件更新點數
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: data.newBalance.toString()
      }));

      // 重新載入獎品列表
      await loadPrizes();
    } catch (error) {
      console.error('Redeem error:', error);
      alert('兌換失敗：' + (error as Error).message);
    } finally {
      setRedeeming(null);
    }
  };

  const handleRedeemAll = async () => {
    if (prizes.length === 0) {
      alert('沒有可兌換的獎品');
      return;
    }

    if (!confirm(`確定要將所有 ${prizes.length} 個獎品兌換成點數嗎？\n總價值：${totalValue.toLocaleString()} 點\n\n兌換後無法撤銷。`)) {
      return;
    }

    setRedeemingAll(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/prizes/redeem-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to redeem prizes');
      }

      const data = await response.json();

      alert(
        `批量兌換成功！\n\n` +
        `兌換數量：${data.count} 個獎品\n` +
        `獲得點數：${data.totalPoints.toLocaleString()}\n` +
        `新點數餘額：${data.newBalance.toLocaleString()}`
      );

      // 觸發 storage 事件，通知 Header 組件更新點數
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: data.newBalance.toString()
      }));

      // 重新載入獎品列表
      await loadPrizes();
    } catch (error) {
      console.error('Redeem all error:', error);
      alert('批量兌換失敗：' + (error as Error).message);
    } finally {
      setRedeemingAll(false);
    }
  };

  const getRarityColor = (rarity: string | null) => {
    switch (rarity?.toUpperCase()) {
      case 'SSR':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'SR':
        return 'text-purple-400 bg-purple-400/10 border-white/10';
      case 'R':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'N':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">我的獎品包包</h1>
          <p className="text-slate-400">管理您抽中的所有獎品</p>
        </div>

        {/* 統計資訊 */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-orange-500/12 rounded-3xl p-6 backdrop-blur-sm border border-orange-500/20 shadow-2xl">
            <p className="text-slate-300 text-sm mb-2">獎品總數</p>
            <p className="text-4xl font-black text-orange-400">{prizes.length}</p>
          </div>
          <div className="bg-slate-700/50 rounded-3xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl">
            <p className="text-slate-300 text-sm mb-2">總價值</p>
            <p className="text-4xl font-black text-purple-400">{totalValue.toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-1">可兌換點數</p>
          </div>
        </div>

        {/* 一鍵兌換按鈕 */}
        {prizes.length > 0 && (
          <div className="mb-8 text-center">
            <button
              onClick={handleRedeemAll}
              disabled={redeemingAll}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {redeemingAll ? '兌換中...' : `一鍵兌換全部 (${totalValue.toLocaleString()} 點)`}
            </button>
            <p className="text-slate-400 text-sm mt-2">將所有獎品轉換為點數</p>
          </div>
        )}

        {/* 獎品列表 */}
        {prizes.length === 0 ? (
          <div className="bg-slate-800/30 rounded-3xl p-12 backdrop-blur-sm border border-slate-700/50 text-center">
            <div className="text-slate-400 text-lg mb-4">
              <svg className="w-24 h-24 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              目前沒有任何獎品
            </div>
            <p className="text-slate-500 mb-6">快去抽獎贏取精美獎品吧！</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              前往抽獎
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border border-slate-700/50 hover:border-orange-400/50 transition-all"
              >
                {/* 獎品圖片 */}
                <div className="relative w-full aspect-square mb-4 rounded-2xl overflow-hidden bg-slate-700/30">
                  {prize.variant.imageUrl || prize.product.coverImage ? (
                    <Image
                      src={prize.variant.imageUrl || prize.product.coverImage || '/placeholder.jpg'}
                      alt={prize.variant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}

                  {/* 稀有度標籤 */}
                  {prize.variant.rarity && (
                    <div className="absolute top-2 left-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRarityColor(prize.variant.rarity)}`}>
                        {prize.variant.rarity}
                      </div>
                    </div>
                  )}

                  {/* Last 賞標籤 */}
                  {prize.isLastPrize && (
                    <div className="absolute top-2 right-2">
                      <div className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg">
                        Last賞
                      </div>
                    </div>
                  )}
                </div>

                {/* 獎項資訊 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-400 font-bold text-lg">{prize.variant.prize}</span>
                    <span className="text-slate-400 text-sm">#{prize.ticketNumber}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{prize.variant.name}</h3>
                  <p className="text-slate-400 text-sm mb-1">{prize.product.name}</p>
                  <p className="text-slate-500 text-xs">
                    {prize.product.series.brand.name} · {prize.product.series.name}
                  </p>
                </div>

                {/* 價值與抽中時間 */}
                <div className="mb-4 p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">價值</span>
                    <span className="text-green-400 font-bold">{prize.variant.value.toLocaleString()} 點</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">抽中時間</span>
                    <span className="text-slate-500">
                      {new Date(prize.createdAt).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                </div>

                {/* 兌換按鈕 */}
                <button
                  onClick={() => handleRedeem(prize.id)}
                  disabled={redeeming === prize.id}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {redeeming === prize.id ? '兌換中...' : '兌換成點數'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 說明區塊 */}
        <div className="mt-8 bg-slate-800/30 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            兌換說明
          </h3>
          <div className="space-y-3 text-slate-300">
            <p>• 獎品可兌換成等值點數，用於再次抽獎</p>
            <p>• 兌換後獎品將從包包中移除，無法撤銷</p>
            <p>• 使用「一鍵兌換全部」可快速兌換所有獎品</p>
            <p>• 兌換獲得的點數即時入帳</p>
            <p>• 建議保留珍貴的 SSR 和 Last 賞作為收藏</p>
          </div>
        </div>

        {/* 返回按鈕 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}

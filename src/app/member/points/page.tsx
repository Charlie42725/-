'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

interface PointPackage {
  id: number;
  name: string;
  points: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const pointPackages: PointPackage[] = [
  { id: 1, name: '入門方案', points: 100, price: 100, bonus: 0 },
  { id: 2, name: '基礎方案', points: 500, price: 500, bonus: 50 },
  { id: 3, name: '熱門方案', points: 1000, price: 1000, bonus: 150, popular: true },
  { id: 4, name: '超值方案', points: 2000, price: 2000, bonus: 400 },
  { id: 5, name: '豪華方案', points: 5000, price: 5000, bonus: 1200 },
  { id: 6, name: '至尊方案', points: 10000, price: 10000, bonus: 3000 },
];

interface User {
  id: number;
  email: string;
  nickname: string;
}

export default function PointsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 檢查登入狀態
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
    }
  }, [router]);

  const handlePurchase = async (pkg: PointPackage) => {
    setSelectedPackage(pkg);
    setLoading(true);

    try {
      // TODO: 實作付款流程 API
      // const response = await fetch('/api/payment/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ packageId: pkg.id }),
      // });

      // 暫時模擬
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`即將前往付款頁面\n\n購買方案：${pkg.name}\n點數：${pkg.points + pkg.bonus}\n金額：NT$ ${pkg.price}`);
    } catch (error) {
      alert('處理失敗，請稍後再試');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  if (!user) {
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
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">點數購買</h1>
          <p className="text-slate-400">選擇適合您的點數方案</p>
        </div>

        {/* 目前點數餘額 */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-3xl p-8 backdrop-blur-sm border border-orange-400/30 shadow-2xl text-center">
            <p className="text-slate-300 text-lg mb-2">目前點數餘額</p>
            <p className="text-5xl font-black text-orange-400">1,250</p>
            <p className="text-slate-400 text-sm mt-2">點數可用於抽獎及兌換優惠</p>
          </div>
        </div>

        {/* 點數方案 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {pointPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-slate-800/50 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border ${
                pkg.popular
                  ? 'border-orange-400 shadow-xl shadow-orange-400/20'
                  : 'border-slate-700/50'
              } hover:border-orange-400/50 transition-all hover:scale-105`}
            >
              {/* 熱門標籤 */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    🔥 最熱門
                  </div>
                </div>
              )}

              {/* 方案名稱 */}
              <h3 className="text-2xl font-bold text-white mb-4 text-center">{pkg.name}</h3>

              {/* 點數資訊 */}
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-orange-400 mb-2">
                  {pkg.points.toLocaleString()}
                </div>
                <div className="text-slate-300 text-sm">基礎點數</div>

                {pkg.bonus > 0 && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                    <div className="text-green-400 font-bold text-lg">
                      + {pkg.bonus.toLocaleString()} 贈點
                    </div>
                    <div className="text-slate-400 text-xs">
                      總共獲得 {(pkg.points + pkg.bonus).toLocaleString()} 點
                    </div>
                  </div>
                )}
              </div>

              {/* 價格 */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white">
                  NT$ {pkg.price.toLocaleString()}
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-green-400 text-sm mt-1">
                    省下 NT$ {pkg.bonus}
                  </div>
                )}
              </div>

              {/* 購買按鈕 */}
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={loading && selectedPackage?.id === pkg.id}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {loading && selectedPackage?.id === pkg.id ? '處理中...' : '立即購買'}
              </button>
            </div>
          ))}
        </div>

        {/* 說明區塊 */}
        <div className="bg-slate-800/30 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            購買說明
          </h3>
          <div className="space-y-3 text-slate-300">
            <p>• 點數可用於一番賞抽獎，每次抽獎消耗對應點數</p>
            <p>• 購買後點數即時入帳，永久有效</p>
            <p>• 贈送的點數與購買點數效力相同</p>
            <p>• 支援多種付款方式：信用卡、ATM 轉帳、超商代碼</p>
            <p>• 如有任何問題，請聯絡客服</p>
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

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'mock';

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

interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  points: number;
}

export default function PointsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [ecpayFormData, setEcpayFormData] = useState<{ formData: Record<string, string>; checkoutUrl: string } | null>(null);
  const ecpayFormRef = useRef<HTMLFormElement>(null);

  const loadUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Load profile error:', error);
      alert('載入用戶資料失敗：' + (error as Error).message);
      // 如果是認證錯誤，導向登入頁
      if ((error as Error).message.includes('登入')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // 檢查登入狀態
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadUserProfile();
  }, [router, loadUserProfile]);

  // ECPay 表單自動提交
  useEffect(() => {
    if (ecpayFormData && ecpayFormRef.current) {
      ecpayFormRef.current.submit();
    }
  }, [ecpayFormData]);

  const handlePurchase = async (pkg: PointPackage) => {
    setSelectedPackage(pkg);
    setPurchasing(true);

    try {
      const token = localStorage.getItem('auth_token');

      // 1. 創建訂單
      const createOrderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (!createOrderResponse.ok) {
        throw new Error('訂單創建失敗');
      }

      const { order } = await createOrderResponse.json();

      if (PAYMENT_MODE === 'ecpay') {
        // ECPay 綠界金流
        const ecpayResponse = await fetch('/api/payment/ecpay/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ orderNumber: order.orderNumber }),
        });

        if (!ecpayResponse.ok) {
          throw new Error('建立付款失敗');
        }

        const ecpayResult = await ecpayResponse.json();
        // 設定表單資料，useEffect 會自動提交
        setEcpayFormData(ecpayResult);
        return; // 不要 reset purchasing 狀態，讓使用者知道正在跳轉
      }

      // Mock 模式 — 保留現有邏輯
      const paymentResponse = await fetch('/api/payment/newebpay-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          amount: order.amount
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('付款失敗');
      }

      const paymentResult = await paymentResponse.json();

      alert(
        `付款成功！\n\n` +
        `訂單編號：${order.orderNumber}\n` +
        `購買方案：${pkg.name}\n` +
        `基礎點數：${pkg.points.toLocaleString()}\n` +
        `贈送點數：${pkg.bonus.toLocaleString()}\n` +
        `總點數：${(pkg.points + pkg.bonus).toLocaleString()}\n` +
        `支付金額：NT$ ${pkg.price.toLocaleString()}\n\n` +
        `新點數餘額：${paymentResult.newBalance.toLocaleString()}`
      );

      await loadUserProfile();

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'points_updated',
        newValue: paymentResult.newBalance.toString()
      }));

    } catch (error) {
      console.error('Purchase error:', error);
      alert('購買失敗，請稍後再試');
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-xl">無法載入用戶資料</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-5 md:mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">點數購買</h1>
          <p className="text-zinc-500 text-sm md:text-base">選擇適合您的點數方案</p>
        </div>

        {/* 目前點數餘額 */}
        <div className="mb-5 md:mb-8">
          <div className="bg-amber-500/10 rounded-2xl md:rounded-3xl p-5 md:p-8 backdrop-blur-sm border border-amber-500/18 shadow-2xl text-center">
            <p className="text-zinc-300 text-sm md:text-lg mb-1 md:mb-2">目前點數餘額</p>
            <p className="text-4xl md:text-5xl font-black text-amber-400">{user.points.toLocaleString()}</p>
            <p className="text-zinc-500 text-xs md:text-sm mt-1 md:mt-2">點數可用於抽獎及兌換優惠</p>
          </div>
        </div>

        {/* 點數方案 */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-5 md:mb-8">
          {pointPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-surface-1/50 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 backdrop-blur-sm border ${
                pkg.popular
                  ? 'border-amber-400 shadow-xl shadow-amber-400/20'
                  : 'border-[var(--border)]'
              } hover:border-amber-400/50 transition-all`}
            >
              {/* 熱門標籤 */}
              {pkg.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <div className="bg-amber-500 text-white px-3 py-0.5 rounded-full text-xs md:text-sm font-bold shadow-lg whitespace-nowrap">
                    最熱門
                  </div>
                </div>
              )}

              {/* 方案名稱 */}
              <h3 className="text-base md:text-2xl font-bold text-white mb-2 md:mb-4 text-center">{pkg.name}</h3>

              {/* 點數資訊 */}
              <div className="text-center mb-3 md:mb-6">
                <div className="text-2xl md:text-4xl font-black text-amber-400 mb-1 md:mb-2">
                  {pkg.points.toLocaleString()}
                </div>
                <div className="text-zinc-300 text-xs md:text-sm">基礎點數</div>

                {pkg.bonus > 0 && (
                  <div className="mt-2 md:mt-4 p-2 md:p-3 bg-green-500/10 rounded-lg md:rounded-xl border border-green-500/30">
                    <div className="text-green-400 font-bold text-sm md:text-lg">
                      +{pkg.bonus.toLocaleString()} 贈點
                    </div>
                    <div className="text-zinc-500 text-[10px] md:text-xs">
                      共 {(pkg.points + pkg.bonus).toLocaleString()} 點
                    </div>
                  </div>
                )}
              </div>

              {/* 價格 */}
              <div className="text-center mb-3 md:mb-6">
                <div className="text-xl md:text-3xl font-bold text-white">
                  NT$ {pkg.price.toLocaleString()}
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-green-400 text-xs md:text-sm mt-0.5 md:mt-1">
                    省下 NT$ {pkg.bonus}
                  </div>
                )}
              </div>

              {/* 購買按鈕 */}
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing && selectedPackage?.id === pkg.id}
                className={`w-full font-bold py-2.5 md:py-4 px-3 md:px-6 text-sm md:text-base rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  pkg.popular
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-surface-3 hover:bg-surface-3/80 text-white'
                }`}
              >
                {purchasing && selectedPackage?.id === pkg.id ? '處理中...' : '立即購買'}
              </button>
            </div>
          ))}
        </div>

        {/* 說明區塊 */}
        <div className="bg-surface-1/30 rounded-2xl md:rounded-3xl p-4 md:p-8 backdrop-blur-sm border border-[var(--border)]">
          <h3 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center">
            <svg className="w-4 h-4 md:w-6 md:h-6 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            購買說明
          </h3>
          <div className="space-y-2 md:space-y-3 text-zinc-300 text-xs md:text-base">
            <p>• 點數可用於一番賞抽獎，每次抽獎消耗對應點數</p>
            <p>• 購買後點數即時入帳，永久有效</p>
            <p>• 贈送的點數與購買點數效力相同</p>
            <p>• 測試帳號可直接購買，無需實際付款</p>
            <p>• 如有任何問題，請聯絡客服</p>
          </div>
        </div>

        {/* 返回按鈕 */}
        <div className="mt-5 md:mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 md:px-8 md:py-3 bg-zinc-700 text-white text-sm md:text-base font-medium rounded-xl hover:bg-zinc-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>

      {/* ECPay 隱藏表單 */}
      {ecpayFormData && (
        <form
          ref={ecpayFormRef}
          method="POST"
          action={ecpayFormData.checkoutUrl}
          style={{ display: 'none' }}
        >
          {Object.entries(ecpayFormData.formData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}

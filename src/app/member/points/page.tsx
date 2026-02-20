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
  const [confirmPackage, setConfirmPackage] = useState<PointPackage | null>(null); // 確認彈窗
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

  // 第一步：打開確認彈窗
  const handleSelectPackage = (pkg: PointPackage) => {
    if (purchasing) return;
    setConfirmPackage(pkg);
  };

  // 第二步：確認後真正購買
  const handleConfirmPurchase = async () => {
    const pkg = confirmPackage;
    if (!pkg) return;

    setConfirmPackage(null); // 關閉彈窗
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
    <div className="min-h-screen bg-background text-white py-4 md:py-10 px-3 md:px-4">
      <div className="max-w-3xl mx-auto">
        {/* 餘額 */}
        <div className="flex items-center justify-between mb-5 md:mb-8 px-1">
          <h1 className="text-xl md:text-3xl font-bold">點數購買</h1>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            <span className="text-amber-400 font-black text-xl md:text-2xl">{user.points.toLocaleString()}</span>
            <span className="text-zinc-500 text-sm">點</span>
          </div>
        </div>

        {/* 方案列表 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 mb-6 md:mb-8">
          {pointPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg)}
              disabled={purchasing}
              className={`relative text-left rounded-xl md:rounded-2xl p-3.5 md:p-5 border transition-all disabled:opacity-50 ${
                pkg.popular
                  ? 'border-amber-400/60 bg-amber-500/8'
                  : 'border-[var(--border)] bg-surface-1/40 hover:border-zinc-600'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 right-3 bg-amber-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full">
                  熱門
                </span>
              )}

              {/* 點數 */}
              <div className="text-amber-400 font-black text-xl md:text-3xl leading-tight">
                {(pkg.points + pkg.bonus).toLocaleString()}
              </div>
              <div className="text-zinc-500 text-[11px] md:text-sm mt-0.5">
                {pkg.bonus > 0 ? (
                  <span>含 <span className="text-green-400">+{pkg.bonus.toLocaleString()}</span> 贈點</span>
                ) : (
                  '點數'
                )}
              </div>

              {/* 價格 */}
              <div className="mt-2.5 md:mt-4 pt-2.5 md:pt-3 border-t border-white/8">
                <span className="text-white font-bold text-base md:text-xl">NT$ {pkg.price.toLocaleString()}</span>
              </div>

              {/* 處理中指示 */}
              {purchasing && selectedPackage?.id === pkg.id && (
                <div className="absolute inset-0 bg-black/50 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 說明 */}
        <p className="text-zinc-600 text-xs md:text-sm text-center leading-relaxed">
          購買後點數即時入帳，可用於一番賞抽獎。如有問題請聯絡客服。
        </p>
      </div>

      {/* 確認購買彈窗 */}
      {confirmPackage && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmPackage(null)}
          />
          <div className="relative bg-zinc-900 w-full md:w-auto md:min-w-[360px] md:max-w-sm rounded-t-2xl md:rounded-2xl p-5 md:p-6 border-t md:border border-zinc-700/80 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4 md:hidden" />

            <h3 className="text-lg font-bold text-white mb-4">確認購買</h3>

            <div className="space-y-2.5 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">{confirmPackage.name}</span>
                <span className="text-amber-400 font-bold">
                  {(confirmPackage.points + confirmPackage.bonus).toLocaleString()} 點
                </span>
              </div>
              {confirmPackage.bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-xs">含贈點</span>
                  <span className="text-green-400 text-xs">+{confirmPackage.bonus.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center">
                <span className="text-zinc-400">支付金額</span>
                <span className="text-white font-black text-lg">NT$ {confirmPackage.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmPackage(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-[1.5] py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
              >
                確認付款
              </button>
            </div>
          </div>
        </div>
      )}

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

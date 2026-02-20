'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

type PaymentStatus = 'processing' | 'success' | 'failed';

interface OrderInfo {
  orderNumber: string;
  packageName: string;
  totalPoints: number;
  amount: number;
  status: string;
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('orderNumber');

  const [status, setStatus] = useState<PaymentStatus>('processing');
  const [order, setOrder] = useState<OrderInfo | null>(null);

  const pollOrderStatus = useCallback(async () => {
    if (!orderNumber) return;

    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/orders?limit=1&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const found = data.orders?.find(
        (o: OrderInfo) => o.orderNumber === orderNumber
      );

      if (!found) return;

      setOrder(found);

      if (found.status === 'completed' || found.status === 'paid') {
        setStatus('success');
        // 通知其他組件更新點數
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'points_updated',
            newValue: Date.now().toString(),
          })
        );
        return true; // 停止 polling
      }

      if (found.status === 'failed' || found.status === 'cancelled') {
        setStatus('failed');
        return true; // 停止 polling
      }
    } catch (err) {
      console.error('Poll order status error:', err);
    }
    return false;
  }, [orderNumber]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (!orderNumber) {
      setStatus('failed');
      return;
    }

    let stopped = false;
    let attempts = 0;
    const maxAttempts = 12; // 12 次 × 5 秒 = 60 秒

    const poll = async () => {
      if (stopped) return;

      const done = await pollOrderStatus();
      attempts++;

      if (!done && attempts < maxAttempts && !stopped) {
        setTimeout(poll, 5000);
      } else if (!done && attempts >= maxAttempts) {
        setStatus('failed');
      }
    };

    poll();

    return () => {
      stopped = true;
    };
  }, [orderNumber, router, pollOrderStatus]);

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 處理中 */}
        {status === 'processing' && (
          <div className="bg-surface-1/50 rounded-3xl p-8 backdrop-blur-sm border border-[var(--border)] text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">付款處理中</h2>
            <p className="text-zinc-400 mb-4">
              正在確認您的付款，請稍候...
            </p>
            <p className="text-zinc-500 text-sm">
              訂單編號：{orderNumber}
            </p>
          </div>
        )}

        {/* 成功 */}
        {status === 'success' && order && (
          <div className="bg-surface-1/50 rounded-3xl p-8 backdrop-blur-sm border border-green-500/30 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-4">付款成功</h2>
            <div className="space-y-2 text-left bg-surface-2/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400">訂單編號</span>
                <span className="text-white font-mono text-sm">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">方案</span>
                <span className="text-white">{order.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">獲得點數</span>
                <span className="text-amber-400 font-bold">
                  {order.totalPoints.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">支付金額</span>
                <span className="text-white">NT$ {order.amount.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/member/points')}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                返回點數頁
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-surface-3 hover:bg-surface-3/80 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                回到首頁
              </button>
            </div>
          </div>
        )}

        {/* 失敗 */}
        {status === 'failed' && (
          <div className="bg-surface-1/50 rounded-3xl p-8 backdrop-blur-sm border border-red-500/30 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">付款失敗</h2>
            <p className="text-zinc-400 mb-6">
              {orderNumber
                ? '付款未完成或處理逾時，請重新嘗試。'
                : '缺少訂單資訊。'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/member/points')}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                重新購買
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-surface-3 hover:bg-surface-3/80 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                回到首頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}

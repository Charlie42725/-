'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

interface Order {
  id: number;
  orderNumber: string;
  packageName: string;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'failed';
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusText: Record<Order['status'], string> = {
  pending: '待付款',
  paid: '已付款',
  completed: '已完成',
  cancelled: '已取消',
  failed: '失敗',
};

const statusColor: Record<Order['status'], string> = {
  pending: 'bg-yellow-500',
  paid: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-zinc-500',
  failed: 'bg-red-500',
};

interface User {
  id: number;
  email: string;
  nickname: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
    }

    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load orders');

      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      alert('載入訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">訂單紀錄</h1>
          <p className="text-zinc-500 text-sm md:text-base">查看您的點數購買紀錄</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-zinc-500">載入中...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-surface-1/30 rounded-2xl md:rounded-3xl p-8 md:p-12 text-center backdrop-blur-sm border border-[var(--border)]">
            <div className="text-5xl md:text-6xl mb-4">📦</div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">尚無訂單紀錄</h3>
            <p className="text-zinc-500 text-sm md:text-base mb-6">快去購買點數吧！</p>
            <button
              onClick={() => router.push('/member/points')}
              className="bg-amber-500 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-xl hover:bg-amber-600 transition-all shadow-lg text-sm md:text-base"
            >
              前往購買點數
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-surface-1/50 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 backdrop-blur-sm border border-[var(--border)] hover:border-amber-400/50 transition-all"
              >
                {/* 訂單標題列：手機上單行顯示訂單號+狀態+按鈕 */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-[var(--border)]">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm md:text-xl font-bold text-white truncate">
                        {order.orderNumber}
                      </h3>
                      <span className={`${statusColor[order.status]} text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap flex-shrink-0`}>
                        {statusText[order.status]}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs md:text-sm">{formatDate(order.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="text-amber-400 hover:text-amber-300 transition-colors text-xs md:text-sm font-medium flex-shrink-0 mt-0.5"
                  >
                    {selectedOrder?.id === order.id ? '收起 ▲' : '詳情 ▼'}
                  </button>
                </div>

                {/* 訂單基本資訊：手機 2 欄 / 桌面 3 欄 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-surface-2/50 rounded-xl md:rounded-2xl p-3 md:p-4">
                    <p className="text-zinc-500 text-[10px] md:text-sm mb-0.5 md:mb-1">方案名稱</p>
                    <p className="text-white font-bold text-sm md:text-base">{order.packageName}</p>
                  </div>
                  <div className="bg-surface-2/50 rounded-xl md:rounded-2xl p-3 md:p-4">
                    <p className="text-zinc-500 text-[10px] md:text-sm mb-0.5 md:mb-1">獲得點數</p>
                    <p className="text-amber-400 font-bold text-base md:text-lg">
                      {order.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-zinc-500 text-[10px] md:text-xs leading-snug">
                      基礎 {order.basePoints.toLocaleString()} + 贈 {order.bonusPoints.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-surface-2/50 rounded-xl md:rounded-2xl p-3 md:p-4 col-span-2 md:col-span-1">
                    <p className="text-zinc-500 text-[10px] md:text-sm mb-0.5 md:mb-1">支付金額</p>
                    <p className="text-white font-bold text-base md:text-lg">
                      NT$ {order.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 展開的詳細資訊 */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[var(--border)]">
                    <h4 className="text-sm md:text-lg font-bold text-white mb-3 md:mb-4">訂單時間軸</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="text-white font-medium text-sm md:text-base">訂單建立</p>
                          <p className="text-zinc-500 text-xs md:text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      {order.paidAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div>
                            <p className="text-white font-medium text-sm md:text-base">完成付款</p>
                            <p className="text-zinc-500 text-xs md:text-sm">{formatDate(order.paidAt)}</p>
                            {order.paymentMethod && (
                              <p className="text-zinc-500 text-xs">付款方式：{order.paymentMethod}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {order.status === 'completed' && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div>
                            <p className="text-white font-medium text-sm md:text-base">訂單完成</p>
                            <p className="text-zinc-500 text-xs md:text-sm">{formatDate(order.updatedAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 返回按鈕 */}
        <div className="mt-6 md:mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 md:px-8 md:py-3 bg-zinc-700 text-white text-sm md:text-base font-medium rounded-xl hover:bg-zinc-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}

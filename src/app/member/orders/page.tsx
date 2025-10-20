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
  cancelled: 'bg-gray-500',
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
    // 檢查登入狀態
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">訂單紀錄</h1>
          <p className="text-slate-400">查看您的點數購買紀錄</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-slate-400">載入中...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-800/30 rounded-3xl p-12 text-center backdrop-blur-sm border border-slate-700/50">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">尚無訂單紀錄</h3>
            <p className="text-slate-400 mb-6">快去購買點數吧！</p>
            <button
              onClick={() => router.push('/member/points')}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg"
            >
              前往購買點數
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-800/50 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50 hover:border-orange-400/50 transition-all"
              >
                {/* 訂單標題列 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-700">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{order.orderNumber}</h3>
                      <span className={`${statusColor[order.status]} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                        {statusText[order.status]}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{formatDate(order.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium"
                  >
                    {selectedOrder?.id === order.id ? '收起詳情 ▲' : '查看詳情 ▼'}
                  </button>
                </div>

                {/* 訂單基本資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-2xl p-4">
                    <p className="text-slate-400 text-sm mb-1">方案名稱</p>
                    <p className="text-white font-bold">{order.packageName}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-2xl p-4">
                    <p className="text-slate-400 text-sm mb-1">獲得點數</p>
                    <p className="text-orange-400 font-bold text-lg">
                      {order.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-xs">
                      基礎 {order.basePoints.toLocaleString()} + 贈送 {order.bonusPoints.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-2xl p-4">
                    <p className="text-slate-400 text-sm mb-1">支付金額</p>
                    <p className="text-white font-bold text-lg">
                      NT$ {order.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 展開的詳細資訊 */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h4 className="text-lg font-bold text-white mb-4">訂單時間軸</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-white font-medium">訂單建立</p>
                          <p className="text-slate-400 text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      {order.paidAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-white font-medium">完成付款</p>
                            <p className="text-slate-400 text-sm">{formatDate(order.paidAt)}</p>
                            {order.paymentMethod && (
                              <p className="text-slate-500 text-xs">付款方式: {order.paymentMethod}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {order.status === 'completed' && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-white font-medium">訂單完成</p>
                            <p className="text-slate-400 text-sm">{formatDate(order.updatedAt)}</p>
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

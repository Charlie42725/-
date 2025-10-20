'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

interface OrderItem {
  id: number;
  productName: string;
  productImage: string;
  variantName: string;
  prize: string;
  ticketNumber: number;
}

interface Order {
  id: number;
  orderNumber: string;
  productName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
}

// 模擬訂單資料
const mockOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'ORD20250121001',
    productName: '原神 Ver.3 一番賞',
    items: [
      {
        id: 1,
        productName: '原神 Ver.3 一番賞',
        productImage: 'https://picsum.photos/200/200?random=1',
        variantName: '雷電將軍 特等獎公仔',
        prize: 'A賞',
        ticketNumber: 42,
      },
      {
        id: 2,
        productName: '原神 Ver.3 一番賞',
        productImage: 'https://picsum.photos/200/200?random=2',
        variantName: '限定海報套組',
        prize: 'C賞',
        ticketNumber: 89,
      },
    ],
    totalAmount: 0,
    status: 'completed',
    createdAt: '2025-01-15 14:30:00',
    paidAt: '2025-01-15 14:30:00',
    shippedAt: '2025-01-16 10:00:00',
    completedAt: '2025-01-18 15:20:00',
  },
  {
    id: 2,
    orderNumber: 'ORD20250121002',
    productName: 'ONE PIECE 劇場版系列',
    items: [
      {
        id: 3,
        productName: 'ONE PIECE 劇場版系列',
        productImage: 'https://picsum.photos/200/200?random=3',
        variantName: '魯夫 特別版公仔',
        prize: 'A賞',
        ticketNumber: 15,
      },
    ],
    totalAmount: 0,
    status: 'shipped',
    createdAt: '2025-01-20 10:15:00',
    paidAt: '2025-01-20 10:15:00',
    shippedAt: '2025-01-21 09:00:00',
  },
  {
    id: 3,
    orderNumber: 'ORD20250121003',
    productName: '咒術迴戰 渋谷事變',
    items: [
      {
        id: 4,
        productName: '咒術迴戰 渋谷事變',
        productImage: 'https://picsum.photos/200/200?random=4',
        variantName: '五條悟 限定版',
        prize: 'Last賞',
        ticketNumber: 100,
      },
    ],
    totalAmount: 0,
    status: 'paid',
    createdAt: '2025-01-21 16:45:00',
    paidAt: '2025-01-21 16:45:00',
  },
];

const statusText: Record<Order['status'], string> = {
  pending: '待付款',
  paid: '待出貨',
  shipped: '已出貨',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<Order['status'], string> = {
  pending: 'bg-yellow-500',
  paid: 'bg-blue-500',
  shipped: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
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

    // 載入訂單資料
    const loadOrders = async () => {
      try {
        // TODO: 實作 API 載入訂單
        // const response = await fetch('/api/member/orders');
        // const data = await response.json();
        // setOrders(data.orders);

        // 暫時使用模擬資料
        await new Promise(resolve => setTimeout(resolve, 500));
        setOrders(mockOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

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
          <p className="text-slate-400">查看您的抽獎紀錄與配送狀態</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-slate-400">載入中...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-800/30 rounded-3xl p-12 text-center backdrop-blur-sm border border-slate-700/50">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">尚無訂單紀錄</h3>
            <p className="text-slate-400 mb-6">快去參加一番賞抽獎吧！</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg"
            >
              前往商品頁
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
                    <p className="text-slate-400 text-sm">{order.createdAt}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium"
                  >
                    {selectedOrder?.id === order.id ? '收起詳情 ▲' : '查看詳情 ▼'}
                  </button>
                </div>

                {/* 訂單項目列表 */}
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={item.productImage}
                          alt={item.variantName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold mb-1">{item.variantName}</p>
                        <p className="text-slate-400 text-sm mb-1">{item.productName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gradient-to-r from-orange-400 to-pink-400 text-white px-2 py-1 rounded-full font-semibold">
                            {item.prize}
                          </span>
                          <span className="text-slate-400 text-xs">號碼: {item.ticketNumber}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                          <p className="text-slate-400 text-sm">{order.createdAt}</p>
                        </div>
                      </div>
                      {order.paidAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-white font-medium">完成付款</p>
                            <p className="text-slate-400 text-sm">{order.paidAt}</p>
                          </div>
                        </div>
                      )}
                      {order.shippedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-white font-medium">商品出貨</p>
                            <p className="text-slate-400 text-sm">{order.shippedAt}</p>
                          </div>
                        </div>
                      )}
                      {order.completedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-white font-medium">訂單完成</p>
                            <p className="text-slate-400 text-sm">{order.completedAt}</p>
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

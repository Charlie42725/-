'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

interface PointTransaction {
  id: number;
  type: 'purchase' | 'lottery' | 'refund' | 'bonus' | 'system';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  orderId?: string;
}

// 模擬點數異動資料
const mockTransactions: PointTransaction[] = [
  {
    id: 10,
    type: 'purchase',
    amount: 1000,
    balance: 1250,
    description: '購買點數 - 熱門方案（含贈送 150 點）',
    createdAt: '2025-01-21 10:00:00',
    orderId: 'PT20250121001',
  },
  {
    id: 9,
    type: 'lottery',
    amount: -100,
    balance: 250,
    description: '一番賞抽獎 - 原神 Ver.3（抽取 2 次）',
    createdAt: '2025-01-20 15:30:00',
  },
  {
    id: 8,
    type: 'bonus',
    amount: 50,
    balance: 350,
    description: '每日登入獎勵',
    createdAt: '2025-01-20 09:00:00',
  },
  {
    id: 7,
    type: 'lottery',
    amount: -150,
    balance: 300,
    description: '一番賞抽獎 - ONE PIECE 劇場版（抽取 3 次）',
    createdAt: '2025-01-19 14:20:00',
  },
  {
    id: 6,
    type: 'purchase',
    amount: 500,
    balance: 450,
    description: '購買點數 - 基礎方案（含贈送 50 點）',
    createdAt: '2025-01-18 11:15:00',
    orderId: 'PT20250118001',
  },
  {
    id: 5,
    type: 'lottery',
    amount: -200,
    balance: -50,
    description: '一番賞抽獎 - 咒術迴戰 渋谷事變（抽取 4 次）',
    createdAt: '2025-01-17 16:45:00',
  },
  {
    id: 4,
    type: 'bonus',
    amount: 100,
    balance: 150,
    description: '新會員註冊禮',
    createdAt: '2025-01-15 10:00:00',
  },
  {
    id: 3,
    type: 'refund',
    amount: 50,
    balance: 50,
    description: '訂單取消退款',
    createdAt: '2025-01-14 12:30:00',
    orderId: 'ORD20250114001',
  },
  {
    id: 2,
    type: 'lottery',
    amount: -50,
    balance: 0,
    description: '一番賞抽獎 - 鏈鋸人（抽取 1 次）',
    createdAt: '2025-01-13 14:00:00',
  },
  {
    id: 1,
    type: 'system',
    amount: 50,
    balance: 50,
    description: '系統贈送 - 開通帳號',
    createdAt: '2025-01-13 10:00:00',
  },
];

const typeText: Record<PointTransaction['type'], string> = {
  purchase: '購買點數',
  lottery: '抽獎消費',
  refund: '退款',
  bonus: '獎勵',
  system: '系統',
};

const typeIcon: Record<PointTransaction['type'], string> = {
  purchase: '💰',
  lottery: '🎲',
  refund: '↩️',
  bonus: '🎁',
  system: '⚙️',
};

interface User {
  id: number;
  email: string;
  nickname: string;
}

export default function PointHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

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

    // 載入點數異動資料
    const loadTransactions = async () => {
      try {
        // TODO: 實作 API 載入點數異動
        // const response = await fetch('/api/member/point-history');
        // const data = await response.json();
        // setTransactions(data.transactions);

        // 暫時使用模擬資料
        await new Promise(resolve => setTimeout(resolve, 500));
        setTransactions(mockTransactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [router]);

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">點數異動紀錄</h1>
          <p className="text-slate-400">查看您的點數使用明細</p>
        </div>

        {/* 目前點數餘額 */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-3xl p-8 backdrop-blur-sm border border-orange-400/30 shadow-2xl text-center">
            <p className="text-slate-300 text-lg mb-2">目前點數餘額</p>
            <p className="text-5xl font-black text-orange-400">
              {transactions.length > 0 ? transactions[0].balance.toLocaleString() : '0'}
            </p>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="mb-6">
          <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-slate-700/50">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterType('purchase')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'purchase'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                💰 購買
              </button>
              <button
                onClick={() => setFilterType('lottery')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'lottery'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                🎲 抽獎
              </button>
              <button
                onClick={() => setFilterType('bonus')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'bonus'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                🎁 獎勵
              </button>
              <button
                onClick={() => setFilterType('refund')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'refund'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                ↩️ 退款
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-slate-400">載入中...</div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-slate-800/30 rounded-3xl p-12 text-center backdrop-blur-sm border border-slate-700/50">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">無符合條件的紀錄</h3>
            <p className="text-slate-400">嘗試切換其他篩選條件</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{typeIcon[transaction.type]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold">{transaction.description}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.type === 'purchase' ? 'bg-green-500/20 text-green-400' :
                          transaction.type === 'lottery' ? 'bg-orange-500/20 text-orange-400' :
                          transaction.type === 'bonus' ? 'bg-purple-500/20 text-purple-400' :
                          transaction.type === 'refund' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {typeText[transaction.type]}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-1">{transaction.createdAt}</p>
                      {transaction.orderId && (
                        <p className="text-slate-500 text-xs">訂單編號: {transaction.orderId}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold mb-1 ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-slate-400 text-sm">
                      餘額 {transaction.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
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

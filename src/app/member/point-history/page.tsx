'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

interface PointTransaction {
  id: number;
  type: 'purchase' | 'bonus' | 'lottery' | 'refund' | 'admin_adjust';
  amount: number;
  balance: number;
  description: string;
  relatedId?: string;
  createdAt: string;
}

interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  points: number;
}

const typeText: Record<PointTransaction['type'], string> = {
  purchase: '購買點數',
  bonus: '贈送',
  lottery: '抽獎消費',
  refund: '退款',
  admin_adjust: '管理員調整',
};

const typeIcon: Record<PointTransaction['type'], string> = {
  purchase: '💰',
  bonus: '🎁',
  lottery: '🎲',
  refund: '↩️',
  admin_adjust: '⚙️',
};

export default function PointHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // 檢查登入狀態
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      // 載入用戶資料
      const userResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!userResponse.ok) throw new Error('Failed to load profile');
      const userData = await userResponse.json();
      setUser(userData.user);

      // 載入點數異動記錄
      const transResponse = await fetch('/api/points/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!transResponse.ok) throw new Error('Failed to load transactions');
      const transData = await transResponse.json();
      setTransactions(transData.transactions);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('載入資料失敗');
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

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

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
    <div className="min-h-screen bg-background text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">點數異動紀錄</h1>
          <p className="text-zinc-500">查看您的點數使用明細</p>
        </div>

        {/* 目前點數餘額 */}
        <div className="mb-8">
          <div className="bg-amber-500/10 rounded-3xl p-8 backdrop-blur-sm border border-amber-500/18 shadow-2xl text-center">
            <p className="text-zinc-300 text-lg mb-2">目前點數餘額</p>
            <p className="text-5xl font-black text-amber-400">
              {user.points.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="mb-6">
          <div className="bg-surface-1/50 rounded-2xl p-4 backdrop-blur-sm border border-[var(--border)]">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-3 text-zinc-300 hover:bg-surface-3/80'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterType('purchase')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'purchase'
                    ? 'bg-green-500 text-white'
                    : 'bg-surface-3 text-zinc-300 hover:bg-surface-3/80'
                }`}
              >
                購買
              </button>
              <button
                onClick={() => setFilterType('bonus')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'bonus'
                    ? 'bg-purple-500 text-white'
                    : 'bg-surface-3 text-zinc-300 hover:bg-surface-3/80'
                }`}
              >
                贈送
              </button>
              <button
                onClick={() => setFilterType('lottery')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'lottery'
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-3 text-zinc-300 hover:bg-surface-3/80'
                }`}
              >
                抽獎
              </button>
              <button
                onClick={() => setFilterType('refund')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterType === 'refund'
                    ? 'bg-blue-500 text-white'
                    : 'bg-surface-3 text-zinc-300 hover:bg-surface-3/80'
                }`}
              >
                退款
              </button>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-surface-1/30 rounded-3xl p-12 text-center backdrop-blur-sm border border-[var(--border)]">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {filterType === 'all' ? '尚無點數異動紀錄' : '無符合條件的紀錄'}
            </h3>
            <p className="text-zinc-500 mb-6">
              {filterType === 'all' ? '快去購買點數或參加抽獎吧！' : '嘗試切換其他篩選條件'}
            </p>
            {filterType === 'all' && (
              <button
                onClick={() => router.push('/member/points')}
                className="bg-amber-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-amber-600 transition-all shadow-lg"
              >
                前往購買點數
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-surface-1/50 rounded-2xl p-6 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{typeIcon[transaction.type]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold">{transaction.description}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.type === 'purchase' ? 'bg-green-500/20 text-green-400' :
                          transaction.type === 'bonus' ? 'bg-purple-500/20 text-purple-400' :
                          transaction.type === 'lottery' ? 'bg-amber-500/20 text-amber-400' :
                          transaction.type === 'refund' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-zinc-500/20 text-zinc-500'
                        }`}>
                          {typeText[transaction.type]}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm mb-1">{formatDate(transaction.createdAt)}</p>
                      {transaction.relatedId && (
                        <p className="text-zinc-500 text-xs">關聯編號: {transaction.relatedId}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold mb-1 ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-zinc-500 text-sm">
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
            className="px-8 py-3 bg-surface-3 text-white font-medium rounded-xl hover:bg-zinc-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}

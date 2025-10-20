'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  nickname: string;
  gender?: string;
  phone?: string;
  isPhoneVerified?: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nickname: '',
    gender: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // 檢查登入狀態
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        nickname: userData.nickname || '',
        gender: userData.gender || '',
        phone: userData.phone || '',
      }));
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 清除錯誤
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    try {
      // TODO: 實作 API 更新用戶資料
      // const response = await fetch('/api/member/update-profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // 暫時模擬成功
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('資料更新成功！');

      // 清除密碼欄位
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
    } catch (error) {
      setErrors({ submit: '更新失敗，請稍後再試' });
    } finally {
      setLoading(false);
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
      <div className="max-w-3xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">基本設定</h1>
          <p className="text-slate-400">管理您的個人資料</p>
        </div>

        <div className="bg-slate-800/50 rounded-3xl p-8 lg:p-10 backdrop-blur-sm border border-slate-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 帳號資訊 */}
            <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">帳號資訊</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-400 cursor-not-allowed"
                />
                <p className="text-slate-500 text-xs mt-2">Email 無法變更</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  暱稱 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="您的暱稱"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">性別</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  <option value="">請選擇</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  手機號碼
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="09xxxxxxxx"
                />
                {user.isPhoneVerified && (
                  <p className="text-green-400 text-xs mt-2">✓ 已驗證</p>
                )}
              </div>
            </div>

            {/* 變更密碼 */}
            <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">變更密碼</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  目前密碼
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="輸入目前密碼"
                />
                <p className="text-slate-500 text-xs mt-2">若不需變更密碼，請留空此區塊</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  新密碼
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="6-24 個字元"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  確認新密碼
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="再次輸入新密碼"
                />
              </div>
            </div>

            {/* 成功訊息 */}
            {successMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl">
                <p className="text-green-400 text-sm">{successMessage}</p>
              </div>
            )}

            {/* 錯誤訊息 */}
            {errors.submit && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* 提交按鈕 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '儲存變更'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 bg-slate-700 text-white font-medium py-4 rounded-xl hover:bg-slate-600 transition-colors"
              >
                返回
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

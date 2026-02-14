'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // 清除該欄位的錯誤
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

    // 驗證服務條款
    if (!formData.agreedToTerms) {
      setErrors({ agreedToTerms: '請同意服務條款' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error });
        return;
      }

      // 登入成功
      alert('登入成功！');

      // 可以將 token 存到 localStorage（如果需要在客戶端使用）
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // 觸發 storage 事件讓其他組件更新（同頁面需要手動觸發）
        window.dispatchEvent(new Event('storage'));
      }

      // 導向首頁
      router.push('/');
    } catch {
      setErrors({ submit: '登入失敗，請稍後再試' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-zinc-800/50 rounded-3xl p-8 lg:p-10 backdrop-blur-sm border border-zinc-700/50 shadow-2xl">
          {/* 標題 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">會員登入</h1>
            <p className="text-zinc-500">歡迎回到失控抽抽</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email 地址 <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="your@email.com"
                required
              />
              {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
            </div>

            {/* 密碼 */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                密碼 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="請輸入密碼"
                required
              />
              {errors.password && <p className="text-red-400 text-sm mt-2">{errors.password}</p>}
            </div>

            {/* 忘記密碼連結 */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-amber-400 hover:underline text-sm font-medium">
                忘記密碼？
              </Link>
            </div>

            {/* 服務條款 */}
            <div className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-2xl">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-400 bg-zinc-800"
                required
              />
              <label className="text-sm text-zinc-300">
                我已閱讀並同意 <Link href="/terms" className="text-amber-400 hover:underline">服務條款</Link> 和 <Link href="/privacy" className="text-amber-400 hover:underline">隱私政策</Link>
                <span className="text-red-400 ml-1">*</span>
              </label>
            </div>
            {errors.agreedToTerms && (
              <p className="text-red-400 text-sm -mt-2">{errors.agreedToTerms}</p>
            )}

            {/* 錯誤訊息 */}
            {errors.submit && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* 提交按鈕 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-amber-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登入中...' : '登入'}
            </button>

            {/* 註冊連結 */}
            <div className="text-center text-zinc-500 text-sm">
              還未註冊？ <Link href="/register" className="text-amber-400 hover:underline font-medium">立即註冊</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

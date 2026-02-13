'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    emailCode: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    gender: '',
    phone: '',
    phoneCode: '',
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [emailCodeCountdown, setEmailCodeCountdown] = useState(0);
  const [phoneCodeCountdown, setPhoneCodeCountdown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

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

  const sendEmailCode = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: '請輸入 Email 地址' }));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(prev => ({ ...prev, email: data.error }));
        return;
      }

      setEmailCodeCountdown(60);

      // 倒數計時
      const timer = setInterval(() => {
        setEmailCodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setErrors(prev => ({ ...prev, email: '發送驗證碼失敗，請稍後再試' }));
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneCode = async () => {
    if (!formData.phone) {
      setErrors(prev => ({ ...prev, phone: '請輸入手機號碼' }));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(prev => ({ ...prev, phone: data.error }));
        return;
      }

      setPhoneCodeCountdown(60);

      // 倒數計時
      const timer = setInterval(() => {
        setPhoneCodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setErrors(prev => ({ ...prev, phone: '發送驗證碼失敗，請稍後再試' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error });
        return;
      }

      // 註冊成功，導向登入頁
      alert('註冊成功！請登入');
      router.push('/login');
    } catch {
      setErrors({ submit: '註冊失敗，請稍後再試' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800/50 rounded-3xl p-8 lg:p-10 backdrop-blur-sm border border-slate-700/50 shadow-2xl">
          {/* 標題 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">會員註冊</h1>
            <p className="text-slate-400">加入失控抽抽</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email 區塊 */}
            <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Email 驗證</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email 地址 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="your@email.com"
                  required
                />
                {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
                <p className="text-slate-500 text-xs mt-2">建議使用 Gmail、Outlook、iCloud（避免使用 Yahoo）</p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  name="emailCode"
                  value={formData.emailCode}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="輸入 Email 驗證碼"
                  required
                />
                <button
                  type="button"
                  onClick={sendEmailCode}
                  disabled={emailCodeCountdown > 0 || loading}
                  className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {emailCodeCountdown > 0 ? `${emailCodeCountdown}秒` : '發送驗證碼'}
                </button>
              </div>
            </div>

            {/* 密碼區塊 */}
            <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">設定密碼</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  密碼 <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="6-24 個字元"
                  required
                />
                <p className="text-slate-500 text-xs mt-2">僅限英數字及 @ _ - 符號</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  確認密碼 <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="再次輸入密碼"
                  required
                />
              </div>
            </div>

            {/* 基本資料區塊 */}
            <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">基本資料</h3>

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
            </div>

            {/* 手機驗證區塊（選填） */}
            <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold text-slate-400 mb-4">手機驗證（選填）</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">手機號碼</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="09xxxxxxxx"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-2">{errors.phone}</p>}
              </div>

              {formData.phone && (
                <>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="phoneCode"
                      value={formData.phoneCode}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                      placeholder="輸入手機驗證碼"
                    />
                    <button
                      type="button"
                      onClick={sendPhoneCode}
                      disabled={phoneCodeCountdown > 0 || loading}
                      className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {phoneCodeCountdown > 0 ? `${phoneCodeCountdown}秒` : '發送驗證碼'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 服務條款 */}
            <div className="flex items-start gap-3 p-6 bg-slate-900/50 rounded-2xl">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-slate-700 text-orange-500 focus:ring-orange-400 bg-slate-800"
                required
              />
              <label className="text-sm text-slate-300">
                我已閱讀並同意 <Link href="/terms" className="text-orange-400 hover:underline">服務條款</Link> 和 <Link href="/privacy" className="text-orange-400 hover:underline">隱私政策</Link>
                <span className="text-red-400 ml-1">*</span>
              </label>
            </div>

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
              className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>

            {/* 登入連結 */}
            <div className="text-center text-slate-400 text-sm">
              已經有帳號了？ <Link href="/login" className="text-orange-400 hover:underline font-medium">立即登入</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

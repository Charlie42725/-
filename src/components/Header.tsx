'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, isAuthenticated } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; email: string; nickname: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(false);

  useEffect(() => {
    // 檢查登入狀態
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setLoggedIn(authenticated);
      if (authenticated) {
        const userData = getCurrentUser();
        setUser(userData);
        loadUserPoints();
      }
    };

    checkAuth();

    // 監聽 storage 變化（跨 tab 同步）
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    // 定期刷新點數（每 30 秒）- 減少資料庫查詢頻率
    const intervalId = setInterval(() => {
      if (isAuthenticated()) {
        loadUserPoints();
      }
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const loadUserPoints = async () => {
    if (!isAuthenticated() || loadingPoints) return;

    setLoadingPoints(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.user.points);
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setUser(null);
    setUserPoints(0);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-screen-xl mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/images/logos/logo.png"
                alt="萬物皆可抽"
                width={150}
                height={50}
                className="h-12 w-auto"
                onError={(e) => {
                  // 如果圖片載入失敗，隱藏圖片並顯示文字
                  e.currentTarget.style.display = 'none';
                  const textLogo = e.currentTarget.nextElementSibling as HTMLElement;
                  if (textLogo) textLogo.style.display = 'block';
                }}
              />
              <div className="text-3xl font-bold text-orange-400" style={{ display: 'none' }}>
                萬物皆可抽
              </div>
            </Link>
          </div>

          {/* 桌面版導航選單 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-orange-400 transition-colors">
              全部一番賞
            </Link>
          </div>

          {/* 右側按鈕 */}
          <div className="hidden md:flex items-center space-x-4">
            {loggedIn && user ? (
              <>
                {/* 點數餘額顯示 */}
                <Link
                  href="/member/points"
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-400/30 px-4 py-2 rounded-xl hover:from-orange-500/30 hover:to-pink-500/30 transition-all group"
                >
                  <svg className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-orange-400 font-bold text-lg">{userPoints.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">點</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-orange-400 transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center font-bold">
                      {user.nickname?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span>{user.nickname}</span>
                    <svg className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 會員下拉選單 */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                      <div className="py-2">
                        <Link
                          href="/member/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-white hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          基本設定
                        </Link>
                        <Link
                          href="/member/points"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-white hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          點數購買
                        </Link>
                        <Link
                          href="/member/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-white hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          訂單紀錄
                        </Link>
                        <Link
                          href="/member/point-history"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-white hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          點數異動紀錄
                        </Link>
                        <hr className="border-slate-700 my-2" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          登出
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white hover:text-orange-400 transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
                  登入
                </Link>
                <Link href="/register" className="text-white hover:text-orange-400 transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
                  註冊
                </Link>
              </>
            )}
          </div>

          {/* 手機版選單按鈕 */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {/* 手機版選單 */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 py-4">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                全部一番賞
              </Link>
              <hr className="border-gray-600 my-2" />
              {loggedIn && user ? (
                <>
                  <div className="px-4 py-2">
                    <div className="text-orange-400 font-medium mb-2">
                      歡迎，{user.nickname}
                    </div>
                    <Link
                      href="/member/points"
                      className="flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-400/30 px-4 py-2 rounded-xl hover:from-orange-500/30 hover:to-pink-500/30 transition-all"
                    >
                      <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-orange-400 font-bold text-lg">{userPoints.toLocaleString()}</span>
                      <span className="text-slate-400 text-sm">點</span>
                    </Link>
                  </div>
                  <Link href="/member/profile" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                    基本設定
                  </Link>
                  <Link href="/member/points" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                    點數購買
                  </Link>
                  <Link href="/member/orders" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                    訂單紀錄
                  </Link>
                  <Link href="/member/point-history" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                    點數異動紀錄
                  </Link>
                  <hr className="border-gray-600 my-2" />
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-400 hover:text-red-300 transition-colors px-4 py-2 w-full"
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                    登入
                  </Link>
                  <Link href="/register" className="text-white hover:text-orange-400 transition-colors px-4 py-2">
                    註冊
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

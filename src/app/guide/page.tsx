import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '使用說明 - 失控事務所',
  description: '失控事務所線上抽賞平台使用說明，了解如何註冊、抽賞與領獎。',
};

export default function GuidePage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12 md:py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          使用說明
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          只要 5 個步驟，即可開始你的抽賞之旅
        </p>
      </div>

      {/* Steps Timeline */}
      <div className="relative max-w-3xl mx-auto">
        {/* 連接線 */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-orange-400 via-pink-400 to-purple-400 opacity-30 hidden md:block" />

        <div className="space-y-8 md:space-y-12">
          {/* Step 1 */}
          <div className="relative flex gap-5 md:gap-8 group">
            <div className="relative z-10 shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 flex-1 group-hover:border-orange-400/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">STEP 1</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">註冊帳號</h2>
              <p className="text-zinc-400 leading-relaxed">
                使用 Email 快速註冊，完成驗證即可開始抽賞。建立帳號後即可追蹤你的獎品與訂單紀錄。
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex gap-5 md:gap-8 group">
            <div className="relative z-10 shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 flex-1 group-hover:border-pink-400/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-pink-400 bg-pink-400/10 px-2.5 py-1 rounded-full">STEP 2</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">瀏覽商品</h2>
              <p className="text-zinc-400 leading-relaxed">
                探索一番賞、GK、盲盒等豐富商品，依品牌或系列篩選，找到你最想要的賞品。每件商品都有詳細的獎項說明與剩餘數量。
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex gap-5 md:gap-8 group">
            <div className="relative z-10 shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 flex-1 group-hover:border-amber-400/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">STEP 3</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">購買抽賞券</h2>
              <p className="text-zinc-400 leading-relaxed">
                選擇想要的抽數，支援信用卡、ATM 等多種付款方式。付款完成後，抽賞券立即入帳，隨時可以開抽。
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex gap-5 md:gap-8 group">
            <div className="relative z-10 shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 flex-1 group-hover:border-purple-400/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full">STEP 4</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">線上抽賞</h2>
              <p className="text-zinc-400 leading-relaxed">
                進入抽賞頁面，即時揭曉你的獎項結果！所有抽賞過程公開透明，確保每一抽都公平公正。
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex gap-5 md:gap-8 group">
            <div className="relative z-10 shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 flex-1 group-hover:border-emerald-400/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">STEP 5</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">領取獎品</h2>
              <p className="text-zinc-400 leading-relaxed">
                中獎後可選擇宅配到府、超商取貨或門市自取。也可以將獎品轉換為點數，用於下次抽賞折抵！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 text-center group hover:border-orange-400/30 transition-colors duration-300 cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-orange-400/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-400/20 transition-colors duration-300">
            <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">公平公正</h3>
          <p className="text-zinc-400 text-sm">透明的抽賞機制，所有結果可供驗證，保障每位玩家的權益</p>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 text-center group hover:border-pink-400/30 transition-colors duration-300 cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-pink-400/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-400/20 transition-colors duration-300">
            <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">即時開獎</h3>
          <p className="text-zinc-400 text-sm">線上即時揭曉結果，不用等待，享受抽賞的刺激與樂趣</p>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 text-center group hover:border-purple-400/30 transition-colors duration-300 cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-purple-400/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-400/20 transition-colors duration-300">
            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">專屬客服</h3>
          <p className="text-zinc-400 text-sm">LINE 官方帳號即時客服，任何問題都能快速獲得協助</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="text-zinc-400 mb-6">準備好了嗎？立即開始你的抽賞之旅！</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-shadow duration-300 cursor-pointer"
          >
            立即註冊
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-[var(--border)] text-zinc-300 font-bold hover:border-zinc-500 hover:text-white transition-colors duration-300 cursor-pointer"
          >
            瀏覽商品
          </Link>
        </div>
      </div>
    </div>
  );
}

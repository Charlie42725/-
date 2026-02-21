import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie 政策 - 失控事務所',
  description: '失控事務所 Cookie 使用政策說明。',
};

export default function CookiesPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        Cookie 政策
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-8 text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">什麼是 Cookie？</h2>
          <p>Cookie 是網站儲存在您瀏覽器中的小型文字檔案，用於記錄您的偏好設定與使用行為，以提供更好的使用體驗。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">我們使用的 Cookie 類型</h2>
          <ul className="space-y-3">
            <li><span className="text-white font-semibold">必要性 Cookie：</span>維持網站正常運作所必需，例如登入狀態、購物車資訊等。</li>
            <li><span className="text-white font-semibold">功能性 Cookie：</span>記錄您的偏好設定，如語言選擇、主題模式等。</li>
            <li><span className="text-white font-semibold">分析性 Cookie：</span>幫助我們了解使用者如何使用本平台，以持續改善服務品質。</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">如何管理 Cookie</h2>
          <p>您可以透過瀏覽器設定隨時清除或停用 Cookie。請注意，停用必要性 Cookie 可能會影響本平台部分功能的正常使用。</p>
        </section>
      </div>
    </div>
  );
}

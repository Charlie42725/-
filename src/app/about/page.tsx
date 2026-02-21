import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '關於我們 - 失控事務所',
  description: '了解失控事務所線上抽賞平台，提供最公平、公正、公開的抽賞體驗。',
};

export default function AboutPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        關於我們
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">失控事務所</h2>
          <p className="text-zinc-400 leading-relaxed">
            失控事務所是一個線上抽賞平台，專營 GK、盲盒、一番賞等商品。我們致力於提供最公平、公正、公開的抽賞體驗，讓每一位玩家都能享受抽賞的樂趣。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">我們的理念</h2>
          <p className="text-zinc-400 leading-relaxed">
            我們相信每一次抽賞都應該是透明且值得信賴的。透過公開透明的機制，確保每位玩家享有公平的中獎機會。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">聯絡方式</h2>
          <ul className="text-zinc-400 space-y-2">
            <li>地址：243新北市泰山區仁愛路76號1樓</li>
            <li>電話：<a href="tel:0978251929" className="text-orange-400 hover:text-orange-300 transition-colors">0978-251-929</a></li>
            <li>LINE 官方帳號：<a href="https://line.me/R/ti/p/@054wqmoa" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors">@054wqmoa</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

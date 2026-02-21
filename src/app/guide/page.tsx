import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '使用說明 - 失控事務所',
  description: '失控事務所線上抽賞平台使用說明，了解如何註冊、抽賞與領獎。',
};

export default function GuidePage() {
  const steps = [
    { title: '註冊帳號', desc: '使用手機號碼或 Email 快速註冊，完成驗證即可開始抽賞。' },
    { title: '選擇商品', desc: '瀏覽一番賞商品列表，選擇你喜歡的系列。' },
    { title: '購買抽賞券', desc: '選擇想要的抽數，完成付款後即可進行抽賞。' },
    { title: '線上抽賞', desc: '進入抽賞頁面，即時揭曉你的獎項結果。' },
    { title: '領取獎品', desc: '中獎後可選擇宅配到府或轉換為點數，獎品將於確認後寄出。' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        使用說明
      </h1>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-[var(--border)] p-6 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center shrink-0 font-bold text-white">
              {i + 1}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{step.title}</h2>
              <p className="text-zinc-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

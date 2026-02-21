import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '常見問題 - 失控事務所',
  description: '失控事務所常見問題與解答，快速了解抽賞、付款、配送相關問題。',
};

const faqs = [
  { q: '如何進行抽賞？', a: '選擇喜歡的一番賞商品，購買抽賞券後即可在線上進行抽賞，結果即時揭曉。' },
  { q: '支援哪些付款方式？', a: '目前支援信用卡、ATM 轉帳等付款方式，未來將持續新增更多付款選項。' },
  { q: '獎品多久會寄出？', a: '確認領取後，獎品將於 3-7 個工作天內寄出，届時會提供物流追蹤資訊。' },
  { q: '可以退換貨嗎？', a: '抽賞商品一經抽出不可退換，但若收到商品有瑕疵，請於收到後 3 日內聯繫客服處理。' },
  { q: '如何聯繫客服？', a: '您可以透過 LINE 官方帳號 @054wqmoa 或撥打客服電話 0978-251-929 與我們聯繫。' },
  { q: '點數可以做什麼？', a: '點數可用於兌換抽賞券或折抵消費金額，詳情請參考點數使用規則。' },
];

export default function FaqPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        常見問題
      </h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-lg font-bold text-white mb-2">Q：{faq.q}</h2>
            <p className="text-zinc-400">A：{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

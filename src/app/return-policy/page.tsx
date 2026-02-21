import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '退換貨政策 - 失控事務所',
  description: '失控事務所退換貨政策與退款說明。',
};

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        退換貨政策
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">退換貨原則</h2>
          <p className="text-zinc-400 leading-relaxed">
            線上抽賞商品屬於機會型商品，一經抽出結果確定後，恕不接受退換貨。請於購買前詳閱商品資訊及抽賞規則。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">瑕疵品處理</h2>
          <p className="text-zinc-400 leading-relaxed">
            若收到的獎品有明顯瑕疵或損壞，請於收到商品後 3 日內聯繫客服，並提供照片佐證。經審核確認後，我們將協助您進行換貨處理。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">退款方式</h2>
          <ul className="text-zinc-400 space-y-2 list-disc list-inside">
            <li>瑕疵品經確認後，可選擇換貨或退款至原付款方式</li>
            <li>退款處理時間約 7-14 個工作天</li>
            <li>點數退還將即時入帳</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">聯絡客服</h2>
          <p className="text-zinc-400">
            如需辦理退換貨，請聯繫 LINE 官方帳號{' '}
            <a href="https://line.me/R/ti/p/@054wqmoa" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors">@054wqmoa</a>
            {' '}或撥打客服電話{' '}
            <a href="tel:0978251929" className="text-orange-400 hover:text-orange-300 transition-colors">0978-251-929</a>。
          </p>
        </section>
      </div>
    </div>
  );
}

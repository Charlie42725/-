import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '免責聲明 - 失控事務所',
  description: '失控事務所免責聲明。',
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        免責聲明
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-8 text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">一、服務中斷</h2>
          <p>本平台將盡力維持服務的穩定運作，但因系統維護、升級或不可抗力因素（如天災、網路中斷等）導致服務暫時中斷時，本平台不承擔相關責任。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">二、商品圖片</h2>
          <p>本平台商品圖片僅供參考，實際商品可能因拍攝光線、螢幕顯示等因素而與圖片略有差異，以實際收到的商品為準。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">三、抽賞結果</h2>
          <p>所有抽賞結果均由系統隨機產生，本平台保證抽賞機制的公平性。抽賞結果一經產生即為最終結果，本平台不對抽賞結果承擔額外責任。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">四、外部連結</h2>
          <p>本平台可能包含第三方網站的連結，這些外部網站的內容與隱私政策不在本平台管理範圍內，使用者應自行判斷風險。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">五、法律適用</h2>
          <p>本免責聲明以中華民國法律為準據法。如發生任何爭議，雙方應先行協商解決，協商不成時以台灣新北地方法院為第一審管轄法院。</p>
        </section>
      </div>
    </div>
  );
}

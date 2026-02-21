import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '配送資訊 - 失控事務所',
  description: '失控事務所配送方式、運費與寄送時間說明。',
};

export default function ShippingPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        配送資訊
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">配送方式</h2>
          <ul className="text-zinc-400 space-y-2 list-disc list-inside">
            <li>宅配到府（黑貓宅急便 / 宅配通）</li>
            <li>超商取貨（7-11 / 全家）</li>
            <li>門市自取（243新北市泰山區仁愛路76號1樓）</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">配送時間</h2>
          <p className="text-zinc-400">獎品確認領取後，將於 3-7 個工作天內安排出貨，届時將透過簡訊或 LINE 通知物流追蹤資訊。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">運費說明</h2>
          <ul className="text-zinc-400 space-y-2 list-disc list-inside">
            <li>宅配：單筆訂單滿 $1,000 免運，未滿酌收 $80 運費</li>
            <li>超商取貨：單筆酌收 $60 運費</li>
            <li>門市自取：免運費</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">注意事項</h2>
          <ul className="text-zinc-400 space-y-2 list-disc list-inside">
            <li>配送範圍僅限台灣本島及離島地區</li>
            <li>離島地區配送時間可能額外增加 2-3 個工作天</li>
            <li>如遇天災或不可抗力因素，配送時間將另行通知</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

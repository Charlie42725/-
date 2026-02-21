import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服務條款 - 失控事務所',
  description: '失控事務所服務條款，使用本平台前請詳閱。',
};

export default function TermsPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        服務條款
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-8 text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">一、總則</h2>
          <p>歡迎使用失控事務所線上抽賞平台（以下簡稱「本平台」）。當您使用本平台服務時，即表示您已閱讀、瞭解並同意接受本服務條款之所有內容。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">二、服務說明</h2>
          <p>本平台提供線上一番賞、GK、盲盒等抽賞服務。所有抽賞結果均透過公平公正的隨機機制產生，確保每位使用者享有平等的中獎機會。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">三、帳號管理</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>使用者需提供真實有效的個人資訊進行註冊</li>
            <li>每人限註冊一個帳號，禁止重複註冊或使用他人帳號</li>
            <li>使用者應妥善保管帳號密碼，因個人保管不當造成的損失由使用者自行承擔</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">四、抽賞規則</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>抽賞券一經購買，除本平台系統異常外，恕不接受退款</li>
            <li>抽賞結果一經產生即為最終結果，不得要求重抽或更換</li>
            <li>本平台保留修改抽賞規則之權利，修改後將於平台公告</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">五、智慧財產權</h2>
          <p>本平台所有內容（包括但不限於文字、圖片、商標、Logo）均受著作權法及相關法律保護，未經授權不得複製、轉載或用於商業用途。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">六、條款修訂</h2>
          <p>本平台保留隨時修訂本服務條款之權利。修訂後的條款將公告於本平台，繼續使用本平台即視為同意修訂後之條款。</p>
        </section>
      </div>
    </div>
  );
}

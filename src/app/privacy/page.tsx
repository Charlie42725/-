import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隱私政策 - 失控事務所',
  description: '失控事務所隱私權政策，說明我們如何蒐集、使用及保護您的個人資料。',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        隱私政策
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 space-y-8 text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">一、資料蒐集</h2>
          <p>我們在您註冊帳號、使用服務或聯繫客服時，可能蒐集以下個人資料：</p>
          <ul className="space-y-1 list-disc list-inside mt-2">
            <li>姓名、電話號碼、電子郵件地址</li>
            <li>配送地址</li>
            <li>付款相關資訊</li>
            <li>使用紀錄與偏好設定</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">二、資料使用</h2>
          <p>蒐集的個人資料將用於以下目的：</p>
          <ul className="space-y-1 list-disc list-inside mt-2">
            <li>提供及改善平台服務</li>
            <li>處理訂單與配送獎品</li>
            <li>發送服務通知及活動資訊</li>
            <li>客戶服務與問題處理</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">三、資料保護</h2>
          <p>我們採取適當的技術與管理措施保護您的個人資料安全，防止未經授權的存取、使用或洩漏。</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">四、第三方分享</h2>
          <p>除以下情況外，我們不會將您的個人資料提供給第三方：</p>
          <ul className="space-y-1 list-disc list-inside mt-2">
            <li>經您同意</li>
            <li>配合司法機關依法調查</li>
            <li>為完成配送服務而提供予物流合作夥伴</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-3">五、您的權利</h2>
          <p>您可以隨時聯繫我們查詢、更正或刪除您的個人資料。如需行使相關權利，請聯繫客服。</p>
        </section>
      </div>
    </div>
  );
}

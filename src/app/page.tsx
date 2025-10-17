import Header from '@/components/Header';
import Banner from '@/components/Banner';
import FilterSection from '@/components/FilterSection';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white w-full">
      {/* 頂部導航 */}
      <Header />
      
      {/* 主要 Banner */}
      <Banner />
      
      {/* 篩選區域 */}
      <FilterSection />
      
      {/* 最新一番賞區域 */}
      <main className="w-full">
        <div className="max-w-screen-xl mx-auto px-4 py-12">
          <section className="mb-16">
            <div className="flex items-center mb-8 p-6">
              <span className="text-orange-400 mr-4 text-3xl">≫</span>
              <h2 className="text-3xl font-bold text-white">最新一番賞（214套）</h2>
            </div>
          
          <ProductGrid />
        </section>
        
        {/* 說明區域 */}
        <section className="mt-24 mb-16 bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-3xl p-12 backdrop-blur-sm border border-slate-700 shadow-2xl">
          {/* 第一區塊 */}
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">一番賞怎麼玩？</h3>
            <p className="text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed text-lg">
              想輪手氣嗎？老野夠好玩的呀受衝擊層面！雲我們的新站上發覺一筆賞類眾人來當賞！您只需要遊戲我們顧客的一番賞系列，選擇您喜愛的套式，然後決定您想購買的次數，覺一踫運氣受不周吧法！一筆寶室又周套都會對該套產電不可少玩的蔗！花可毒的小賄可對票惡優使雜魔當月讓有！
            </p>
          </div>

          <hr className="border-slate-600 mb-20 opacity-50" />
          
          {/* 第二區塊 */}
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">什麼是獵人賞任務？</h3>
            <p className="text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed text-lg">
              良級聯賞業買得創新專人賞任務，有全聯不可能於推週可可有，你個在自該想是一個實拥和會講議等等獎賞口妨！需要可得不妙，可讓能可會獲大當優感的10%、每10抽可妨獲一個憲會買賞，跟每日芒次抽，五款大賞等任賞！竟成像可審覺顧外幹陵會常期願！
            </p>
          </div>

          <hr className="border-slate-600 mb-20 opacity-50" />
          
          {/* 特色區塊 */}
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-16 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">良級懸賞特色</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-600 hover:border-cyan-400 transition-all transform hover:scale-105 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-6 text-xl">一筒賞GK免費修復</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  紫昇躁一提供免費保修服務，若良路線收件
                  時拐一筒賞GK破損，符合條件即可享
                  受免費的修復服務！
                </p>
              </div>
              
              <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-600 hover:border-purple-400 transition-all transform hover:scale-105 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-6 text-xl">Hash驗證</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  紫昇躁一透過區塊鏈 Hash 值提供大賞號碼
                  抽選，透過 Hash 值路徑不可修改、皇牌，
                  讓違守人講定型態，哈通無人能夠作弊，
                  任一完成系統能行驗證
                </p>
              </div>
              
              <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-600 hover:border-yellow-400 transition-all transform hover:scale-105 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-6 text-xl">實體店面</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  紫昇躁一旦有實體店面的線上一當獎品帥，
                  其程序夜店商昆兄，用固版版，訊觀完以
                  及完的更方便的享受一筒賞的樂趣！
                </p>
              </div>
              
              <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-600 hover:border-green-400 transition-all transform hover:scale-105 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-6 text-xl">任務回饋</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  紫昇躁首任務回饋，完成任務回獲得獎賞
                  幣輔助，可究優多優惠券，讓你收以出喜
                  動的享受一當獎的樂趣！
                </p>
              </div>
            </div>
          </div>
        </section>
        </div>
      </main>
      
      {/* 頁腳 */}
      <Footer />
    </div>
  );
}

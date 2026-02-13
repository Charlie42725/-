export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* 麵包屑骨架 */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-12 bg-slate-700 rounded animate-pulse"></div>
          <span className="text-slate-600">/</span>
          <div className="h-4 w-20 bg-slate-700 rounded animate-pulse"></div>
          <span className="text-slate-600">/</span>
          <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* 商品內容骨架 */}
      <div className="max-w-screen-xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-14">
          {/* 左側：圖片骨架 */}
          <div className="bg-slate-800/30 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
            <div className="w-full h-96 lg:h-[520px] bg-slate-700 rounded-2xl animate-pulse"></div>

            {/* 縮圖骨架 */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="h-28 lg:h-32 bg-slate-700 rounded-xl animate-pulse"></div>
              <div className="h-28 lg:h-32 bg-slate-700 rounded-xl animate-pulse"></div>
              <div className="h-28 lg:h-32 bg-slate-700 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* 右側：資訊骨架 */}
          <div className="space-y-6 lg:space-y-8">
            {/* 基本資訊卡片骨架 */}
            <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
              {/* 品牌標籤骨架 */}
              <div className="flex items-center space-x-3 mb-4 lg:mb-6">
                <div className="h-9 w-24 bg-slate-700 rounded-full animate-pulse"></div>
                <div className="h-9 w-32 bg-slate-700 rounded-full animate-pulse"></div>
              </div>

              {/* 標題骨架 */}
              <div className="h-10 w-3/4 bg-slate-700 rounded-lg mb-4 animate-pulse"></div>

              {/* 描述骨架 */}
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse"></div>
              </div>

              {/* 價格與剩餘數量骨架 */}
              <div className="grid grid-cols-2 gap-5 mb-6 lg:mb-8">
                <div className="h-24 bg-slate-700 rounded-2xl animate-pulse"></div>
                <div className="h-24 bg-slate-700 rounded-2xl animate-pulse"></div>
              </div>

              {/* 進度條骨架 */}
              <div className="h-4 w-full bg-slate-700 rounded-full animate-pulse"></div>
            </div>

            {/* 按鈕區域骨架 */}
            <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
              <div className="h-6 w-32 bg-slate-700 rounded mx-auto mb-6 animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-14 w-full bg-slate-700 rounded-2xl animate-pulse"></div>
                <div className="h-12 w-full bg-slate-700 rounded-2xl animate-pulse"></div>
              </div>
            </div>

            {/* 獎項列表骨架 */}
            <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
              <div className="h-8 w-32 bg-slate-700 rounded mb-6 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-slate-700 rounded-xl animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-slate-700 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-6 w-12 bg-slate-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 抽獎池骨架 */}
        <div className="mt-12 lg:mt-16 mb-40 lg:mb-56">
          <div className="text-center mb-8 lg:mb-10">
            <div className="h-8 w-64 bg-slate-700 rounded mx-auto mb-6 animate-pulse"></div>
          </div>

          <div className="bg-slate-800/40 rounded-3xl p-6 lg:p-8 backdrop-blur-sm border border-slate-700/50">
            <div className="h-32 w-full bg-slate-700 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

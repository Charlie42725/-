export default function AdminLoading() {
  return (
    <div className="w-full animate-pulse">
      {/* 標題骨架 */}
      <div className="mb-6 md:mb-8">
        <div className="h-7 w-28 bg-surface-2 rounded-lg mb-2" />
        <div className="h-4 w-40 bg-surface-2/60 rounded" />
      </div>

      {/* 卡片骨架 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface-1/40 rounded-xl p-3 md:p-5 border border-[var(--border)]">
            <div className="h-3 w-12 bg-surface-3 rounded mb-2" />
            <div className="h-8 w-10 bg-surface-3 rounded" />
          </div>
        ))}
      </div>

      {/* 列表骨架 */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface-1/40 rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 w-1/3 bg-surface-3 rounded mb-2" />
                <div className="h-3 w-2/3 bg-surface-3/60 rounded" />
              </div>
              <div className="h-6 w-14 bg-surface-3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

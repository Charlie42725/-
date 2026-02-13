'use client';

interface QueueWaitingUIProps {
  position: number;
  totalInQueue: number;
  onLeave: () => void;
}

export default function QueueWaitingUI({
  position,
  totalInQueue,
  onLeave,
}: QueueWaitingUIProps) {
  const aheadCount = position - 1;
  // 估計每人 3 分鐘
  const estimatedMinutes = aheadCount * 3;

  return (
    <div className="text-center py-12 px-4">
      <div className="bg-slate-800/50 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-slate-700/50 max-w-lg mx-auto">
        {/* 脈動動畫圈 */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-orange-500/20 queue-pulse-ring" />
          <div className="absolute inset-3 rounded-full bg-orange-500/30 queue-pulse-ring" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-4xl font-black">{position}</span>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">排隊等待中</h3>
        <p className="text-slate-400 mb-6">
          您目前排在第 <span className="text-orange-400 font-bold">{position}</span> 位
          {aheadCount > 0 && (
            <>，前方還有 <span className="text-orange-400 font-bold">{aheadCount}</span> 人</>
          )}
        </p>

        {/* 排隊資訊 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">排隊總人數</p>
            <p className="text-white font-bold text-xl">{totalInQueue}</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">預估等待</p>
            <p className="text-white font-bold text-xl">
              {estimatedMinutes > 0 ? `~${estimatedMinutes} 分鐘` : '即將輪到'}
            </p>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">
          輪到您時會自動通知，請勿關閉此頁面
        </p>

        <button
          onClick={onLeave}
          className="bg-slate-700 text-slate-300 font-medium py-3 px-8 rounded-xl hover:bg-slate-600 transition-colors"
        >
          離開排隊
        </button>
      </div>
    </div>
  );
}

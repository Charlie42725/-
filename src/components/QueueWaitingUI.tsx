'use client';

interface QueueWaitingUIProps {
  totalInQueue: number;
  onLeave: () => void;
}

export default function QueueWaitingUI({
  totalInQueue,
  onLeave,
}: QueueWaitingUIProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="bg-slate-800/50 rounded-3xl p-8 md:p-12 backdrop-blur-sm border border-slate-700/50 max-w-lg mx-auto">
        <div className="text-5xl mb-6">⏳</div>

        <h3 className="text-2xl font-bold text-white mb-2">排隊等待中</h3>

        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 mt-6">
          <p className="text-slate-400 text-sm mb-1">目前排隊人數</p>
          <p className="text-orange-400 font-bold text-3xl">{totalInQueue}</p>
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

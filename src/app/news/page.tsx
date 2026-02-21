import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '最新消息 - 失控事務所',
  description: '失控事務所最新活動消息、新品上架與優惠資訊。',
};

export default function NewsPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
        最新消息
      </h1>
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-8 text-center">
        <p className="text-zinc-400 text-lg">目前尚無最新消息，敬請期待！</p>
      </div>
    </div>
  );
}

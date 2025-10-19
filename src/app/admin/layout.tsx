import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* 頂部導航 */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-orange-400">
                良級懸賞 後台管理
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/admin/brands"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  品牌管理
                </Link>
                <Link
                  href="/admin/series"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  系列管理
                </Link>
                <Link
                  href="/admin/products"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  商品管理
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-slate-300 hover:text-white text-sm"
                target="_blank"
              >
                查看前台 →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateProgress, statusText, statusColor } from '@/types';
import DrawQueueManager from '@/components/DrawQueueManager';
import ProductDetailClient from '@/components/ProductDetailClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { unstable_cache } from 'next/cache';

const getProduct = unstable_cache(
  async (slug: string) => {
    return prisma.product.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        longDescription: true,
        price: true,
        totalTickets: true,
        soldTickets: true,
        status: true,
        coverImage: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: { products: true }
            },
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            prize: true,
            name: true,
            rarity: true,
            value: true,
            stock: true,
            imageUrl: true,
            lotteryDraws: {
              select: { id: true }
            },
          },
          orderBy: { name: 'asc' },
        },
        images: {
          select: {
            id: true,
            url: true,
            type: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },
  ['product-detail'],
  { revalidate: 30 }
);

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // 手動添加抽獎計數到variants
  const productData = {
    ...product,
    variants: product.variants.map(({ lotteryDraws, ...variant }) => ({
      ...variant,
      _count: {
        lotteryDraws: lotteryDraws.length
      }
    }))
  };

  const progress = calculateProgress(product.soldTickets, product.totalTickets);
  const remaining = product.totalTickets - product.soldTickets;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#050505] text-white overflow-hidden flex flex-col lg:flex-row">
      {/* LEFT COLUMN: Immersive Visuals (Sticky/Fixed) */}
      <div className="relative w-full lg:w-[60%] xl:w-[65%] h-[50vh] lg:h-[calc(100vh-80px)] lg:sticky lg:top-20 overflow-hidden group">
        <Image
          src={product.coverImage || `https://picsum.photos/1080/1080?random=${product.id}`}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#050505]/80"></div>

        {/* Live Badge */}
        <div className="absolute top-6 left-6 z-20">
          <div className="live-badge text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase shadow-lg backdrop-blur-md border border-red-500/30 flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            Live Now
          </div>
        </div>

        {/* Series/Brand Info Overlay */}
        <div className="absolute bottom-8 left-8 z-20 max-w-2xl hidden lg:block">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-xs font-bold text-orange-400">
              {product.series.brand.name}
            </span>
            <span className="text-slate-300 text-sm border-l border-white/20 pl-3">
              {product.series.name}
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight anime-glow-text shadow-black drop-shadow-2xl">
            {product.name}
          </h1>
        </div>
      </div>

      {/* RIGHT COLUMN: Action & Data (Scrollable) */}
      <div className="w-full lg:w-[40%] xl:w-[35%] h-auto lg:h-[calc(100vh-80px)] overflow-y-auto bg-[#0a0a0a] border-l border-white/5 relative flex flex-col">

        {/* 1. Mobile Title (Visible only on mobile) */}
        <div className="lg:hidden p-6 pb-0">
          <h1 className="text-2xl font-black text-white leading-tight mb-2">
            {product.name}
          </h1>
        </div>

        {/* 2. Data Header (Sticky on Mobile?) */}
        <div className="p-6 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur z-30 sticky top-0">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Price Per Ticket</p>
              <div className="text-orange-400 font-black text-4xl">
                NT$ {product.price}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Remaining</p>
              <div className="text-green-400 font-black text-4xl">
                {remaining} <span className="text-lg text-slate-500 font-bold">/ {product.totalTickets}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
              <span>
                已售出 {product.soldTickets} 抽
              </span>
              <span className="text-orange-400">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(255,165,0,0.5)] relative overflow-hidden transition-all duration-1000"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>

          {/* Draw Queue Manager (CTA) */}
          <DrawQueueManager
            productId={product.id}
            productPrice={product.price}
            totalTickets={product.totalTickets}
            productStatus={product.status}
          />
        </div>

        {/* 3. Prize List (Scrollable Content) */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <span className="text-xl mr-2">🏆</span> 獎項一覽
            </h2>
            <span className="text-xs text-slate-500">
              {product.series._count.products} Items included
            </span>
          </div>

          {/* Client Component for List View */}
          <ProductDetailClient
            initialVariants={productData.variants}
            productId={product.id}
          />
        </div>

        {/* 4. History / Social Proof */}
        <div className="p-6 border-t border-white/5 bg-[#050505]">
          <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Recent Winners</h3>
          {/* Placeholder for Ticker */}
          <div className="text-xs text-slate-600 italic">
            Waiting for latest draw results...
          </div>
        </div>

      </div>
    </div>
  );
}

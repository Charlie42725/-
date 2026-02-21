import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateProgress } from '@/types';
import DrawQueueManager from '@/components/DrawQueueManager';
import ProductDetailClient from '@/components/ProductDetailClient';
import ProductImageGallery from '@/components/ProductImageGallery';
import QueueStatusBadge from '@/components/QueueStatusBadge';
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
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
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
            _count: {
              select: { lotteryDraws: true }
            },
          },
          orderBy: { name: 'asc' },
        },
        discounts: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            drawCount: true,
            price: true,
            label: true,
            isActive: true,
          },
          orderBy: [{ type: 'asc' }, { drawCount: 'asc' }],
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

  const productData = product;

  const progress = calculateProgress(product.soldTickets, product.totalTickets);
  const remaining = product.totalTickets - product.soldTickets;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-deep text-white">

      {/* === SECTION 1: Product Info (Image + Details side by side) === */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 md:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300 transition-colors">首頁</Link>
          <span>/</span>
          <Link href={`/brands/${product.brand.slug}`} className="hover:text-zinc-300 transition-colors">
            {product.brand.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-300 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT: Image Gallery */}
          <div>
            <ProductImageGallery
              coverImage={product.coverImage}
              images={product.images}
              productName={product.name}
              productId={product.id}
            />
          </div>

          {/* RIGHT: Product Info */}
          <div className="flex flex-col">

            {/* Status Badge */}
            {product.status === 'active' && (
              <div className="mb-4 flex items-center gap-3 flex-wrap">
                <span className="live-badge text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase shadow-lg inline-flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Live Now
                </span>
                <QueueStatusBadge productId={product.id} />
              </div>
            )}

            {/* Brand */}
            <div className="flex items-center gap-3 mb-3">
              <Link
                href={`/brands/${product.brand.slug}`}
                className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-xs font-bold text-amber-400 hover:bg-white/20 transition-colors"
              >
                {product.brand.name}
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white leading-tight mb-4">
              {product.name}
            </h1>

            {/* Description */}
            {product.shortDescription && (
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                {product.shortDescription}
              </p>
            )}

            {/* Price & Remaining */}
            <div className="flex justify-between items-end mb-4 bg-[#111]/80 rounded-xl p-5 border border-white/5">
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">每抽價格</p>
                <div className="text-amber-400 font-black text-3xl">
                  NT$ {product.price}
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">剩餘數量</p>
                <div className="text-green-400 font-black text-3xl">
                  {remaining} <span className="text-base text-zinc-600 font-bold">/ {product.totalTickets}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-zinc-500 mb-1.5 font-bold">
                <span>已售出 {product.soldTickets} 抽</span>
                <span className="text-amber-400">{progress}%</span>
              </div>
              <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Prize List (獎項一覽) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-heading font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-2.27.853 6.003 6.003 0 01-2.27-.853" />
                  </svg>
                  獎項一覽
                </h2>
                <span className="text-xs text-zinc-500">
                  共 {productData.variants.length} 種獎項
                </span>
              </div>
              <ProductDetailClient
                initialVariants={productData.variants}
                productId={product.id}
              />
            </div>

            {/* Long Description */}
            {product.longDescription && (
              <div className="border-t border-white/5 pt-5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">商品說明</h3>
                <p className="text-zinc-500 text-sm leading-relaxed whitespace-pre-line">
                  {product.longDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === SECTION 2: Lottery System (Full Width) === */}
      <div className="border-t border-white/5 bg-surface-deep">
        <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
          <DrawQueueManager
            productId={product.id}
            productPrice={product.price}
            totalTickets={product.totalTickets}
            productStatus={product.status}
            soldTickets={product.soldTickets}
            discounts={product.discounts}
          />
        </div>
      </div>

    </div>
  );
}

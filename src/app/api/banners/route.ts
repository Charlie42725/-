export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache';

// 獲取啟用中的 Banner（前台用）— 60 秒快取
export async function GET() {
  try {
    const banners = await cache.getOrSet(
      'banners:active',
      () => prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      60000
    );

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('獲取 Banner 失敗:', error);
    return NextResponse.json({ error: '獲取 Banner 失敗' }, { status: 500 });
  }
}

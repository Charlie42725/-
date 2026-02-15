import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 獲取啟用中的 Banner（前台用）
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('獲取 Banner 失敗:', error);
    return NextResponse.json({ error: '獲取 Banner 失敗' }, { status: 500 });
  }
}

export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 獲取所有 Banner
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('獲取 Banner 失敗:', error);
    return NextResponse.json({ error: '獲取 Banner 失敗' }, { status: 500 });
  }
}

// 新增 Banner
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, description, imageUrl, imagePositionX, imagePositionY, linkUrl, sortOrder, isActive } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: '標題和圖片網址為必填' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || '',
        description: description || '',
        imageUrl,
        imagePositionX: imagePositionX ?? 50,
        imagePositionY: imagePositionY ?? 50,
        linkUrl: linkUrl || '',
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('新增 Banner 失敗:', error);
    return NextResponse.json({ error: '新增 Banner 失敗' }, { status: 500 });
  }
}

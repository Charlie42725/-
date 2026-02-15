import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 更新 Banner
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { title, subtitle, description, imageUrl, linkUrl, sortOrder, isActive } = body;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle: subtitle ?? '',
        description: description ?? '',
        imageUrl,
        linkUrl: linkUrl ?? '',
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('更新 Banner 失敗:', error);
    return NextResponse.json({ error: '更新 Banner 失敗' }, { status: 500 });
  }
}

// 刪除 Banner
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除 Banner 失敗:', error);
    return NextResponse.json({ error: '刪除 Banner 失敗' }, { status: 500 });
  }
}

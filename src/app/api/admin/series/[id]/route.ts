import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 刪除系列
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.series.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除系列失敗:', error);
    return NextResponse.json({ error: '刪除系列失敗' }, { status: 500 });
  }
}

// 更新系列
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, slug, description, isActive } = body;

    const series = await prisma.series.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('更新系列失敗:', error);
    return NextResponse.json({ error: '更新系列失敗' }, { status: 500 });
  }
}

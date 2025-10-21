import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { validateSlug } from '@/lib/validation';

// 獲取所有品牌（需要管理員權限）
export async function GET(request: Request) {
  try {
    // 驗證管理員權限
    const authResult = await verifyAdmin(request.headers);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
      );
    }

    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            series: true,
          },
        },
      },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('獲取品牌失敗:', error);
    return NextResponse.json({ error: '獲取品牌失敗' }, { status: 500 });
  }
}

// 新增品牌
export async function POST(request: Request) {
  try {
    // 驗證管理員權限
    const authResult = await verifyAdmin(request.headers);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'No authentication token provided' ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: '品牌名稱和 slug 為必填' },
        { status: 400 }
      );
    }

    // 驗證 slug 格式
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json({ error: slugValidation.error }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: unknown) {
    console.error('新增品牌失敗:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug 已存在，請使用不同的 slug' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '新增品牌失敗' }, { status: 500 });
  }
}

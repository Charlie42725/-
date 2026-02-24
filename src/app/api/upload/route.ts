export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: '無法解析上傳資料，檔案可能過大' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;

    if (!file || !file.name) {
      return NextResponse.json(
        { error: '沒有上傳文件' },
        { status: 400 }
      );
    }

    // 檢查文件類型（寬鬆：type 為空也允許，靠副檔名判斷）
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'avif'];
    if (file.type && !file.type.startsWith('image/') && !allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: `不支援此檔案格式（${ext}），僅限圖片` },
        { status: 400 }
      );
    }

    // 檢查大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `檔案過大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 10MB` },
        { status: 400 }
      );
    }

    // 生成安全的文件名
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/[^\w.\-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    const fileName = `uploads/${timestamp}-${safeName || `upload.${ext || 'jpg'}`}`;

    // 上傳到 Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: blob.pathname,
    });
  } catch (error) {
    console.error('上傳圖片失敗:', error);
    const msg = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { error: `上傳圖片失敗：${msg}` },
      { status: 500 }
    );
  }
}

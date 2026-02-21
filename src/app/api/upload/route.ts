export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '沒有上傳文件' },
        { status: 400 }
      );
    }

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只能上傳圖片文件' },
        { status: 400 }
      );
    }

    // 讀取文件內容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成唯一文件名
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-');
    const fileName = `${timestamp}-${originalName}`;

    // 確保上傳目錄存在
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 儲存文件
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 返回可訪問的 URL
    const url = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName,
    });
  } catch (error) {
    console.error('上傳圖片失敗:', error);
    return NextResponse.json(
      { error: '上傳圖片失敗' },
      { status: 500 }
    );
  }
}

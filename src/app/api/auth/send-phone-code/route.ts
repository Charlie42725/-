import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 生成 6 位數字驗證碼
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // 驗證台灣手機號碼格式 (09xxxxxxxx)
    const phoneRegex = /^09\d{8}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: '請輸入有效的台灣手機號碼 (格式: 09xxxxxxxx)' },
        { status: 400 }
      );
    }

    // 檢查該手機號碼是否已註冊
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '此手機號碼已被註冊' },
        { status: 400 }
      );
    }

    // 檢查是否在 1 分鐘內已發送過驗證碼（防止濫用）
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        target: phone,
        type: 'phone',
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        { error: '請稍後再試，驗證碼已發送（1 分鐘內只能發送一次）' },
        { status: 429 }
      );
    }

    // 生成驗證碼
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分鐘後過期

    // 儲存驗證碼
    await prisma.verificationCode.create({
      data: {
        type: 'phone',
        target: phone,
        code,
        expiresAt,
      },
    });

    // TODO: 實際發送簡訊
    // 這裡需要整合簡訊服務（如 Twilio, 台灣三竹簡訊, 詮力科技等）
    // 目前先返回成功，開發環境可以在控制台打印驗證碼
    console.log(`[開發模式] 手機驗證碼: ${code} (發送到 ${phone})`);

    return NextResponse.json({
      success: true,
      message: '驗證碼已發送到您的手機',
      // 開發環境返回驗證碼（生產環境應移除）
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });
  } catch (error) {
    console.error('發送手機驗證碼失敗:', error);
    return NextResponse.json(
      { error: '發送驗證碼失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

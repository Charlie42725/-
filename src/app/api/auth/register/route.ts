import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      emailCode,
      password,
      confirmPassword,
      nickname,
      gender,
      phone,
      phoneCode,
      agreedToTerms,
    } = await request.json();

    // 驗證必填欄位
    if (!email || !emailCode || !password || !confirmPassword || !nickname) {
      return NextResponse.json(
        { error: '請填寫所有必填欄位' },
        { status: 400 }
      );
    }

    // 驗證服務條款同意
    if (!agreedToTerms) {
      return NextResponse.json(
        { error: '請同意服務條款' },
        { status: 400 }
      );
    }

    // 驗證 Email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '請輸入有效的 Email 地址' },
        { status: 400 }
      );
    }

    // 驗證密碼格式 (6-24 字元，英數字 + @_- 符號)
    const passwordRegex = /^[a-zA-Z0-9@_-]{6,24}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: '密碼必須為 6-24 個字元，只能包含英數字及 @ _ - 符號' },
        { status: 400 }
      );
    }

    // 驗證密碼一致性
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: '密碼與確認密碼不一致' },
        { status: 400 }
      );
    }

    // 驗證暱稱長度
    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { error: '暱稱長度必須為 2-20 個字元' },
        { status: 400 }
      );
    }

    // 如果提供了手機號碼，驗證格式
    if (phone) {
      const phoneRegex = /^09\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: '請輸入有效的台灣手機號碼 (格式: 09xxxxxxxx)' },
          { status: 400 }
        );
      }

      // 驗證手機驗證碼
      if (!phoneCode) {
        return NextResponse.json(
          { error: '請輸入手機驗證碼' },
          { status: 400 }
        );
      }
    }

    // 檢查 Email 是否已註冊
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: '此 Email 已被註冊' },
        { status: 400 }
      );
    }

    // 檢查手機號碼是否已註冊
    if (phone) {
      const existingUserByPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUserByPhone) {
        return NextResponse.json(
          { error: '此手機號碼已被註冊' },
          { status: 400 }
        );
      }
    }

    // 驗證 Email 驗證碼
    const emailVerification = await prisma.verificationCode.findFirst({
      where: {
        target: email,
        type: 'email',
        code: emailCode,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!emailVerification) {
      return NextResponse.json(
        { error: 'Email 驗證碼無效或已過期' },
        { status: 400 }
      );
    }

    // 如果提供了手機號碼，驗證手機驗證碼
    let phoneVerification = null;
    if (phone && phoneCode) {
      phoneVerification = await prisma.verificationCode.findFirst({
        where: {
          target: phone,
          type: 'phone',
          code: phoneCode,
          isUsed: false,
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!phoneVerification) {
        return NextResponse.json(
          { error: '手機驗證碼無效或已過期' },
          { status: 400 }
        );
      }
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(password, 10);

    // 建立用戶
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname,
        gender: gender || null,
        phone: phone || null,
        isEmailVerified: true,
        isPhoneVerified: phone ? true : false,
      },
    });

    // 標記驗證碼為已使用
    await prisma.verificationCode.update({
      where: { id: emailVerification.id },
      data: { isUsed: true },
    });

    if (phoneVerification) {
      await prisma.verificationCode.update({
        where: { id: phoneVerification.id },
        data: { isUsed: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: '註冊成功',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error('註冊失敗:', error);
    return NextResponse.json(
      { error: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

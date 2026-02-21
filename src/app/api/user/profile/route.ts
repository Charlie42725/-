export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTokenFromHeaders, verifyToken } from '@/lib/auth';
import { cache } from '@/lib/cache';

// 獲取用戶完整資料（包含點數）
export async function GET(req: NextRequest) {
  try {
    // 從請求中獲取 token
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    // 驗證 token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '登入已過期，請重新登入' },
        { status: 401 }
      );
    }

    // 檢查快取（2秒 TTL）
    const cacheKey = `user:profile:${payload.userId}`;
    const cachedUser = cache.get(cacheKey);

    if (cachedUser) {
      return NextResponse.json({ user: cachedUser });
    }

    // 從資料庫查詢最新的用戶資料
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        phone: true,
        gender: true,
        points: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '用戶不存在' },
        { status: 404 }
      );
    }

    // 儲存到快取（2秒）
    cache.set(cacheKey, user, 2000);

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: '查詢用戶資料失敗' },
      { status: 500 }
    );
  }
}

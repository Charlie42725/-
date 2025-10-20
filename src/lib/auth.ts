import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface JWTPayload {
  userId: number;
  email: string;
  nickname: string;
}

// 驗證 JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// 從 cookie 或 Authorization header 取得 token
export function getTokenFromHeaders(headers: Headers): string | null {
  // 嘗試從 Authorization header 取得
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 嘗試從 cookie 取得
  const cookieHeader = headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies['auth_token'] || null;
  }

  return null;
}

// 客戶端：從 localStorage 或 cookie 取得用戶資訊
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
  }

  return null;
}

// 客戶端：取得 token
export function getAuthToken() {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem('auth_token');
}

// 客戶端：檢查是否已登入
export function isAuthenticated() {
  return !!getAuthToken();
}

// 客戶端：登出
export function logout() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');

  // 清除 cookie
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

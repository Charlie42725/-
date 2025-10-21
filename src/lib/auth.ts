import jwt from 'jsonwebtoken';

// JWT_SECRET 環境變數（在運行時驗證）
const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: number;
  email: string;
  nickname: string;
  role?: 'user' | 'admin';  // 新增角色欄位
}

// 驗證 JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // 確保 decoded 是有效的對象且包含必要屬性
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JWTPayload;
    }
    return null;
  } catch {
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

// 服務端：驗證管理員權限
export async function verifyAdmin(headers: Headers): Promise<{ success: boolean; payload?: JWTPayload; error?: string }> {
  const token = getTokenFromHeaders(headers);

  if (!token) {
    return { success: false, error: 'No authentication token provided' };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return { success: false, error: 'Invalid or expired token' };
  }

  // 檢查是否為管理員（這裡先檢查 role，後續可以查詢資料庫）
  if (payload.role !== 'admin') {
    return { success: false, error: 'Insufficient permissions' };
  }

  return { success: true, payload };
}

// 服務端：驗證用戶身份（不需要管理員權限）
export async function verifyUser(headers: Headers): Promise<{ success: boolean; payload?: JWTPayload; error?: string }> {
  const token = getTokenFromHeaders(headers);

  if (!token) {
    return { success: false, error: 'No authentication token provided' };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return { success: false, error: 'Invalid or expired token' };
  }

  return { success: true, payload };
}

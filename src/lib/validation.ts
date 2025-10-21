/**
 * 輸入驗證工具函數
 */

// 驗證並解析 ID 參數
export function validateId(idStr: string | null): { valid: boolean; id?: number; error?: string } {
  if (!idStr) {
    return { valid: false, error: 'ID is required' };
  }

  const id = parseInt(idStr, 10);

  if (isNaN(id) || id <= 0) {
    return { valid: false, error: 'Invalid ID format' };
  }

  return { valid: true, id };
}

// 驗證分頁參數
export function validatePagination(
  limitStr: string | null,
  offsetStr: string | null
): { limit: number; offset: number } {
  let limit = parseInt(limitStr || '50', 10);
  let offset = parseInt(offsetStr || '0', 10);

  // 設置邊界值
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > 100) limit = 100;  // 最多 100 條

  if (isNaN(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

// 驗證 slug 格式（只允許字母、數字、連字符、底線）
export function validateSlug(slug: string | null): { valid: boolean; slug?: string; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }

  // Slug 格式驗證：允許字母、數字、連字符、底線、中文字符
  const slugRegex = /^[\w\u4e00-\u9fa5-]+$/;

  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Invalid slug format' };
  }

  if (slug.length > 256) {
    return { valid: false, error: 'Slug is too long (max 256 characters)' };
  }

  return { valid: true, slug };
}

// 驗證枚舉值
export function validateEnum<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  fieldName: string = 'Value'
): { valid: boolean; value?: T; error?: string } {
  if (!value) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    };
  }

  return { valid: true, value: value as T };
}

// 驗證票號
export function validateTicketNumbers(ticketNumbers: unknown): { valid: boolean; numbers?: number[]; error?: string } {
  if (!Array.isArray(ticketNumbers)) {
    return { valid: false, error: 'Ticket numbers must be an array' };
  }

  if (ticketNumbers.length === 0) {
    return { valid: false, error: 'At least one ticket number is required' };
  }

  if (ticketNumbers.length > 100) {
    return { valid: false, error: 'Cannot draw more than 100 tickets at once' };
  }

  const numbers: number[] = [];
  for (const num of ticketNumbers) {
    if (typeof num !== 'number' || !Number.isInteger(num) || num < 1) {
      return { valid: false, error: 'Invalid ticket number format' };
    }
    numbers.push(num);
  }

  // 檢查是否有重複
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== numbers.length) {
    return { valid: false, error: 'Duplicate ticket numbers detected' };
  }

  return { valid: true, numbers };
}

// 驗證電子郵件
export function validateEmail(email: string | null): { valid: boolean; email?: string; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, email };
}

// 驗證手機號碼（台灣格式）
export function validatePhone(phone: string | null): { valid: boolean; phone?: string; error?: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  // 台灣手機號碼：09開頭，共10碼
  const phoneRegex = /^09\d{8}$/;

  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone number format (must be 09xxxxxxxx)' };
  }

  return { valid: true, phone };
}

import crypto from 'crypto';

// 綠界測試帳號
const TEST_CONFIG = {
  merchantId: '3002607',
  hashKey: 'pwFHCqoQZGmho4w6',
  hashIV: 'EkRm7iFT261dpevs',
  checkoutUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

interface ECPayConfig {
  merchantId: string;
  hashKey: string;
  hashIV: string;
  checkoutUrl: string;
}

export function getConfig(): ECPayConfig {
  const mode = process.env.ECPAY_MODE || 'test';

  if (mode === 'production') {
    const merchantId = process.env.ECPAY_MERCHANT_ID;
    const hashKey = process.env.ECPAY_HASH_KEY;
    const hashIV = process.env.ECPAY_HASH_IV;

    if (!merchantId || !hashKey || !hashIV) {
      throw new Error('ECPay production credentials not configured');
    }

    return {
      merchantId,
      hashKey,
      hashIV,
      checkoutUrl: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5',
    };
  }

  return TEST_CONFIG;
}

// 綠界專用 URL encoding（相容 .NET HttpUtility.UrlEncode）
export function ecpayUrlEncode(str: string): string {
  let encoded = encodeURIComponent(str);
  // 綠界規定的特殊字元轉換（對齊 .NET 行為）
  encoded = encoded.replace(/\!/g, '%21');
  encoded = encoded.replace(/\*/g, '%2A');
  encoded = encoded.replace(/\(/g, '%28');
  encoded = encoded.replace(/\)/g, '%29');
  encoded = encoded.replace(/\'/g, '%27');
  encoded = encoded.replace(/%20/g, '+');
  return encoded.toLowerCase();
}

// 產生 CheckMacValue
export function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): string {
  // 1. 依照參數名稱排序（A-Z，不分大小寫）
  const sortedKeys = Object.keys(params).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // 2. 組合成 key=value& 字串
  const paramStr = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

  // 3. 頭尾加上 HashKey 和 HashIV
  const raw = `HashKey=${hashKey}&${paramStr}&HashIV=${hashIV}`;

  // 4. URL encode（綠界專用）
  const encoded = ecpayUrlEncode(raw);

  // 5. SHA256 → 大寫
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

interface PaymentFormParams {
  orderNumber: string;
  amount: number;
  itemName: string;
  returnUrl: string;      // server-to-server callback（綠界主動通知）
  orderResultUrl: string;  // 付款完成後自動導回的頁面
  clientBackUrl?: string;  // 付款頁面「返回商店」按鈕連結（選填）
}

interface PaymentFormResult {
  formData: Record<string, string>;
  checkoutUrl: string;
}

export function buildPaymentFormData(params: PaymentFormParams): PaymentFormResult {
  const config = getConfig();

  // 產生交易時間（格式：yyyy/MM/dd HH:mm:ss）
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const merchantTradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const formParams: Record<string, string> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: params.orderNumber.slice(0, 20), // 綠界限制 20 字元
    MerchantTradeDate: merchantTradeDate,
    PaymentType: 'aio',
    TotalAmount: params.amount.toString(),
    TradeDesc: '良級懸賞點數購買',
    ItemName: params.itemName,
    ReturnURL: params.returnUrl,
    OrderResultURL: params.orderResultUrl,
    ChoosePayment: 'ALL',
    EncryptType: '1', // SHA256
    CustomField1: params.orderNumber, // 存完整訂單編號供 callback 使用
  };

  // 產生 CheckMacValue
  const checkMacValue = generateCheckMacValue(formParams, config.hashKey, config.hashIV);
  formParams.CheckMacValue = checkMacValue;

  return {
    formData: formParams,
    checkoutUrl: config.checkoutUrl,
  };
}

// 驗證綠界回呼的 CheckMacValue
export function verifyCallbackCheckMacValue(params: Record<string, string>): boolean {
  const config = getConfig();

  // 取出 CheckMacValue，其餘參數用於驗證
  const { CheckMacValue, ...rest } = params;
  if (!CheckMacValue) return false;

  const expected = generateCheckMacValue(rest, config.hashKey, config.hashIV);
  return expected === CheckMacValue;
}

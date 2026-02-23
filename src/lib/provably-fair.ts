/**
 * Provably Fair 抽獎驗證系統
 *
 * 演算法：
 *   hash  = HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)
 *   roll  = parseInt(hash[0..7], 16)   // 32-bit unsigned
 *   index = roll % totalWeight
 *   → 按 variantId 升序累加 remaining，第一個累計 > index 的即中獎
 *
 * PHP 驗證只需 hash_hmac() + hexdec()，不需要 GMP。
 */

import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────

export interface VariantForDraw {
  id: number;
  remaining: number;
}

export interface DrawInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface DrawOutcome {
  variantId: number;
  hashResult: string;
  roll: number;
}

// ─── Seed helpers ───────────────────────────────────────

/** 產生 32-byte hex server seed */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** SHA-256 hash（公開承諾） */
export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

/** 產生 16-byte hex client seed（當使用者未提供時） */
export function generateClientSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ─── Core draw logic ────────────────────────────────────

/** HMAC-SHA256(serverSeed, clientSeed:nonce) → hex string */
export function computeDrawHash(input: DrawInput): string {
  const message = `${input.clientSeed}:${input.nonce}`;
  return crypto
    .createHmac('sha256', input.serverSeed)
    .update(message)
    .digest('hex');
}

/** 取前 8 hex 字元轉 32-bit unsigned integer */
export function extractRoll(hashHex: string, offset = 0): number {
  const slice = hashHex.substring(offset, offset + 8);
  return parseInt(slice, 16) >>> 0; // >>> 0 確保 unsigned
}

/**
 * 加權選擇：按 variantId 升序累加 remaining，
 * 第一個使累計 > index 的 variant 即中獎。
 *
 * @param roll      - 32-bit unsigned random
 * @param variants  - 必須已按 id 升序排列
 */
export function selectVariant(
  roll: number,
  variants: VariantForDraw[]
): number {
  const totalWeight = variants.reduce((s, v) => s + v.remaining, 0);
  if (totalWeight === 0) throw new Error('所有獎項已全部抽完');

  const index = roll % totalWeight;
  let cumulative = 0;

  for (const v of variants) {
    cumulative += v.remaining;
    if (cumulative > index) {
      return v.id;
    }
  }

  // fallback（理論上不會到這裡）
  return variants[variants.length - 1].id;
}

/**
 * 完整一抽流程：hash → roll → selectVariant
 */
export function determineDrawOutcome(
  input: DrawInput,
  variants: VariantForDraw[]
): DrawOutcome {
  // 確保按 id 升序排列
  const sorted = [...variants].sort((a, b) => a.id - b.id);
  const hashResult = computeDrawHash(input);
  const roll = extractRoll(hashResult);
  const variantId = selectVariant(roll, sorted);
  return { variantId, hashResult, roll };
}

/**
 * Hash-based Fisher-Yates shuffle（取代 Math.random）
 * 用於 batch open 模式的號碼洗牌。
 *
 * 每一步 i 用 HMAC-SHA256(serverSeed, clientSeed:shuffle:i) 的前 8 hex
 * 產生一個 deterministic random index。
 */
export function hashBasedShuffle<T>(
  arr: T[],
  serverSeed: string,
  clientSeed: string
): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const message = `${clientSeed}:shuffle:${i}`;
    const hash = crypto
      .createHmac('sha256', serverSeed)
      .update(message)
      .digest('hex');
    const rand = parseInt(hash.substring(0, 8), 16) >>> 0;
    const j = rand % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Provably Fair - Deck Shuffle v1
 *
 * 演算法：
 *   1. 建牌：按 variantId 升序，每個 variant 出現 stock 次
 *   2. 洗牌：Fisher-Yates，每步用 HMAC-SHA256(serverSeed, String(i))
 *      for i = len-1 downto 1:
 *        hash = HMAC-SHA256(serverSeed, String(i))
 *        j = parseInt(hash[0..7], 16) % (i + 1)
 *        swap(deck[i], deck[j])
 *   3. 對應：ticket #N → deck[N-1]
 *
 * 不需要 clientSeed、nonce。
 * PHP 驗證只需 hash_hmac() + hexdec()，不需要 GMP。
 */

import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────

export interface VariantForDeck {
  id: number;
  stock: number;
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

// ─── Deck Shuffle v1 ───────────────────────────────────

/**
 * 建立未洗牌的 deck：按 variantId 升序，每個 variant 出現 stock 次。
 *
 * 例：A賞(id=5)×3, B賞(id=8)×5, C賞(id=12)×2
 * → deck = [5,5,5, 8,8,8,8,8, 12,12]
 */
export function buildDeck(variants: VariantForDeck[]): number[] {
  const sorted = [...variants].sort((a, b) => a.id - b.id);
  const deck: number[] = [];
  for (const v of sorted) {
    for (let i = 0; i < v.stock; i++) {
      deck.push(v.id);
    }
  }
  return deck;
}

/**
 * HMAC-based Fisher-Yates shuffle。
 *
 * for i = len-1 downto 1:
 *   hash = HMAC-SHA256(serverSeed, String(i))
 *   j = parseInt(hash[0..7], 16) % (i + 1)
 *   swap(deck[i], deck[j])
 */
export function shuffleDeck(deck: number[], serverSeed: string): number[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const hash = crypto
      .createHmac('sha256', serverSeed)
      .update(String(i))
      .digest('hex');
    const j = (parseInt(hash.substring(0, 8), 16) >>> 0) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * buildDeck + shuffleDeck 合一。
 * 回傳洗好的牌組，index 0 對應 ticket #1。
 */
export function getShuffledDeck(variants: VariantForDeck[], serverSeed: string): number[] {
  return shuffleDeck(buildDeck(variants), serverSeed);
}

/**
 * 批次查詢：給定 ticketNumbers，回傳每張票對應的 variantId。
 * ticketNumber 從 1 開始。
 */
export function getMultipleTicketResults(
  variants: VariantForDeck[],
  serverSeed: string,
  ticketNumbers: number[]
): Array<{ ticketNumber: number; variantId: number }> {
  const deck = getShuffledDeck(variants, serverSeed);
  return ticketNumbers.map(n => ({
    ticketNumber: n,
    variantId: deck[n - 1],
  }));
}

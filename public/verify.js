#!/usr/bin/env node
/**
 * Provably Fair 驗證腳本 (JavaScript)
 *
 * 演算法：
 *   hash  = HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)
 *   roll  = parseInt(hash.substring(0, 8), 16) >>> 0   // 32-bit unsigned
 *   index = roll % totalWeight
 *   → 按 variantId 升序累加 remaining，第一個累計 > index 的即中獎
 *
 * Node.js 使用方式：
 *   node verify.js < data.json
 *   或：cat data.json | node verify.js
 *
 * 瀏覽器使用方式：
 *   <script src="verify.js"></script>
 *   const result = ProvablyFair.verify(data);
 *
 * JSON 格式：
 * {
 *   "serverSeed": "hex...",
 *   "variants": [
 *     { "id": 1, "initialStock": 5 },
 *     { "id": 2, "initialStock": 10 }
 *   ],
 *   "draws": [
 *     { "nonce": 0, "clientSeed": "hex...", "variantId": 2, "hashResult": "hex..." },
 *     ...
 *   ]
 * }
 */

(function (exports) {
  'use strict';

  // ─── Crypto helpers (Node.js vs Browser) ───────────────

  let hmacSha256;

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    // Browser: SubtleCrypto (async)
    hmacSha256 = async function (key, message) {
      const enc = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
      return Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };
  } else {
    // Node.js: crypto module (sync wrapped in async)
    const nodeCrypto = require('crypto');
    hmacSha256 = async function (key, message) {
      return nodeCrypto
        .createHmac('sha256', key)
        .update(message)
        .digest('hex');
    };
  }

  // ─── Core functions ────────────────────────────────────

  async function computeDrawHash(serverSeed, clientSeed, nonce) {
    const message = clientSeed + ':' + nonce;
    return hmacSha256(serverSeed, message);
  }

  function extractRoll(hashHex, offset) {
    offset = offset || 0;
    return parseInt(hashHex.substring(offset, offset + 8), 16) >>> 0;
  }

  function selectVariant(roll, variants) {
    let totalWeight = 0;
    for (let i = 0; i < variants.length; i++) {
      totalWeight += variants[i].remaining;
    }
    if (totalWeight === 0) throw new Error('所有獎項已全部抽完');

    const index = roll % totalWeight;
    let cumulative = 0;

    for (let i = 0; i < variants.length; i++) {
      cumulative += variants[i].remaining;
      if (cumulative > index) {
        return variants[i].id;
      }
    }

    return variants[variants.length - 1].id;
  }

  async function verify(data) {
    const serverSeed = data.serverSeed;
    const variants = data.variants.slice().sort(function (a, b) { return a.id - b.id; });
    const draws = data.draws.slice().sort(function (a, b) { return a.nonce - b.nonce; });

    // 建立剩餘庫存 tracker
    const remaining = {};
    for (let i = 0; i < variants.length; i++) {
      remaining[variants[i].id] = variants[i].initialStock;
    }

    const results = [];
    let passCount = 0;
    let failCount = 0;

    for (let d = 0; d < draws.length; d++) {
      const draw = draws[d];
      const nonce = draw.nonce;
      const clientSeed = draw.clientSeed;
      const expectedVariantId = draw.variantId;
      const expectedHash = draw.hashResult || null;

      // 計算 hash
      const hash = await computeDrawHash(serverSeed, clientSeed, nonce);
      const hashMatch = (expectedHash === null) || (hash === expectedHash);

      // 計算 roll
      const roll = extractRoll(hash);

      // 建立當前庫存快照
      const currentVariants = [];
      for (let i = 0; i < variants.length; i++) {
        const rem = remaining[variants[i].id];
        if (rem > 0) {
          currentVariants.push({ id: variants[i].id, remaining: rem });
        }
      }

      // 選擇 variant
      const computedVariantId = selectVariant(roll, currentVariants);
      const variantMatch = (computedVariantId === expectedVariantId);

      // 更新庫存
      if (remaining[computedVariantId] !== undefined) {
        remaining[computedVariantId]--;
      }

      const pass = hashMatch && variantMatch;
      if (pass) passCount++; else failCount++;

      results.push({
        nonce: nonce,
        clientSeed: clientSeed,
        hash: hash,
        hashMatch: hashMatch,
        roll: roll,
        computedVariantId: computedVariantId,
        expectedVariantId: expectedVariantId,
        variantMatch: variantMatch,
        pass: pass,
      });
    }

    return {
      totalDraws: draws.length,
      passed: passCount,
      failed: failCount,
      allPassed: (failCount === 0),
      results: results,
    };
  }

  // ─── Export ────────────────────────────────────────────

  exports.computeDrawHash = computeDrawHash;
  exports.extractRoll = extractRoll;
  exports.selectVariant = selectVariant;
  exports.verify = verify;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.ProvablyFair = {}));

// ─── CLI 入口 (Node.js only) ────────────────────────────

if (typeof require !== 'undefined' && require.main === module) {
  (async function () {
    let input = '';
    process.stdin.setEncoding('utf8');

    for await (const chunk of process.stdin) {
      input += chunk;
    }

    if (!input.trim()) {
      process.stderr.write('Usage: node verify.js < data.json\n');
      process.stderr.write('  或: cat data.json | node verify.js\n');
      process.exit(1);
    }

    let data;
    try {
      data = JSON.parse(input);
    } catch (e) {
      process.stderr.write('Error: 無法解析 JSON 輸入\n');
      process.exit(1);
    }

    if (!data.serverSeed || !data.variants || !data.draws) {
      process.stderr.write('Error: JSON 必須包含 serverSeed, variants, draws\n');
      process.exit(1);
    }

    const result = await module.exports.verify(data);

    process.stdout.write(JSON.stringify(result, null, 2) + '\n');

    process.stderr.write('\n=== 驗證結果 ===\n');
    process.stderr.write('總抽數: ' + result.totalDraws + '\n');
    process.stderr.write('通過:   ' + result.passed + '\n');
    process.stderr.write('失敗:   ' + result.failed + '\n');
    process.stderr.write(result.allPassed ? '✓ 全部通過\n' : '✗ 有失敗項目\n');

    process.exit(result.allPassed ? 0 : 1);
  })();
}

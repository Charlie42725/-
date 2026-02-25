#!/usr/bin/env node
/**
 * Provably Fair 驗證腳本 (JavaScript) - Deck Shuffle v1
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
 * Node.js 使用方式：
 *   node verify.js < data.json
 *
 * 瀏覽器使用方式：
 *   <script src="verify.js"></script>
 *   const result = await ProvablyFair.verify(data);
 *
 * JSON 格式（deck-shuffle-v1）：
 * {
 *   "serverSeed": "hex...",
 *   "serverSeedHash": "hex...",
 *   "variants": [
 *     { "id": 1, "initialStock": 5 },
 *     { "id": 2, "initialStock": 10 }
 *   ],
 *   "draws": [
 *     { "ticketNumber": 1, "variantId": 2 },
 *     ...
 *   ]
 * }
 */

(function (exports) {
  'use strict';

  // ─── Crypto helpers (Node.js vs Browser) ───────────────

  var hmacSha256, sha256;

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    // Browser: SubtleCrypto (async)
    hmacSha256 = async function (key, message) {
      var enc = new TextEncoder();
      var cryptoKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      var sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
      return Array.from(new Uint8Array(sig))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    };
    sha256 = async function (message) {
      var enc = new TextEncoder();
      var hash = await crypto.subtle.digest('SHA-256', enc.encode(message));
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    };
  } else {
    // Node.js: crypto module (sync wrapped in async)
    var nodeCrypto = require('crypto');
    hmacSha256 = async function (key, message) {
      return nodeCrypto
        .createHmac('sha256', key)
        .update(message)
        .digest('hex');
    };
    sha256 = async function (message) {
      return nodeCrypto
        .createHash('sha256')
        .update(message)
        .digest('hex');
    };
  }

  // ─── Deck Shuffle v1 ────────────────────────────────────

  function buildDeck(variants) {
    var sorted = variants.slice().sort(function (a, b) { return a.id - b.id; });
    var deck = [];
    for (var i = 0; i < sorted.length; i++) {
      var stock = sorted[i].initialStock !== undefined ? sorted[i].initialStock : (sorted[i].stock || 0);
      for (var j = 0; j < stock; j++) {
        deck.push(sorted[i].id);
      }
    }
    return deck;
  }

  async function shuffleDeck(deck, serverSeed) {
    var result = deck.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var hash = await hmacSha256(serverSeed, String(i));
      var j = (parseInt(hash.substring(0, 8), 16) >>> 0) % (i + 1);
      var tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  async function getShuffledDeck(variants, serverSeed) {
    return shuffleDeck(buildDeck(variants), serverSeed);
  }

  // ─── Verify (deck-shuffle-v1) ───────────────────────────

  async function verify(data) {
    var serverSeed     = data.serverSeed;
    var serverSeedHash = data.serverSeedHash || null;
    var variants       = data.variants;
    var draws          = data.draws;

    // 驗證 serverSeedHash
    var seedHashMatch = true;
    if (serverSeedHash !== null) {
      var computedHash = await sha256(serverSeed);
      seedHashMatch = (computedHash === serverSeedHash);
    }

    // 檢測演算法版本：如果 draws 中有 nonce 欄位且不為 null → legacy
    var hasLegacyDraws = false;
    for (var i = 0; i < draws.length; i++) {
      if (draws[i].nonce !== undefined && draws[i].nonce !== null) {
        hasLegacyDraws = true;
        break;
      }
    }

    if (hasLegacyDraws) {
      return verifyLegacy(data);
    }

    // deck-shuffle-v1 驗證
    var deck = await getShuffledDeck(variants, serverSeed);

    var results = [];
    var passCount = 0;
    var failCount = 0;

    for (var d = 0; d < draws.length; d++) {
      var draw = draws[d];
      var ticketNumber      = draw.ticketNumber;
      var expectedVariantId = draw.variantId;

      var computedVariantId = deck[ticketNumber - 1];
      var pass = (computedVariantId === expectedVariantId);

      if (pass) passCount++; else failCount++;

      results.push({
        ticketNumber: ticketNumber,
        computedVariantId: computedVariantId,
        expectedVariantId: expectedVariantId,
        pass: pass,
      });
    }

    return {
      algorithm: 'deck-shuffle-v1',
      seedHashMatch: seedHashMatch,
      totalDraws: draws.length,
      passed: passCount,
      failed: failCount,
      allPassed: (failCount === 0 && seedHashMatch),
      results: results,
    };
  }

  // ─── Legacy 演算法（向後相容）──────────────────────────

  async function computeDrawHashLegacy(serverSeed, clientSeed, nonce) {
    var message = clientSeed + ':' + nonce;
    return hmacSha256(serverSeed, message);
  }

  function extractRollLegacy(hashHex, offset) {
    offset = offset || 0;
    return parseInt(hashHex.substring(offset, offset + 8), 16) >>> 0;
  }

  function selectVariantLegacy(roll, variants) {
    var totalWeight = 0;
    for (var i = 0; i < variants.length; i++) {
      totalWeight += variants[i].remaining;
    }
    if (totalWeight === 0) throw new Error('所有獎項已全部抽完');

    var index = roll % totalWeight;
    var cumulative = 0;

    for (var i = 0; i < variants.length; i++) {
      cumulative += variants[i].remaining;
      if (cumulative > index) {
        return variants[i].id;
      }
    }

    return variants[variants.length - 1].id;
  }

  async function verifyLegacy(data) {
    var serverSeed     = data.serverSeed;
    var serverSeedHash = data.serverSeedHash || null;
    var variants = data.variants.slice().sort(function (a, b) { return a.id - b.id; });
    var draws    = data.draws.slice().sort(function (a, b) { return a.nonce - b.nonce; });

    var seedHashMatch = true;
    if (serverSeedHash !== null) {
      var computedHash = await sha256(serverSeed);
      seedHashMatch = (computedHash === serverSeedHash);
    }

    var remaining = {};
    for (var i = 0; i < variants.length; i++) {
      remaining[variants[i].id] = variants[i].initialStock;
    }

    var results = [];
    var passCount = 0;
    var failCount = 0;

    for (var d = 0; d < draws.length; d++) {
      var draw = draws[d];
      var nonce = draw.nonce;
      var clientSeed = draw.clientSeed;
      var expectedVariantId = draw.variantId;
      var expectedHash = draw.hashResult || null;

      var hash = await computeDrawHashLegacy(serverSeed, clientSeed, nonce);
      var hashMatch = (expectedHash === null) || (hash === expectedHash);

      var roll = extractRollLegacy(hash);

      var currentVariants = [];
      for (var i = 0; i < variants.length; i++) {
        var rem = remaining[variants[i].id];
        if (rem > 0) {
          currentVariants.push({ id: variants[i].id, remaining: rem });
        }
      }

      var computedVariantId = selectVariantLegacy(roll, currentVariants);
      var variantMatch = (computedVariantId === expectedVariantId);

      if (remaining[computedVariantId] !== undefined) {
        remaining[computedVariantId]--;
      }

      var pass = hashMatch && variantMatch;
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
      algorithm: 'legacy',
      seedHashMatch: seedHashMatch,
      totalDraws: draws.length,
      passed: passCount,
      failed: failCount,
      allPassed: (failCount === 0 && seedHashMatch),
      results: results,
    };
  }

  // ─── Export ────────────────────────────────────────────

  exports.buildDeck = buildDeck;
  exports.shuffleDeck = shuffleDeck;
  exports.getShuffledDeck = getShuffledDeck;
  exports.verify = verify;
  exports.verifyLegacy = verifyLegacy;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.ProvablyFair = {}));

// ─── CLI 入口 (Node.js only) ────────────────────────────

if (typeof require !== 'undefined' && require.main === module) {
  (async function () {
    var input = '';
    process.stdin.setEncoding('utf8');

    for await (var chunk of process.stdin) {
      input += chunk;
    }

    if (!input.trim()) {
      process.stderr.write('Usage: node verify.js < data.json\n');
      process.stderr.write('  或: cat data.json | node verify.js\n');
      process.exit(1);
    }

    var data;
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

    var result = await module.exports.verify(data);

    process.stdout.write(JSON.stringify(result, null, 2) + '\n');

    process.stderr.write('\n=== 驗證結果 ===\n');
    process.stderr.write('演算法: ' + result.algorithm + '\n');
    if (result.seedHashMatch !== undefined) {
      process.stderr.write('Seed Hash: ' + (result.seedHashMatch ? '匹配' : '不匹配') + '\n');
    }
    process.stderr.write('總抽數: ' + result.totalDraws + '\n');
    process.stderr.write('通過:   ' + result.passed + '\n');
    process.stderr.write('失敗:   ' + result.failed + '\n');
    process.stderr.write(result.allPassed ? '✓ 全部通過\n' : '✗ 有失敗項目\n');

    process.exit(result.allPassed ? 0 : 1);
  })();
}

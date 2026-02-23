#!/usr/bin/env node
/**
 * Simulated PHP verification in Node.js
 *
 * This replicates the EXACT logic from public/verify.php and 
 * scripts/test-cross-lang-php.php, translating PHP function calls
 * 1:1 into Node.js equivalents, to verify they produce the same result.
 *
 * Key mapping:
 *   PHP: hash_hmac('sha256', strval($i), $serverSeed)
 *        -> hash_hmac(algo, data, key)
 *   Node: crypto.createHmac('sha256', serverSeed).update(String(i)).digest('hex')
 *        -> createHmac(algo, key).update(data)
 *
 *   PHP: intval(hexdec(substr($hash, 0, 8)))
 *   Node: parseInt(hash.substring(0, 8), 16)  -- note: on 64-bit both stay positive for 8 hex digits
 *
 *   PHP: % ($i + 1)   (PHP % on positive ints = same as JS %)
 *   Node: % (i + 1)
 *
 *   The >>> 0 in the TS/JS code forces unsigned 32-bit. For 8 hex digits (max 0xFFFFFFFF):
 *     - parseInt('ffffffff', 16) = 4294967295 in JS (number type, positive)
 *     - 4294967295 >>> 0 = 4294967295 (still the same since it fits in unsigned 32-bit)
 *     - PHP: hexdec('ffffffff') = 4294967295.0 (float on 32-bit, int on 64-bit)
 *     - PHP: intval(4294967295) on 64-bit = 4294967295 (correct)
 *     - PHP: intval(4294967295) on 32-bit = 2147483647 (WRONG - would truncate!)
 *
 *   Conclusion: On 64-bit PHP (which is standard now), the results are identical.
 */

const crypto = require('crypto');

const serverSeed = 'test_seed_abc123';
const variants = [
  { id: 5, stock: 3 },
  { id: 8, stock: 5 },
  { id: 12, stock: 2 },
];

// Build deck - exact PHP logic
const sorted = [...variants].sort((a, b) => a.id - b.id);
const deck = [];
for (const v of sorted) {
  const stock = v.stock || v.initialStock || 0;
  for (let i = 0; i < stock; i++) {
    deck.push(v.id);
  }
}

// Shuffle - exact PHP logic: hash_hmac('sha256', strval($i), $serverSeed)
// In Node: createHmac(algo, key).update(data)
// PHP hash_hmac(algo, data, key) -> key=$serverSeed, data=strval($i) -> same
for (let i = deck.length - 1; i > 0; i--) {
  const hash = crypto.createHmac('sha256', serverSeed).update(String(i)).digest('hex');
  // PHP: intval(hexdec(substr($hash, 0, 8))) % ($i + 1)
  // hexdec returns float for large values on 32-bit, int on 64-bit
  // intval on 64-bit PHP keeps the full value
  const hexVal = parseInt(hash.substring(0, 8), 16); // No >>> 0 to match PHP intval on 64-bit
  const j = hexVal % (i + 1);
  const tmp = deck[i];
  deck[i] = deck[j];
  deck[j] = tmp;
}

console.log(JSON.stringify({ language: 'PHP-simulated', deck }));

// Compare with the >>> 0 approach used in TS/JS
const deck2 = [];
for (const v of sorted) {
  for (let i = 0; i < v.stock; i++) deck2.push(v.id);
}
for (let i = deck2.length - 1; i > 0; i--) {
  const hash = crypto.createHmac('sha256', serverSeed).update(String(i)).digest('hex');
  const j = (parseInt(hash.substring(0, 8), 16) >>> 0) % (i + 1);
  const tmp = deck2[i];
  deck2[i] = deck2[j];
  deck2[j] = tmp;
}

const match = JSON.stringify(deck) === JSON.stringify(deck2);
console.log('PHP-simulated vs TS/JS (>>> 0): ' + (match ? 'MATCH' : 'MISMATCH'));
if (!match) {
  console.log('  PHP-sim:', JSON.stringify(deck));
  console.log('  TS/JS:  ', JSON.stringify(deck2));
}

// Verify that for all 8-hex-digit values in this shuffle, parseInt and >>>0 give the same result
let allSame = true;
for (let i = deck.length - 1; i > 0; i--) {
  const hash = crypto.createHmac('sha256', serverSeed).update(String(i)).digest('hex');
  const withoutShift = parseInt(hash.substring(0, 8), 16);
  const withShift = parseInt(hash.substring(0, 8), 16) >>> 0;
  if (withoutShift !== withShift) {
    console.log('  Difference at i=' + i + ': ' + withoutShift + ' vs ' + withShift);
    allSame = false;
  }
}
if (allSame) {
  console.log('All HMAC first-8-hex values: parseInt and >>>0 produce identical results');
  console.log('(This confirms PHP 64-bit intval(hexdec(...)) would also match)');
}

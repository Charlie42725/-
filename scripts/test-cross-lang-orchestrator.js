#!/usr/bin/env node
/**
 * Cross-language deck-shuffle-v1 consistency test
 *
 * Runs the shuffle algorithm via:
 *   1. TypeScript (src/lib/provably-fair.ts via npx tsx)
 *   2. JavaScript (public/verify.js via node)
 *   3. PHP (scripts/test-cross-lang-php.php via php) -- if available
 *
 * Compares that all produce identical deck arrays.
 */

const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

// ──────────────────────────────────────────────

const serverSeed = 'test_seed_abc123';
const variants = [
  { id: 5, stock: 3 },
  { id: 8, stock: 5 },
  { id: 12, stock: 2 },
];

console.log('=== deck-shuffle-v1 Cross-Language Consistency Test ===\n');
console.log('Parameters:');
console.log('  serverSeed:', serverSeed);
console.log('  variants:', JSON.stringify(variants));
console.log('  expected deck length:', variants.reduce((s, v) => s + v.stock, 0));
console.log('');

// Also compute expected intermediate values for debugging
console.log('--- Step-by-step HMAC debug (first 3 steps) ---');
const deck0 = [];
const sorted = [...variants].sort((a, b) => a.id - b.id);
for (const v of sorted) {
  for (let k = 0; k < v.stock; k++) deck0.push(v.id);
}
console.log('  Initial deck:', JSON.stringify(deck0));

for (let i = deck0.length - 1; i >= Math.max(1, deck0.length - 3); i--) {
  const hash = crypto.createHmac('sha256', serverSeed).update(String(i)).digest('hex');
  const first8 = hash.substring(0, 8);
  const parsed = parseInt(first8, 16) >>> 0;
  const j = parsed % (i + 1);
  console.log('  i=' + i + ': HMAC[0..7]=' + first8 + ', parseInt=' + parsed + ', j=' + parsed + '%' + (i+1) + '=' + j + ', swap deck[' + i + ']<->deck[' + j + ']');
}
console.log('');

// ──────────────────────────────────────────────

const results = {};

// 1. TypeScript via npx tsx
console.log('--- Running TypeScript (npx tsx) ---');
try {
  const tsOut = execSync(
    'npx tsx "' + path.join(ROOT, 'scripts', 'test-cross-lang-ts.ts') + '"',
    { cwd: ROOT, encoding: 'utf8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
  const tsResult = JSON.parse(tsOut);
  results.TypeScript = tsResult.deck;
  console.log('  Deck:', JSON.stringify(tsResult.deck));
  console.log('  OK\n');
} catch (err) {
  console.log('  FAILED:', (err.stderr || err.message || '').substring(0, 500));
  console.log('');
}

// 2. JavaScript via node
console.log('--- Running JavaScript (Node.js) ---');
try {
  const jsOut = execSync(
    'node "' + path.join(ROOT, 'scripts', 'test-cross-lang-js.js') + '"',
    { cwd: ROOT, encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
  const jsResult = JSON.parse(jsOut);
  results.JavaScript = jsResult.deck;
  console.log('  Deck:', JSON.stringify(jsResult.deck));
  console.log('  OK\n');
} catch (err) {
  console.log('  FAILED:', (err.stderr || err.message || '').substring(0, 500));
  console.log('');
}

// 3. PHP (if available)
console.log('--- Running PHP ---');
try {
  execSync('which php', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  try {
    const phpOut = execSync(
      'php "' + path.join(ROOT, 'scripts', 'test-cross-lang-php.php') + '"',
      { cwd: ROOT, encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    const phpResult = JSON.parse(phpOut);
    results.PHP = phpResult.deck;
    console.log('  Deck:', JSON.stringify(phpResult.deck));
    console.log('  OK\n');
  } catch (err2) {
    console.log('  FAILED:', (err2.stderr || err2.message || '').substring(0, 500));
    console.log('');
  }
} catch (err) {
  console.log('  SKIPPED: PHP not available on this system\n');
}

// ──────────────────────────────────────────────
// Comparison

console.log('=== Comparison Results ===\n');

const langs = Object.keys(results);
if (langs.length < 2) {
  console.log('ERROR: Need at least 2 languages to compare. Only got:', langs.join(', '));
  process.exit(1);
}

const reference = results[langs[0]];
const referenceStr = JSON.stringify(reference);
let allMatch = true;

for (let i = 1; i < langs.length; i++) {
  const other = results[langs[i]];
  const otherStr = JSON.stringify(other);
  const match = referenceStr === otherStr;
  if (!match) allMatch = false;
  console.log('  ' + langs[0] + ' vs ' + langs[i] + ': ' + (match ? 'MATCH' : 'MISMATCH'));
  if (!match) {
    // Find first difference
    for (let k = 0; k < Math.max(reference.length, other.length); k++) {
      if (reference[k] !== other[k]) {
        console.log('    First difference at index ' + k + ': ' + reference[k] + ' vs ' + other[k]);
        break;
      }
    }
  }
}

console.log('');

// Ticket mapping display
console.log('--- Ticket -> VariantId mapping ---');
const refLang = langs[0];
if (results[refLang]) {
  for (let t = 0; t < results[refLang].length; t++) {
    console.log('  Ticket #' + (t + 1) + ' -> variantId ' + results[refLang][t]);
  }
}

console.log('');

if (allMatch) {
  console.log('RESULT: ALL LANGUAGES PRODUCE IDENTICAL DECKS');
  process.exit(0);
} else {
  console.log('RESULT: MISMATCH DETECTED -- implementations are NOT consistent');
  process.exit(1);
}

/**
 * Cross-language test: TypeScript runner
 * Uses the actual src/lib/provably-fair.ts module
 */
import { getShuffledDeck } from '../src/lib/provably-fair';

const serverSeed = 'test_seed_abc123';
const variants = [
  { id: 5, stock: 3 },
  { id: 8, stock: 5 },
  { id: 12, stock: 2 },
];

const deck = getShuffledDeck(variants, serverSeed);
console.log(JSON.stringify({ language: 'TypeScript', deck }));

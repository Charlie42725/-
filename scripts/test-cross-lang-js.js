/**
 * Cross-language test: JavaScript (Node.js) runner
 * Uses the public/verify.js module
 */
const pf = require('../public/verify.js');

const serverSeed = 'test_seed_abc123';
const variants = [
  { id: 5, stock: 3 },
  { id: 8, stock: 5 },
  { id: 12, stock: 2 },
];

(async () => {
  const deck = await pf.getShuffledDeck(variants, serverSeed);
  console.log(JSON.stringify({ language: 'JavaScript', deck }));
})();

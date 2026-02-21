/**
 * Patch .prisma/client/default.js to avoid the `#main-entry-point` subpath
 * import issue in Node.js 22 + Prisma v6 + CJS environments.
 *
 * Run this after `prisma generate` (handled automatically via postinstall).
 */
const fs = require('fs');
const path = require('path');

const defaultJsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '.prisma',
  'client',
  'default.js'
);

if (!fs.existsSync(defaultJsPath)) {
  console.log('⚠️  .prisma/client/default.js not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(defaultJsPath, 'utf-8');

if (content.includes("require('#main-entry-point')")) {
  content = content.replace(/require\('#main-entry-point'\)/g, "require('./index.js')");
  fs.writeFileSync(defaultJsPath, content);
  console.log('✅ Patched .prisma/client/default.js (#main-entry-point → ./index.js)');
} else {
  console.log('ℹ️  .prisma/client/default.js already patched or pattern not found.');
}

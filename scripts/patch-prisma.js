/**
 * Patch Prisma client default.js to resolve `#main-entry-point` subpath import issue.
 * Affects: Node.js 22 + Prisma v6 + CJS on Windows with non-ASCII paths.
 *
 * Patches BOTH:
 *   node_modules/.prisma/client/default.js
 *   node_modules/@prisma/client/default.js
 */
const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'default.js'),
  path.join(__dirname, '..', 'node_modules', '@prisma', 'client', 'default.js'),
];

let anyPatched = false;

for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  Not found, skipping: ${file}`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf-8');

  if (!content.includes('#main-entry-point')) {
    console.log(`ℹ️  Already clean: ${path.relative(process.cwd(), file)}`);
    continue;
  }

  const patched = content.replace(/#main-entry-point/g, './index.js');
  fs.writeFileSync(file, patched, 'utf-8');
  console.log(`✅ Patched: ${path.relative(process.cwd(), file)}`);
  anyPatched = true;
}

if (!anyPatched) {
  console.log('✅ All Prisma client files are already clean.');
}

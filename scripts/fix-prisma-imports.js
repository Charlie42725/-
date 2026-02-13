/**
 * 修復 Prisma 6.x 的 #main-entry-point subpath import 問題
 *
 * Prisma 生成的 default.js 使用 require('#main-entry-point')，
 * 某些環境（如 Windows + 非 ASCII 路徑）的 Node.js 無法正確解析。
 * 此腳本將 default.js 中的 #main-entry-point 替換為 ./index.js。
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'default.js');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('#main-entry-point')) {
    const fixed = content.replace('#main-entry-point', './index.js');
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log('✅ Patched .prisma/client/default.js: replaced #main-entry-point with ./index.js');
  } else {
    console.log('✅ .prisma/client/default.js already patched or does not need patching');
  }
} catch (err) {
  console.warn('⚠️ Could not patch .prisma/client/default.js:', err.message);
}

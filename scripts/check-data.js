// 콘텐츠 데이터 검사: node scripts/check-data.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'js', 'data.js'));
const { CATEGORIES, ITEMS } = global.window;
const names = new Set(CATEGORIES.map((c) => c.name));
const seen = new Set();
const errors = [];
for (const it of ITEMS) {
  for (const k of ['id', 'category', 'emoji', 'title', 'summary', 'body', 'more']) {
    if (!it[k] || typeof it[k] !== 'string') errors.push(`${it.id || '?'}: '${k}' 비어 있음`);
  }
  if (seen.has(it.id)) errors.push(`${it.id}: id 중복`);
  seen.add(it.id);
  if (!names.has(it.category)) errors.push(`${it.id}: 없는 카테고리 '${it.category}'`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK — 카테고리 ${CATEGORIES.length}개, 콘텐츠 ${ITEMS.length}개`);

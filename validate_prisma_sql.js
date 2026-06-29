const fs = require('fs');
const schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
const sql = fs.readFileSync('cole.db.sql', 'utf8');
const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
const fieldRegex = /^\s*([A-Za-z0-9_]+)\s+([A-Za-z0-9_\[\]?]+).*/;
let match;
const errors = [];
let count = 0;
while ((match = modelRegex.exec(schema)) !== null) {
  count++;
  const name = match[1];
  const body = match[2];
  const fields = [];
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@') || trimmed.startsWith('@')) continue;
    const fieldMatch = trimmed.match(fieldRegex);
    if (fieldMatch) fields.push(fieldMatch[1]);
  }
  const mapRegex = new RegExp('model\\s+' + name + '[\\s\\S]*?@@map\\("([^"]+)"\\)', 'm');
  const tableName = mapRegex.test(schema) ? schema.match(mapRegex)[1] : name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's';
  const tableMatch = new RegExp('CREATE TABLE\\s+' + tableName + '\\s*\\(([^]*?)\\);', 'm');
  const tableBlock = sql.match(tableMatch);
  if (!tableBlock) {
    errors.push(`MISSING TABLE ${tableName} for model ${name}`);
    continue;
  }
  const block = tableBlock[1];
  const sqlFields = [];
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const fieldMatch = trimmed.match(fieldRegex);
    if (fieldMatch) sqlFields.push(fieldMatch[1]);
  }
  if (JSON.stringify(sqlFields) !== JSON.stringify(fields)) {
    errors.push(`${name}/${tableName}:\n  expected: ${JSON.stringify(fields)}\n  got:      ${JSON.stringify(sqlFields)}`);
  }
}
console.log(`MODELS: ${count}`);
if (errors.length) {
  console.error('ERRORS:', errors.length);
  errors.forEach(e => {
    console.error(e);
  });
  process.exit(1);
} else {
  console.log('OK: SQL schema matches Prisma model field names and tables.');
}

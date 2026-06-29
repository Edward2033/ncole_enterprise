import re
from pathlib import Path
schema = Path('backend/prisma/schema.prisma').read_text(encoding='utf-8')
models = re.findall(r'model\s+(\w+)\s*\{([^}]*)\}', schema, re.MULTILINE | re.DOTALL)
errors = []
for name, body in models:
    fields = []
    for line in body.splitlines():
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@') or line.startswith('@'):
            continue
        m = re.match(r'([A-Za-z0-9_]+)\s+([A-Za-z0-9_\[\]?]+)', line)
        if m:
            fields.append(m.group(1))
    map_match = re.search(r'model\s+' + re.escape(name) + r'.*?@@map\("([^"]+)"\)', schema, re.S)
    table = map_match.group(1) if map_match else '_'.join(re.findall('[A-Z][^A-Z]*', name)).lower() + 's'
    sql = Path('cole.db.sql').read_text(encoding='utf-8')
    m = re.search(r'CREATE TABLE\s+' + re.escape(table) + r'\s*\((.*?)\);', sql, re.S)
    if not m:
        errors.append(f'MISSING TABLE: model {name} expects table {table}')
        continue
    block = m.group(1)
    sql_fields = [row.strip().split()[0] for row in re.findall(r'\n\s*([A-Za-z0-9_]+)\s+', block)]
    if sql_fields != fields:
        errors.append(f'MISMATCH {name} ({table})\n  expected: {fields}\n  got:      {sql_fields}')
if errors:
    print('\n'.join(errors))
    print(f'ERRORS: {len(errors)}')
else:
    print('OK: SQL schema matches Prisma model field names and tables')

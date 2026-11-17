#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

python3 - <<'PY'
from pathlib import Path
import secrets

path = Path('.env')
lines = path.read_text(encoding='utf-8').splitlines()
changed = False

for name, size in (('SECRET_KEY', 48), ('POSTGRES_PASSWORD', 32)):
    indices = []
    values = []
    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('export '):
            stripped = stripped[7:].lstrip()
        key, sep, value = stripped.partition('=')
        if sep and key.strip() == name:
            indices.append(index)
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                value = value[1:-1]
            values.append(value)
    if any(values):
        continue
    value = secrets.token_urlsafe(size)
    if indices:
        lines[indices[-1]] = f'{name}={value}'
    else:
        lines.append(f'{name}={value}')
    changed = True

if changed:
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('Local .env is ready; generated secrets are kept out of the output.')
PY

docker compose up --build -d
docker compose ps

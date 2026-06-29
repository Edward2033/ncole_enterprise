#!/bin/sh
# restore.sh — Restore PostgreSQL from backup
# Usage: ./restore.sh /backups/ncole_backup_20260101_020000.sql.gz

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database. Confirm? (yes/no)"
read -r confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-ncole}" \
  -d "${POSTGRES_DB:-ncole_interpress}" \
  --no-password < <(gunzip -c "$BACKUP_FILE")

echo "[$(date)] Restore complete."

#!/bin/sh
# backup.sh — Daily PostgreSQL backup
# Schedule via cron: 0 2 * * * /scripts/backup.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="ncole_backup_${DATE}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup: $FILENAME"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-ncole}" \
  -d "${POSTGRES_DB:-ncole_interpress}" \
  --no-password \
  --verbose \
  --format=plain \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup complete: ${BACKUP_DIR}/${FILENAME} ($(du -sh ${BACKUP_DIR}/${FILENAME} | cut -f1))"

# Remove old backups
find "$BACKUP_DIR" -name "ncole_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"

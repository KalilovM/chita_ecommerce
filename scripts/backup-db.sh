#!/usr/bin/env bash
# =============================================================
# backup-db.sh — Daily PostgreSQL backup for Chita E-Commerce
# =============================================================
# Usage:
#   bash scripts/backup-db.sh
#
# Called daily by cron (setup via deploy.sh).
# Keeps the last 30 days of backups.
# =============================================================

set -euo pipefail

# ---------- Configuration ----------
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
ENV_FILE="${PROJECT_DIR}/.env.production"
BACKUP_DIR="${PROJECT_DIR}/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
CONTAINER_NAME="ecommerce_chita_db"

# ---------- Colors ----------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[BACKUP]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- Load env ----------
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
fi

DB_NAME="${POSTGRES_DB:-ecommerce_chita}"
DB_USER="${POSTGRES_USER:-ecommerce_user}"

# ---------- Create backup directory ----------
mkdir -p "$BACKUP_DIR"

# ---------- Run backup ----------
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

log "Starting database backup..."
log "  Database: ${DB_NAME}"
log "  Output:   ${BACKUP_FILE}"

if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --clean --if-exists | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup complete ✓ (${BACKUP_SIZE})"
else
    error "Backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# ---------- Prune old backups ----------
log "Pruning backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)

if [[ "$DELETED" -gt 0 ]]; then
    log "Deleted ${DELETED} old backup(s)"
else
    log "No old backups to prune"
fi

# ---------- Summary ----------
TOTAL=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "Backups: ${TOTAL} files, ${TOTAL_SIZE} total"

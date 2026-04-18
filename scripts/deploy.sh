#!/usr/bin/env bash
# =============================================================
# deploy.sh — Production deployment for gala75.ru
# =============================================================
# Usage:
#   bash scripts/deploy.sh
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - DNS A records for gala75.ru and www.gala75.ru → VPS IP
#   - .env.production file with real credentials
# =============================================================

set -euo pipefail

# ---------- Configuration ----------
DOMAIN="gala75.ru"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
ENV_FILE="${PROJECT_DIR}/.env.production"
NGINX_DIR="${PROJECT_DIR}/nginx"
BACKUP_DIR="${PROJECT_DIR}/backups"

# ---------- Colors ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }

# =============================================================
# Pre-flight checks
# =============================================================
preflight() {
    log "Running pre-flight checks..."

    # Docker
    if ! command -v docker &>/dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Docker Compose
    if ! docker compose version &>/dev/null; then
        error "Docker Compose V2 is not available. Please update Docker."
        exit 1
    fi

    # .env.production
    if [[ ! -f "$ENV_FILE" ]]; then
        error ".env.production not found!"
        info  "Copy the template and fill in real values:"
        info  "  cp .env.production.example .env.production"
        exit 1
    fi

    # Check for placeholder values
    if grep -q "CHANGE_ME" "$ENV_FILE"; then
        error ".env.production still contains CHANGE_ME placeholders!"
        info  "Please update all placeholder values before deploying."
        exit 1
    fi

    log "Pre-flight checks passed ✓"
}

# =============================================================
# Create required directories
# =============================================================
setup_dirs() {
    log "Setting up directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$NGINX_DIR"
}

# =============================================================
# SSL Certificate provisioning
# =============================================================
setup_ssl() {
    log "Checking SSL certificate..."

    # Check if cert already exists in the certbot volume
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        run --rm --entrypoint "" certbot \
        test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" 2>/dev/null; then
        log "SSL certificate already exists ✓"
        return 0
    fi

    log "SSL certificate not found — provisioning with Certbot..."

    # Step 1: Start with the HTTP-only Nginx config for ACME challenge
    info "Swapping to initial HTTP-only Nginx config..."
    cp "${NGINX_DIR}/nginx-initial.conf" "${NGINX_DIR}/nginx-active.conf"

    # Use the initial config temporarily
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        run -d --rm --name ecommerce_nginx_init \
        -p 80:80 \
        -v "${NGINX_DIR}/nginx-active.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(docker volume inspect --format '{{ .Mountpoint }}' "$(basename "$PROJECT_DIR")_certbot_www" 2>/dev/null || echo 'certbot_www'):/var/www/certbot:ro" \
        nginx nginx:1.27-alpine 2>/dev/null || true

    # Alternative: stop existing services and start just nginx with initial config
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down 2>/dev/null || true

    # Create a temporary override to use the initial nginx config
    log "Starting Nginx with HTTP-only config for ACME challenge..."

    # Start services with the initial config
    cp "${NGINX_DIR}/nginx-initial.conf" "${NGINX_DIR}/nginx.conf.bak"
    cp "${NGINX_DIR}/nginx-initial.conf" "${NGINX_DIR}/nginx.conf.tmp"

    # We need to temporarily replace the nginx config
    local ORIG_CONF="${NGINX_DIR}/nginx.conf"
    local ORIG_BACKUP="${NGINX_DIR}/nginx.conf.orig"
    cp "$ORIG_CONF" "$ORIG_BACKUP"
    cp "${NGINX_DIR}/nginx-initial.conf" "$ORIG_CONF"

    # Start only nginx and wait for it
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx 2>/dev/null || {
        # If app isn't healthy yet, start postgres first, then app, then nginx
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
        sleep 10
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d app
        sleep 15
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx
    }

    sleep 5

    # Step 2: Request the certificate
    log "Requesting SSL certificate from Let's Encrypt..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        run --rm certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        -d "www.${DOMAIN}" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal

    # Step 3: Restore the full SSL config
    log "Restoring full SSL Nginx config..."
    cp "$ORIG_BACKUP" "$ORIG_CONF"
    rm -f "$ORIG_BACKUP" "${NGINX_DIR}/nginx.conf.bak" "${NGINX_DIR}/nginx.conf.tmp" "${NGINX_DIR}/nginx-active.conf"

    # Step 4: Reload Nginx with the SSL config
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec nginx nginx -s reload 2>/dev/null || {
        # If reload fails, restart the whole stack
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    }

    log "SSL certificate provisioned ✓"
}

# =============================================================
# Build & start services
# =============================================================
deploy_services() {
    log "Building and starting production services..."

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

    log "Waiting for app container to become healthy..."

    # Poll Docker's own health status (HEALTHCHECK in Dockerfile handles the actual probe)
    local retries=30
    while [[ $retries -gt 0 ]]; do
        local health_status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' ecommerce_chita_app 2>/dev/null || echo "not_found")

        if [[ "$health_status" == "healthy" ]]; then
            log "Application is healthy ✓"
            break
        elif [[ "$health_status" == "unhealthy" ]]; then
            warn "Container is unhealthy. Last health check log:"
            docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' ecommerce_chita_app 2>/dev/null | tail -5
            break
        fi

        retries=$((retries - 1))
        info "Waiting for app to start... status=${health_status} (${retries} retries left)"
        sleep 5
    done

    if [[ $retries -eq 0 ]]; then
        warn "App did not become healthy within timeout. Check logs:"
        warn "  docker compose -f docker-compose.prod.yml --env-file .env.production logs app"
    fi
}

# =============================================================
# Run database migrations
# =============================================================
run_migrations() {
    log "Running Prisma database migrations..."

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        exec -T app npx prisma migrate deploy 2>/dev/null || {
        warn "prisma migrate deploy failed — trying db push as fallback..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T app npx prisma db push
    }

    log "Database migrations complete ✓"
}

# =============================================================
# Setup cron jobs
# =============================================================
setup_cron() {
    log "Setting up cron jobs..."

    local CRON_MARKER="# chita-ecommerce-managed"

    # Remove existing managed cron entries
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab - 2>/dev/null || true

    # Add new cron entries
    (
        crontab -l 2>/dev/null || true
        # Certbot renewal — twice daily (only renews if cert is near expiry)
        echo "0 3,15 * * * docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} exec -T certbot certbot renew --quiet && docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} exec -T nginx nginx -s reload ${CRON_MARKER}"
        # Database backup — daily at 2:00 AM
        echo "0 2 * * * bash ${PROJECT_DIR}/scripts/backup-db.sh ${CRON_MARKER}"
        # Docker system prune — weekly on Sunday at 4:00 AM
        echo "0 4 * * 0 docker system prune -f --volumes --filter 'until=168h' ${CRON_MARKER}"
    ) | crontab -

    log "Cron jobs configured ✓"
    info "  - SSL renewal:   03:00 & 15:00 daily"
    info "  - DB backup:     02:00 daily"
    info "  - Docker prune:  04:00 Sunday"
}

# =============================================================
# Print deployment summary
# =============================================================
print_summary() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    info "Domain:    https://${DOMAIN}"
    info "App:       http://localhost:3000 (internal)"
    echo ""
    info "Useful commands:"
    info "  View logs:     docker compose -f docker-compose.prod.yml --env-file .env.production logs -f"
    info "  App logs:      docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app"
    info "  Nginx logs:    docker compose -f docker-compose.prod.yml --env-file .env.production logs -f nginx"
    info "  DB backup:     bash scripts/backup-db.sh"
    info "  Restart:       docker compose -f docker-compose.prod.yml --env-file .env.production restart"
    info "  Rebuild:       docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
    info "  Stop:          docker compose -f docker-compose.prod.yml --env-file .env.production down"
    echo ""
}

# =============================================================
# Main
# =============================================================
main() {
    log "Starting production deployment for ${DOMAIN}..."
    echo ""

    cd "$PROJECT_DIR"

    preflight
    setup_dirs
    deploy_services
    setup_ssl
    # Restart with SSL config if certificate was just provisioned
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate nginx
    run_migrations
    setup_cron
    print_summary
}

main "$@"

#!/usr/bin/env bash
# =============================================================
# deploy.sh - Production deployment for gala75.ru
# =============================================================
# Usage:
#   bash scripts/deploy.sh
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - DNS A records for gala75.ru and www.gala75.ru -> VPS IP
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
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }

# =============================================================
# Pre-flight checks
# =============================================================
preflight() {
    log "Running pre-flight checks..."

    if ! command -v docker &>/dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker compose version &>/dev/null; then
        error "Docker Compose V2 is not available. Please update Docker."
        exit 1
    fi

    if [[ ! -f "$ENV_FILE" ]]; then
        error ".env.production not found!"
        info "Copy the template and fill in real values:"
        info "  cp .env.production.example .env.production"
        exit 1
    fi

    if grep -q "CHANGE_ME" "$ENV_FILE"; then
        error ".env.production still contains CHANGE_ME placeholders!"
        info "Please update all placeholder values before deploying."
        exit 1
    fi

    log "Pre-flight checks passed"
}

# =============================================================
# Create required directories
# =============================================================
setup_dirs() {
    log "Setting up directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$NGINX_DIR"
}

cert_exists() {
    docker run --rm \
        -v "$(basename "$PROJECT_DIR")_certbot_conf:/etc/letsencrypt:ro" \
        busybox \
        test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" 2>/dev/null
}

# =============================================================
# SSL Certificate provisioning
# =============================================================
setup_ssl() {
    log "Checking SSL certificate..."

    if cert_exists; then
        log "SSL certificate already exists"
        return 0
    fi

    log "SSL certificate not found - provisioning with Certbot..."

    info "Stopping all services to free port 80..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down 2>/dev/null || true

    info "Starting temporary HTTP-only Nginx for ACME challenge..."
    docker run -d --rm \
        --name ecommerce_nginx_acme \
        -p 80:80 \
        -v "${NGINX_DIR}/nginx-initial.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(basename "$PROJECT_DIR")_certbot_www:/var/www/certbot:ro" \
        nginx:1.27-alpine

    sleep 3

    if ! docker ps --format '{{.Names}}' | grep -q "ecommerce_nginx_acme"; then
        error "Temporary Nginx failed to start. Check nginx/nginx-initial.conf."
        exit 1
    fi

    log "Requesting SSL certificate from Let's Encrypt..."
    docker run --rm \
        -v "$(basename "$PROJECT_DIR")_certbot_conf:/etc/letsencrypt" \
        -v "$(basename "$PROJECT_DIR")_certbot_www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        -d "www.${DOMAIN}" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    local certbot_exit=$?

    info "Stopping temporary Nginx..."
    docker stop ecommerce_nginx_acme 2>/dev/null || true

    if [[ $certbot_exit -ne 0 ]]; then
        error "Certbot failed (exit $certbot_exit). Common causes:"
        error "  - DNS A record for ${DOMAIN} not pointing to this server"
        error "  - Port 80 blocked by a firewall"
        error "  - Rate-limit hit on Let's Encrypt (try again later)"
        exit 1
    fi

    if ! cert_exists; then
        error "Certbot finished but the certificate files were not found."
        exit 1
    fi

    log "SSL certificate provisioned"
}

# =============================================================
# Build and start services
# =============================================================
deploy_services() {
    log "Building and starting production services..."

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

    log "Waiting for app container to become healthy..."

    local retries=30
    while [[ $retries -gt 0 ]]; do
        local health_status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' ecommerce_chita_app 2>/dev/null || echo "not_found")

        if [[ "$health_status" == "healthy" ]]; then
            log "Application is healthy"
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

    info "Verifying HTTP to HTTPS redirect..."
    local http_status
    http_status=$(curl -sS -o /dev/null -I -w '%{http_code}' --max-time 10 "http://${DOMAIN}" || true)

    if [[ "$http_status" == "301" || "$http_status" == "308" ]]; then
        log "HTTP redirect is working"
    else
        warn "Expected HTTP redirect from http://${DOMAIN}, got status=${http_status:-unreachable}"
        warn "Check nginx logs if the site still does not redirect correctly."
    fi
}

# =============================================================
# Run database migrations
# =============================================================
run_migrations() {
    log "Running Prisma database migrations..."

    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm migrate; then
        log "Database migrations complete"
    else
        error "Migration failed. Check the output above."
        error "You can re-run manually: docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate"
        exit 1
    fi
}

# =============================================================
# Setup cron jobs
# =============================================================
setup_cron() {
    log "Setting up cron jobs..."

    local CRON_MARKER="# chita-ecommerce-managed"

    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab - 2>/dev/null || true

    (
        crontab -l 2>/dev/null || true
        echo "0 3,15 * * * docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} exec -T certbot certbot renew --quiet && docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} exec -T nginx nginx -s reload ${CRON_MARKER}"
        echo "0 2 * * * bash ${PROJECT_DIR}/scripts/backup-db.sh ${CRON_MARKER}"
        echo "0 4 * * 0 docker system prune -f --volumes --filter 'until=168h' ${CRON_MARKER}"
    ) | crontab -

    log "Cron jobs configured"
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
    setup_ssl
    deploy_services
    run_migrations
    setup_cron
    print_summary
}

main "$@"

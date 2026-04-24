#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# deploy.sh — Grupo Barros | grupobarros.com.ec
# Uso: bash deploy.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

DOMAIN="grupobarros.com.ec"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "════════════════════════════════════════════"
echo "  DEPLOY — Grupo Barros"
echo "  Dominio: $DOMAIN"
echo "════════════════════════════════════════════"
echo ""

# ── 1. Dependencias del sistema ──────────────────────────────────────────────
echo "▶ [1/7] Instalando dependencias del sistema..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl

# ── 2. Carpeta para certbot http-challenge ───────────────────────────────────
mkdir -p /var/www/certbot

# ── 3. Nginx HTTP-only (para certbot challenge) ──────────────────────────────
echo "▶ [2/7] Configurando Nginx (HTTP temporal para certbot)..."
cp "$PROJECT_DIR/nginx/$DOMAIN.http.conf" /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx

# ── 4. Certificado SSL con Certbot ───────────────────────────────────────────
echo "▶ [3/7] Obteniendo certificado SSL..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN
    echo "  ✅ Certificado SSL instalado"
else
    echo "  ℹ️  Certificado ya existe, saltando..."
fi

# ── 5. Nginx HTTPS (configuración completa) ──────────────────────────────────
echo "▶ [4/7] Activando configuración Nginx HTTPS..."
cp "$PROJECT_DIR/nginx/$DOMAIN.conf" /etc/nginx/sites-available/$DOMAIN
nginx -t && systemctl reload nginx

# ── 6. Renovación automática de certificado (cron) ───────────────────────────
echo "▶ [5/7] Configurando renovación automática SSL..."
CRON_JOB="0 3 * * * certbot renew --quiet && systemctl reload nginx"
( crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB" ) | crontab -
echo "  ✅ Cron configurado (renovación diaria a las 3am)"

# ── 7. Construir y levantar contenedores ─────────────────────────────────────
echo "▶ [6/7] Construyendo imágenes Docker..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker image prune -f
docker compose -f docker-compose.prod.yml build --no-cache

echo "▶ [7/7] Levantando servicios..."
docker compose -f docker-compose.prod.yml up -d

echo "  Esperando que la base de datos esté lista..."
sleep 8

echo "  Ejecutando migraciones..."
docker compose -f docker-compose.prod.yml exec -T backend node scripts/migrate-auth.js
docker compose -f docker-compose.prod.yml exec -T backend node scripts/migrate-rifas.js
docker compose -f docker-compose.prod.yml exec -T backend node scripts/migrate-pagos.js    || true
docker compose -f docker-compose.prod.yml exec -T backend node scripts/migrate-contifico.js

# ── Estado final ─────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  Estado de los contenedores:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "  ✅ Deploy completado"
echo "  🌐 https://$DOMAIN"
echo "════════════════════════════════════════════"
echo ""

#!/bin/bash
# deploy.sh — Deploy frontend a Surge.sh
# Gestion de Salones de Belleza
#
# Uso: bash deploy/deploy.sh                      → deploy a gestion-desalones-de-belleza.surge.sh
#      bash deploy/deploy.sh --domain miproyecto   → deploy a miproyecto.surge.sh
#      bash deploy/deploy.sh --custom              → deploy con CNAME custom (na-west1.surge.sh)
#      bash deploy/deploy.sh --preview             → deploy a preview (gestion-desalones-de-belleza-preview.surge.sh)
#
# Variables de entorno:
#   SURGE_LOGIN  — email de Surge (default: streethead01@gmail.com)
#   SURGE_TOKEN  — token de Surge (de CREDENCIALES.md o "surge token")
#
# Prerequisito: surge CLI instalado (npm install -g surge)

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATIC_DIR="$ROOT_DIR/static"
SURGE_ENV="$ROOT_DIR/deploy/.env.surge"
DEPLOY_LOG="$ROOT_DIR/deploy/deploy.log"

# Valores por defecto
PROJECT_NAME="gestion-desalones-de-belleza"
DEFAULT_DOMAIN="$PROJECT_NAME.surge.sh"
DOMAIN="$DEFAULT_DOMAIN"
CUSTOM_DOMAIN=""
DOMAIN_CNAME="na-west1.surge.sh"
PREVIEW=false

# ─── Parsear argumentos ───
for arg in "$@"; do
    case "$arg" in
        --preview) PREVIEW=true ;;
        --custom)  CUSTOM_DOMAIN="$DOMAIN_CNAME" ;;
        --domain=*) DOMAIN="${arg#*=}" ;;
        --domain) echo "❌ Usa: --domain=midominio.surge.sh"; exit 1 ;;
        --help|-h)
            echo "🚀 Deploy Manager — Surge.sh deploy script"
            echo ""
            echo "Uso: bash deploy/deploy.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --domain=DOM   Desplegar a DOM.surge.sh"
            echo "  --custom       Usar CNAME custom: $DOMAIN_CNAME"
            echo "  --preview      Desplegar a preview ($PROJECT_NAME-preview.surge.sh)"
            echo "  --help         Mostrar esta ayuda"
            echo ""
            echo "Ejemplos:"
            echo "  bash deploy/deploy.sh"
            echo "  bash deploy/deploy.sh --preview"
            echo "  bash deploy/deploy.sh --custom"
            echo "  bash deploy/deploy.sh --domain=misalon.surge.sh"
            exit 0
            ;;
    esac
done

if [ "$PREVIEW" = true ]; then
    DOMAIN="$PROJECT_NAME-preview.surge.sh"
    echo "🔍 Modo PREVIEW → dominio: $DOMAIN"
fi

if [ -n "$CUSTOM_DOMAIN" ]; then
    DOMAIN="$CUSTOM_DOMAIN"
    echo "🔗 Modo CUSTOM → dominio: $DOMAIN (CNAME: na-west1.surge.sh)"
fi

# ─── Verificar prerequisitos ───
echo ""
echo "━━━ 🚀 Deploy Manager — Surge.sh ━━━"

# 1. Verificar surge CLI
if ! command -v surge &> /dev/null; then
    echo "❌ surge CLI no instalado."
    echo "   Instalalo con: npm install -g surge"
    exit 1
fi
echo "✅ surge CLI instalado"

# 2. Verificar static/
if [ ! -d "$STATIC_DIR" ]; then
    echo "❌ No existe static/ en $STATIC_DIR"
    echo "   Crea el directorio y colocá los archivos del frontend allí."
    exit 1
fi
echo "✅ static/ presente ($(find "$STATIC_DIR" -type f | wc -l) archivos)"

# 3. Cargar credenciales
if [ -f "$SURGE_ENV" ]; then
    echo "📂 Cargando credenciales desde $SURGE_ENV"
    source "$SURGE_ENV"
fi

SURGE_LOGIN="${SURGE_LOGIN:-streethead01@gmail.com}"

if [ -z "$SURGE_TOKEN" ]; then
    # Si no hay token pero surge ya está logueado, funciona igual
    echo "⚠️  SURGE_TOKEN no definido. Se usará login interactivo o sesión existente."
    echo "   Para evitar prompts, definí SURGE_TOKEN en deploy/.env.surge"
    echo "   (obtenelo con: surge token)"
    echo ""
fi

export SURGE_LOGIN
export SURGE_TOKEN

# ─── Ejecutar deploy ───
echo ""
echo "━━━ 📦 Deployando a Surge ━━━"
echo "   📁 Origen:  $STATIC_DIR"
echo "   🌐 Dominio: https://$DOMAIN"
echo "   👤 Login:   $SURGE_LOGIN"
echo ""

# Ejecutar surge (piped para evitar output interactivo innecesario)
if [ -n "$SURGE_TOKEN" ]; then
    surge "$STATIC_DIR" --domain "$DOMAIN" 2>&1 | tee "$DEPLOY_LOG"
else
    surge "$STATIC_DIR" --domain "$DOMAIN" 2>&1 | tee "$DEPLOY_LOG"
fi

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    DEPLOY_URL=$(grep -oP 'https?://[^\s]+' "$DEPLOY_LOG" | head -1)
    echo "━━━ ✅ DEPLOY EXITOSO ━━━"
    echo "   🌐 URL: ${DEPLOY_URL:-https://$DOMAIN}"
    echo "   📝 Log: $DEPLOY_LOG"
    echo ""

    # Verificar que el sitio responde
    echo "🔍 Verificando que el sitio responde..."
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" --connect-timeout 10 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
            echo "✅ Sitio responde con HTTP $HTTP_CODE"
        else
            echo "⚠️  Sitio respondió con HTTP $HTTP_CODE (puede estar propagándose)"
        fi
    fi
else
    echo "━━━ ❌ DEPLOY FALLÓ ━━━"
    echo "   Revisá $DEPLOY_LOG para más detalles."
    echo "   Posibles causas:"
    echo "   - Token inválido (corré: surge token y actualizá .env.surge)"
    echo "   - Dominio ya ocupado"
    echo "   - Problema de red"
fi

exit $EXIT_CODE

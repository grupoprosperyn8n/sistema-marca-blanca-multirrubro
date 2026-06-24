#!/usr/bin/env bash
set -euo pipefail

PROYECTO="${1:-}"
FABRICA="${2:-}"

if [ -z "$PROYECTO" ] || [ -z "$FABRICA" ]; then
  echo "Uso:"
  echo "bash exportar-proyecto.sh /ruta/proyecto /ruta/fabrica"
  exit 1
fi

if [ ! -d "$PROYECTO" ]; then
  echo "❌ No existe la carpeta del proyecto: $PROYECTO"
  exit 1
fi

if [ ! -d "$FABRICA" ]; then
  echo "❌ No existe la carpeta de la fabrica: $FABRICA"
  exit 1
fi

if [ ! -f "$FABRICA/scripts/create-starter-pack.sh" ]; then
  echo "❌ No encuentro scripts/create-starter-pack.sh en la fabrica."
  exit 1
fi

echo "🏭 Generando Factory Harness v3.7.2 — Stable..."
cd "$FABRICA"
bash scripts/create-starter-pack.sh factory-harness-v2-final

ZIP="$FABRICA/dist/factory-harness-v2-final.zip"

if [ ! -f "$ZIP" ]; then
  echo "❌ No se genero el starter pack: $ZIP"
  exit 1
fi

echo "📦 Descomprimiendo starter pack en temporal..."
TMP="$(mktemp -d)"
unzip -q "$ZIP" -d "$TMP"

if [ ! -d "$TMP/factory-harness-v2-final" ]; then
  echo "❌ El ZIP no contiene la carpeta factory-harness-v2-final"
  rm -rf "$TMP"
  exit 1
fi

echo "📁 Instalando fabrica en la raiz del proyecto..."
rsync -av --ignore-existing "$TMP/factory-harness-v2-final/" "$PROYECTO/"

rm -rf "$TMP"

cd "$PROYECTO"

echo "🔎 Validando estructura..."
if [ ! -f "harness/init.sh" ]; then
  echo "❌ Error: no existe harness/init.sh"
  echo "La fabrica quedo mal instalada."
  exit 1
fi

if [ -f "harness/harness/init.sh" ]; then
  echo "❌ Error: se detecto harness/harness/init.sh"
  echo "La fabrica quedo anidada incorrectamente."
  exit 1
fi

bash harness/init.sh

echo "✅ Proyecto + Factory Harness v3.7.2 instalados correctamente."
echo "📌 Siguiente paso: pegar PROMPT_ARRANQUE.md o usar inicio-rapido/. Revisar progress/session-summary.md si existe."

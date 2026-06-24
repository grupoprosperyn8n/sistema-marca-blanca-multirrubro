#!/bin/bash
# create-starter-pack.sh
# Crea un ZIP starter pack portable de la fabrica AionUI Hermes Factory Harness v2.
# Uso: bash scripts/create-starter-pack.sh [nombre-proyecto]
# Si no se pasa nombre, usa "harness-pack-v2"

set -euo pipefail

NAME="${1:-harness-pack-v2}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${DIR}/dist"
OUTPUT_FILE="${OUTPUT_DIR}/${NAME}.zip"
TEMP_DIR=$(mktemp -d)

echo "=== Creando starter pack: ${NAME} ==="
echo "Origen: ${DIR}"
echo "Destino: ${OUTPUT_FILE}"

# Crear directorio temporal con estructura base
mkdir -p "${TEMP_DIR}/${NAME}"

# --- Archivos raiz ---
cp "${DIR}/AGENTS.md" "${TEMP_DIR}/${NAME}/AGENTS.md" 2>/dev/null || echo "[SKIP] AGENTS.md no existe"
cp "${DIR}/FACTORY_HARNESS_MASTER.md" "${TEMP_DIR}/${NAME}/FACTORY_HARNESS_MASTER.md" 2>/dev/null || echo "[SKIP] FACTORY_HARNESS_MASTER.md no existe"
cp "${DIR}/PROMPT_ARRANQUE.md" "${TEMP_DIR}/${NAME}/PROMPT_ARRANQUE.md" 2>/dev/null || echo "[SKIP] PROMPT_ARRANQUE.md no existe"
cp "${DIR}/README.md" "${TEMP_DIR}/${NAME}/README.md" 2>/dev/null || echo "[SKIP] README.md no existe"
cp "${DIR}/START.md" "${TEMP_DIR}/${NAME}/START.md" 2>/dev/null || echo "[SKIP] START.md no existe"
cp "${DIR}/.env.example" "${TEMP_DIR}/${NAME}/.env.example" 2>/dev/null || echo "[SKIP] .env.example no existe"

# --- progress/ (tasks.json + memory + session-summary + logs) ---
mkdir -p "${TEMP_DIR}/${NAME}/progress/memory"
mkdir -p "${TEMP_DIR}/${NAME}/progress/logs"
cp "${DIR}/progress/tasks.json" "${TEMP_DIR}/${NAME}/progress/tasks.json" 2>/dev/null || echo "[SKIP] progress/tasks.json"
cp "${DIR}/progress/session-summary.md" "${TEMP_DIR}/${NAME}/progress/session-summary.md" 2>/dev/null || echo "[SKIP] progress/session-summary.md"
cp "${DIR}/progress/agent-brief.md" "${TEMP_DIR}/${NAME}/progress/agent-brief.md" 2>/dev/null || echo "[SKIP] progress/agent-brief.md"
touch "${TEMP_DIR}/${NAME}/progress/logs/.gitkeep"
for f in decisions.md bugs.md preferences.md open-questions.md; do
  cp "${DIR}/progress/memory/${f}" "${TEMP_DIR}/${NAME}/progress/memory/${f}" 2>/dev/null || echo "[SKIP] progress/memory/${f}"
done

# --- harness/ (documentos clave, contratos, guias, templates, quick-start) ---
mkdir -p "${TEMP_DIR}/${NAME}/harness/contracts"
mkdir -p "${TEMP_DIR}/${NAME}/harness/guides"
mkdir -p "${TEMP_DIR}/${NAME}/harness/templates"
mkdir -p "${TEMP_DIR}/${NAME}/harness/quick-start"

for f in init.sh HARNESS.md PERMISSIONS.md MEMORY.md GUIDES.md SENSORS.md AGENT_RUNBOOK.md CONTEXT.md VERIFICATION.md HUMAN_REVIEW.md FAILURE_LOG.md NO_CODE_OPERATING_SYSTEM.md RELEASE_CHECKLIST.md PHASE_CONTRACTS.md MULTI_AGENT.md; do
  cp "${DIR}/harness/${f}" "${TEMP_DIR}/${NAME}/harness/${f}" 2>/dev/null || echo "[SKIP] harness/${f}"
done

# --- harness/sensors/ (check files, no datos internos) ---
mkdir -p "${TEMP_DIR}/${NAME}/harness/sensors"
for f in "${DIR}/harness/sensors/"CHECK_*.md "${DIR}/harness/sensors/"SENSOR_*.md; do
  [ -f "$f" ] && cp "$f" "${TEMP_DIR}/${NAME}/harness/sensors/" 2>/dev/null || true
done

# --- harness/progress/ (progreso interno del harness) ---
mkdir -p "${TEMP_DIR}/${NAME}/harness/progress/sessions"
for f in PROGRESS_README.md session-registry.md; do
  cp "${DIR}/harness/progress/${f}" "${TEMP_DIR}/${NAME}/harness/progress/${f}" 2>/dev/null || echo "[SKIP] harness/progress/${f}"
done

# --- harness/scripts/ (utilidades del harness) ---
mkdir -p "${TEMP_DIR}/${NAME}/harness/scripts"
for f in backup-harness.sh; do
  cp "${DIR}/harness/scripts/${f}" "${TEMP_DIR}/${NAME}/harness/scripts/${f}" 2>/dev/null || echo "[SKIP] harness/scripts/${f}"
done

for f in FEATURE_CONTRACT_TEMPLATE.md AI_AGENT_CONTRACT.md INTEGRATION_CONTRACT.md; do
  cp "${DIR}/harness/contracts/${f}" "${TEMP_DIR}/${NAME}/harness/contracts/${f}" 2>/dev/null || echo "[SKIP] harness/contracts/${f}"
done

for f in COMO_ENTREGAR_AVANCES.md COMO_PEDIR_APROBACION.md; do
  cp "${DIR}/harness/guides/${f}" "${TEMP_DIR}/${NAME}/harness/guides/${f}" 2>/dev/null || echo "[SKIP] harness/guides/${f}"
done

cp "${DIR}/harness/templates/RELEASE_NOTE_TEMPLATE.md" "${TEMP_DIR}/${NAME}/harness/templates/RELEASE_NOTE_TEMPLATE.md" 2>/dev/null || echo "[SKIP] release note template"

for f in hermes.md codex.md aionui.md cursor.md; do
  cp "${DIR}/harness/quick-start/${f}" "${TEMP_DIR}/${NAME}/harness/quick-start/${f}" 2>/dev/null || echo "[SKIP] quick-start/${f}"
done

# --- docs/ ---
mkdir -p "${TEMP_DIR}/${NAME}/docs"
for f in AIONUI_MODE.md PORTABLE_MODE.md; do
  cp "${DIR}/docs/${f}" "${TEMP_DIR}/${NAME}/docs/${f}" 2>/dev/null || echo "[SKIP] docs/${f}"
done

# --- skills/ (solo SKILL.md, sin datos internos) ---
for skill_dir in "${DIR}/skills/"*/; do
  skill_name=$(basename "$skill_dir")
  if [ -f "${skill_dir}SKILL.md" ]; then
    mkdir -p "${TEMP_DIR}/${NAME}/skills/${skill_name}"
    cp "${skill_dir}SKILL.md" "${TEMP_DIR}/${NAME}/skills/${skill_name}/SKILL.md"
    # Copiar templates y scripts si existen (no datos)
    for sub in templates scripts; do
      if [ -d "${skill_dir}${sub}" ]; then
        cp -r "${skill_dir}${sub}" "${TEMP_DIR}/${NAME}/skills/${skill_name}/${sub}"
      fi
    done
  fi
done

# --- config/ (solo .example y no-secretos) ---
mkdir -p "${TEMP_DIR}/${NAME}/config"
for f in supabase.env.example airtable.env.example n8n.env.example mcp-plan.json environment.md permissions.md; do
  cp "${DIR}/config/${f}" "${TEMP_DIR}/${NAME}/config/${f}" 2>/dev/null || echo "[SKIP] config/${f}"
done

# --- ai/ (solo docs de referencia) ---
mkdir -p "${TEMP_DIR}/${NAME}/ai"
for f in AGENT_MEMORY.md CHANGELOG_AI.md TASKBOARD.md; do
  cp "${DIR}/ai/${f}" "${TEMP_DIR}/${NAME}/ai/${f}" 2>/dev/null || echo "[SKIP] ai/${f}"
done

# --- .gitignore base ---
cat > "${TEMP_DIR}/${NAME}/.gitignore" << 'GITIGNORE'
# Sensible data
.env
.env.test
.env.*.local
*.key
*.pem
*credentials*.json
service-role-key*
supabase-service-role*

# Build outputs
node_modules/
dist/
build/
deploy-temp/

# Backups
backups/
*.tar.gz
*.bak

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Agent files
.antigravity/
.claude/
.codex/
.cline/
.gemini/
.lmstudio/
GITIGNORE

# --- scripts/ (starter pack + utilidades base) ---
mkdir -p "${TEMP_DIR}/${NAME}/scripts"
cp "${DIR}/scripts/create-starter-pack.sh" "${TEMP_DIR}/${NAME}/scripts/create-starter-pack.sh" 2>/dev/null || echo "[SKIP] scripts/create-starter-pack.sh"

echo "=== Comprimiendo ==="
cd "${TEMP_DIR}"
zip -r "${OUTPUT_FILE}" "${NAME}" \
  -x "*/\\.git/*" \
  -x "*.bak" \
  -x "*.bak-*" \
  -x "*.backup" \
  -x "*.backup-*" \
  -x "*.old" \
  -x "*.old-*" \
  -x "*.swp" \
  -x "*.swo" \
  > /dev/null
cd "${DIR}"

echo "=== Limpiando ==="
rm -rf "${TEMP_DIR}"

echo ""
echo "=== Starter pack creado: ${OUTPUT_FILE} ==="
echo "Tamano: $(du -h "${OUTPUT_FILE}" | cut -f1)"
echo ""
echo "Para usar:"
echo "1. Descomprimir en raiz de tu proyecto:"
echo "   unzip ${OUTPUT_FILE} -d /ruta/de/tu/proyecto"
echo "2. Abrir con tu agente (Codex, Cursor, Claude Code, etc.)"
echo "3. Pegar el prompt de PROMPT_ARRANQUE.md"
echo ""

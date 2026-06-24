# PORTABLE MODE — Usar la fabrica con cualquier agente

> Modo universal.
> Usa la misma fabrica pero con Codex CLI, Antigravity, Cursor, Claude Code
> o cualquier agente de codigo que lea archivos.

---

## Que necesitas

- La fabrica o un proyecto que use el starter pack
- El agente que quieras usar (Codex, Antigravity, Cursor, Claude Code, OpenCode)
- El archivo \`AGENTS.md\` como entry point
- El archivo \`PROMPT_ARRANQUE.md\` para el prompt correcto

## Flujo de trabajo en modo portable

### Paso 1: Preparar el proyecto
1. Descomprimi el starter pack en la raiz del proyecto (si es nuevo)
2. O abri la carpeta del proyecto existente

### Paso 2: Elegir el prompt correcto
Segun tu situacion, copia el prompt de \`PROMPT_ARRANQUE.md\`:
- Proyecto nuevo -> Variante 1
- Proyecto existente -> Variante 2
- Continuar trabajo -> Variante 3
- Debugging -> Variante 4
- Pre-deploy -> Variante 5
- Feature nueva -> Variante 6
- Modulo ERP/SaaS -> Variante 7
- Seguridad -> Variante 8

### Paso 3: Pegar el prompt en el agente
Copia el prompt y pegalo en el chat del agente que estas usando.

### Paso 4: El agente lee el contexto
El agente debe leer en este orden:
1. \`AGENTS.md\` (entry point universal)
2. \`FACTORY_HARNESS_MASTER.md\` (documento maestro)
3. \`progress/tasks.json\` (estado actual)
4. \`progress/memory/\` (decisiones, bugs, preferencias)
5. \`docs/\` relevantes para la tarea
6. \`harness/CONTEXT.md\` (jerarquia de contexto)
7. \`harness/GUIDES.md\` (controles pre-ejecucion)

### Paso 5: El agente propone plan
Antes de codificar, el agente debe proponer:
- Que va a hacer
- Que archivos va a tocar
- Que riesgos detecta
- Que necesita aprobacion

### Paso 6: El usuario aprueba
Diego (el director) revisa y aprueba el plan.
Sin aprobacion, el agente NO ejecuta.

### Paso 7: Ejecucion
Con aprobacion, el agente:
1. Ejecuta la tarea
2. Pasa sensores (harness/sensors/) si aplica
3. Actualiza \`progress/tasks.json\`
4. Actualiza \`progress/memory/\` si aplica
5. Entrega resumen en espanol

## Guias rapidas por agente

### Codex CLI
\`\`\`
codex "Lee AGENTS.md. Segui el flujo SDD (harness/AGENT_RUNBOOK.md).
Sos IMPLEMENTADOR. No orquestes ni delegues, CONSTRUI.
Deja artifacto en progress/. Reporta al final que hiciste."
\`\`\`

### Antigravity
\`\`\`
ant "Lee AGENTS.md. Segui harness/AGENT_RUNBOOK.md.
Sos IMPLEMENTADOR RAPIDO. Features y prototipos.
Reporta al final."
\`\`\`

### Cursor
Abrir Cursor en la carpeta del proyecto. En el chat de Cursor:
\`\`\`
Lee AGENTS.md y FACTORY_HARNESS_MASTER.md.
Trabaja en [TAREA ESPECIFICA].
No modifiques archivos sin plan previo.
\`\`\`

### Claude Code
\`\`\`
claude "Lee AGENTS.md. Segui harness/AGENT_RUNBOOK.md.
Sos IMPLEMENTADOR + REVISOR. Calidad, bugs, refactors.
Reporta al final que hiciste y que sensores pasaste."
\`\`\`

### OpenCode
\`\`\`
opencode "Lee AGENTS.md. Segui harness/AGENT_RUNBOOK.md.
Sos IMPLEMENTADOR. No orquestes ni delegues.
Reporta al final."
\`\`\`

## Limitaciones del modo portable

| Funcionalidad | Disponible? |
|---------------|-------------|
| Leer estructura de la fabrica | Si |
| Usar contratos | Si |
| Usar sensores | Si (manual, ejecutando los CHECK_*.md) |
| Usar skills | Si (como referencia) |
| Usar MCP | No (solo Hermes/AionUI) |
| Delegar a otros agentes | No (single-agent) |
| Memoria compartida | Parcial (lee los archivos, no los actualiza automaticamente) |
| init.sh | Si (bash harness/init.sh) |

## Compatibilidad con el flujo Harness Engineering

El modo portable ejecuta el mismo flujo SDD pero:
- Sin orquestacion multi-agente
- Sin MCP activo
- Sin skills cargadas automaticamente
- Sin delegate_task
- TODO: lectura y escritura de archivos funciona igual

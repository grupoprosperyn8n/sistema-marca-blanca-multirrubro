# AIONUI MODE — Usar la fabrica con AionUI + Hermes

> Modo nativo de la fabrica.
> Usa AionUI como centro de comando visual y Hermes como orquestador principal.

---

## Que necesitas

- **AionUI** instalado y configurado (GUI multi-agente)
- **Hermes Agent** como agente principal (tu sesion activa)
- Acceso a la fabrica en \`/home/diegol/Documentos/erp-saas-aionui-workspace\`
- O un proyecto que use el starter pack de esta fabrica

## Flujo de trabajo en modo AionUI

### Paso 1: Abrir la fabrica en AionUI
1. Abri AionUI
2. Carga el workspace de la fabrica o proyecto
3. Asegurate de que Hermes esta activo como agente principal

### Paso 2: Elegir que hacer
Desde AionUI podes:
- **Mejorar la fabrica** -> Trabajar sobre la estructura del harness, skills, contratos
- **Crear un proyecto nuevo** -> Usar PROMPT_ARRANQUE.md (variante 1)
- **Continuar un proyecto** -> Usar PROMPT_ARRANQUE.md (variante 2 o 3)
- **Delegar tarea especifica** -> Pedirle a Hermes que planifique y delegue

### Paso 3: Hermes orquesta
Cuando le pedis algo a Hermes:
1. Hermes lee contexto (AGENTS.md, FACTORY_HARNESS_MASTER.md, progress/, docs/)
2. Propone plan
3. Te pide aprobacion
4. Divide en tareas
5. Tareas simples: Hermes las hace directo
6. Tareas complejas: Hermes delega a Codex/Antigravity (via delegate_task)
7. Hermes revisa resultados
8. Ejecuta sensores
9. Archiva y entrega resumen

### Paso 4: Agentes disponibles desde AionUI
- **Hermes** -> Orquestador (siempre activo)
- **Codex CLI** -> Implementador (via delegate_task)
- **Antigravity** -> Implementador rapido (via delegate_task)
- **Claude Code** -> Implementador + Revisor (via delegate_task)
- **n8n** -> Automatizaciones
- **Airtable** -> Panel operativo

### Modo multi-agente desde AionUI
AionUI permite ver multiples agentes trabajando en paralelo.
Hermes coordina, delega y revisa. Vos ves el progreso desde la GUI.

### Skills disponibles en modo AionUI
Las skills de \`skills/\` se cargan automaticamente via Hermes.
Cada skill tiene un SKILL.md que define responsabilidades y reglas.

### MCP en modo AionUI
Los servidores MCP definidos en \`config/mcp-plan.json\` estan disponibles.
\`config/agents.yaml\` define que servidores usa cada agente.

### Reglas especificas del modo AionUI
1. Hermes es el UNICO orquestador. Los demas agentes implementan.
2. No delegues tareas de orquestacion a Codex/Antigravity.
3. Siempre ejecuta \`bash harness/init.sh\` al inicio de cada sesion.
4. Reporta avances en ESPANOL a Diego (no-programador).
5. Si no sabes que hacer, preguntale a Diego antes de actuar.
6. No asumas permisos. Siempre confirma con el director.

# 🏭 FACTORY HARNESS MASTER — v2

Documento maestro de la **AionUI Hermes Factory Harness v2**.

---

## 📖 Propósito

Esta fábrica permite construir proyectos ERP/SaaS modulares usando:
- **AionUI** como centro de comando.
- **Hermes Agent** como agente principal.
- **Supabase** como backend de datos.
- **Airtable** como capa no-code operativa.
- **n8n** como motor de automatizaciones.
- **MCP** como herramientas compartidas.
- **Skills** personalizadas para tareas específicas.
- **Harness Engineering** para control de calidad.

## 🧠 Filosofía

1. **Primero la fábrica, después el producto.** No construyas productos hasta que la fábrica esté lista.
2. **Contratos antes que código.** Ninguna feature sin contrato aprobado.
3. **Memoria sobre el chat.** Las decisiones importantes se documentan, no quedan en la conversación.
4. **Sensores sobre confianza.** El harness verifica automáticamente antes de permitir acciones.
5. **Revisión humana obligatoria.** Lo sensible requiere aprobación explícita.
6. **Capa portable.** La fábrica funciona con Hermes, Codex, Antigravity, Cursor, Claude Code y cualquier agente.
7. **Modo AionUI y modo portable.** El mismo harness sirve para ambos.

## 📂 Estructura

```
/
├── AGENTS.md                    # → inicio-rapido/00-LEER-PRIMERO.md
├── FACTORY_HARNESS_MASTER.md    # Este documento
├── PROMPT_ARRANQUE.md           # Prompt que pega el usuario
├── PROYECTO.md                  # Contexto de negocio del proyecto
├── CREDENCIALES.md              # Secretos autorizados (sensible)
├── COMANDO.txt                  # Guía operativa (si exportado desde manual)
├── README.md                    # README del proyecto
├── START.md                     # Guía rápida de inicio
├── .env.example                 # Variables de entorno (sin valores reales)
│
├── inicio-rapido/               # Prompts rápidos por agente
│   ├── 00-LEER-PRIMERO.md       # Guía del agente (entrada principal)
│   ├── 01-ARRANQUE-NUEVO.md     # Proyecto nuevo
│   ├── 02-CONTINUAR-TRABAJO.md  # Continuar trabajo existente
│   ├── 03-DEBUGGING.md          # Debugging
│   ├── 04-REVISION-PRE-DEPLOY.md # Pre-deploy
│   ├── 05-CREAR-FEATURE.md      # Feature nueva
│   ├── 06-CREAR-MODULO.md       # Módulo ERP/SaaS
│   └── 07-REVISAR-SEGURIDAD.md  # Seguridad
│
├── harness/
│   ├── HARNESS.md               # Documentación del harness
│   ├── GUIDES.md                # Guías de uso
│   ├── SENSORS.md               # Sensores de verificación
│   ├── PERMISSIONS.md           # Reglas de permisos
│   ├── CONTEXT.md               # Contexto completo del harness
│   ├── MEMORY.md                # Sistema de memoria
│   ├── VERIFICATION.md          # Criterios de verificación
│   ├── FAILURE_LOG.md           # Registro de fallos
│   ├── HUMAN_REVIEW.md          # Proceso de revisión humana
│   ├── NO_CODE_OPERATING_SYSTEM.md # Sistema operativo no-code
│   ├── AGENT_RUNBOOK.md         # Runbook del agente
│   ├── RELEASE_CHECKLIST.md     # Checklist de release
│   ├── init.sh                  # Script de verificación pre-vuelo
│   ├── init.sh --fix            # Auto-reparación
│   ├── contracts/               # Contratos del sistema
│   ├── guides/                  # Guías detalladas
│   ├── sensors/                 # Sensores específicos
│   └── templates/               # Templates reusables
│
├── progress/
│   ├── tasks.json               # Taskboard (tareas, fases, estados)
│   └── memory/                  # Memoria persistente
│       ├── decisions.md         # Decisiones arquitectónicas
│       ├── bugs.md              # Bugs encontrados y resueltos
│       ├── preferences.md       # Preferencias del usuario
│       └── open-questions.md    # Preguntas abiertas
│
├── docs/
│   ├── AIONUI_MODE.md           # Cómo usar con AionUI
│   └── PORTABLE_MODE.md         # Cómo usar con cualquier agente
│
├── skills/                      # Skills personalizadas (por tarea)
├── config/                      # Configuraciones
├── airtable/                    # Bases de Airtable
├── n8n/                         # Workflows n8n
├── supabase/                    # Migraciones/Seed Supabase
├── scripts/                     # Scripts auxiliares
├── src/                         # Código fuente
├── app/                         # Aplicación
└── tests/                       # Pruebas
```

## 👤 Roles

| Rol | Responsabilidad |
|-----|----------------|
| **Director del Producto** | Diego López. Aprueba todo. |
| **Hermes Agent** | Agente principal. Coordina, ejecuta, documenta. |
| **Agentes Ejecutores** | Codex, Claude Code, Antigravity, Cursor, etc. |
| **Harness** | Controla calidad, sensores, permisos, memoria. |

## 📋 Fases de Trabajo

1. **Auditoría** — Relevar estructura actual sin modificar.
2. **Propuesta** — Plan aprobado antes de tocar archivos.
3. **Contratos** — Definir contratos antes de implementar.
4. **Implementación** — Construir por módulos/features.
5. **Pruebas** — Verificar funcionamiento y seguridad.
6. **Revisión Humana** — El usuario aprueba antes de pasar a producción.
7. **Documentación** — Actualizar memoria y documentación.
8. **Release** — Deploy con checklist y backup.

## 📜 Contratos Mínimos

`harness/contracts/` debe contener:
- `PRODUCT_CONTRACT.md` — Contrato del producto completo.
- `MODULE_CONTRACT_TEMPLATE.md` — Template para módulos.
- `FEATURE_CONTRACT_TEMPLATE.md` — Template para features.
- `SUPABASE_CONTRACT.md` — Contrato para cambios en Supabase.
- `AIRTABLE_CONTRACT.md` — Contrato para cambios en Airtable.
- `N8N_CONTRACT.md` — Contrato para workflows n8n.
- `UI_CONTRACT.md` — Contrato para UI/UX.
- `AI_AGENT_CONTRACT.md` — Contrato para agentes AI.
- `INTEGRATION_CONTRACT.md` — Contrato para integraciones.

**Regla:** Ninguna feature importante sin contrato previo.

## 🔒 Permisos y Sensores

Ver `harness/PERMISSIONS.md` y `harness/sensors/CHECK_ANTI_CAOS.md`.

Reglas clave:
- No tocar producción sin aprobación.
- No ejecutar migraciones sin backup y aprobación.
- No exponer secretos.
- No borrar archivos sin aprobación.
- No crear estructuras paralelas si ya existe una estructura.
- No dejar decisiones importantes solo en el chat.

## 🧠 Memoria

La memoria vive en `progress/memory/`:
- `decisions.md` — Decisiones arquitectónicas y de diseño.
- `bugs.md` — Bugs encontrados y resueltos.
- `preferences.md` — Preferencias y convenciones del usuario.
- `open-questions.md` — Preguntas sin resolver.

## 📋 Contexto Compacto (`progress/session-summary.md`)

Resumen operativo corto para arranque rápido del agente.
No reemplaza `PROYECTO.md` ni `progress/tasks.json`.
Máximo 80 líneas. Nunca incluir secretos reales.
Actualizar al cierre de cada sesión.

### Mantenimiento de la fábrica

Para mantenimiento de la Factory Harness, incluidos init.sh, starter pack, manual export, session-summary y ciclos de actualización:
- `harness/guides/FACTORY_MAINTENANCE.md` — guía completa
- `skills/harness-engineer/SKILL.md` — skill con Modo Mantenimiento de Fábrica

## Criterios

- **Ready**: Contrato firmado, plan aprobado, dependencias listas.
- **Done**: Implementado, probado, documentado, entregado con resumen humano.
- **Production Ready**: Ready + seguridad revisada, backup listo, release checklist OK.

## 🚀 Modo AionUI

Usa AionUI como interfaz, Hermes como agente, MCP para herramientas, skills para tareas.

## 🌍 Modo Portable

Funciona con Codex, Antigravity, Cursor, Claude Code o cualquier agente:
1. Descomprime starter pack en raíz del proyecto.
2. Abre repo con el agente.
3. Pega `PROMPT_ARRANQUE.md`.
4. El agente lee `AGENTS.md → inicio-rapido/00-LEER-PRIMERO.md`.
5. El agente ejecuta `bash harness/init.sh`.
6. Sigue flujo de trabajo estándar.

## 🛡️ Anti-Caos

Ver `harness/sensors/CHECK_ANTI_CAOS.md` para la checklist completa.

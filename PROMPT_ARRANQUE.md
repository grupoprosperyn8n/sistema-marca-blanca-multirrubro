# 🚀 PROMPT_ARRANQUE.md

Copia y pega esto cuando inicies o continúes un proyecto con la fábrica.

---

## Orden de lectura (siempre)

```
1. Lee AGENTS.md.
2. Ejecuta bash harness/init.sh.
3. Lee progress/session-summary.md si existe (contexto compacto).
4. Lee PROYECTO.md si existe (contexto de negocio).
5. CREDENCIALES.md es sensible — NO muestres secretos.
6. Lee progress/tasks.json (tareas pendientes).
7. Lee progress/memory/ (decisiones, bugs, preferencias).
8. Lee FACTORY_HARNESS_MASTER.md solo si necesitas reglas completas.
9. Lee este PROMPT_ARRANQUE.md según la tarea.
10. Propón plan antes de construir.
```

---

## 📦 Proyecto Nuevo

```
Ejecuta bash harness/init.sh para verificar el harness.
Lee progress/session-summary.md si existe (contexto compacto).
Lee PROYECTO.md (contexto de negocio).
Lee FACTORY_HARNESS_MASTER.md (arquitectura).
Lee AGENTS.md → inicio-rapido/00-LEER-PRIMERO.md (guía del agente).
Revisa progress/tasks.json.
Propón plan de fases con contratos.
No construyas nada sin aprobación.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

## 🔄 Proyecto Existente

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe.
Lee progress/tasks.json (estado actual).
Lee PROYECTO.md (contexto).
Lee progress/memory/decisions.md (decisiones previas).
Identifica tareas pendientes/bloqueadas.
Propón siguiente paso concreto.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

## 🐛 Debugging

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe.
Lee PROYECTO.md si necesitas contexto.
Lee progress/memory/bugs.md para errores previos.
Identifica: ¿Qué debería pasar? ¿Qué pasa? ¿Cuándo empezó?
Propón hipótesis y plan de debugging.
Documenta la solución en progress/memory/bugs.md.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

## ✅ Revisión Pre-Deploy

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe.
Lee PROYECTO.md.
Lee harnees/RELEASE_CHECKLIST.md.
Verifica: contratos firmados, pruebas pasan, seguridad revisada, UX verificada, doc actualizada, backup listo.
Reporta riesgos.
Pregunta aprobación para deploy.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

## ✨ Feature Nueva

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe.
Lee PROYECTO.md.
Lee progress/tasks.json.
Lee harnees/contracts/FEATURE_CONTRACT_TEMPLATE.md.
Propón contrato de feature con alcance, dependencias y criterios.
Espera aprobación antes de construir.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

## 🧩 Módulo ERP/SaaS Nuevo

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe.
Lee PROYECTO.md y FACTORY_HARNESS_MASTER.md.
Lee harnees/contracts/MODULE_CONTRACT_TEMPLATE.md.
Propón contrato de módulo con tablas, bases, workflows, features e integraciones.
Espera aprobación antes de construir.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

## 🔒 Revisión de Seguridad

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe.
Lee PROYECTO.md y harnees/PERMISSIONS.md.
Lee harnees/sensors/CHECK_ANTI_CAOS.md.
Revisa: secretos expuestos, service role key en frontend, RLS, autenticación, errores en n8n.
Reporta hallazgos con severidad.
Propón remediación.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
```

---

## 📋 Al finalizar cada tarea

Actualizá:
- `progress/tasks.json`
- `progress/memory/` si hubo decisión, bug, preferencia o pregunta
- `progress/session-summary.md` — resumen corto de estado, próxima tarea y riesgos

`progress/session-summary.md` NO reemplaza las fuentes de verdad. Máximo 80 líneas. Nunca incluir secretos reales.

**Regla de oro:** Arranca siempre con `bash harness/init.sh`.

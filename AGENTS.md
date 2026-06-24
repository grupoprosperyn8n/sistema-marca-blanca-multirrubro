# AGENTS.md

> **Este archivo es un enlace a la guía del agente.**
> Lee [`inicio-rapido/00-LEER-PRIMERO.md`](inicio-rapido/00-LEER-PRIMERO.md) para las instrucciones completas.

---

## Orden de lectura recomendado

1. Leer `AGENTS.md` (este archivo).
2. Ejecutar `bash harness/init.sh`.
3. Leer `progress/session-summary.md` si existe — contexto compacto para ahorrar tokens.
4. Leer `PROYECTO.md` si existe — contexto de negocio.
5. Detectar `CREDENCIALES.md` como archivo local sensible autorizado.
6. Leer `progress/tasks.json` — tareas pendientes.
7. Leer `progress/memory/` — decisiones, bugs, preferencias, preguntas abiertas.
8. Leer `FACTORY_HARNESS_MASTER.md` solo si necesita reglas completas.
9. Leer `PROMPT_ARRANQUE.md` según la tarea.
10. Proponer plan antes de construir.

## Al finalizar

Actualizar:
- `progress/tasks.json`
- `progress/memory/` si hubo decisión, bug, preferencia o pregunta
- `progress/session-summary.md` — resumen corto de estado, próxima tarea y riesgos

`progress/session-summary.md` NO reemplaza las fuentes de verdad. Máximo 80 líneas. Nunca incluir secretos reales.

## 🛠 Mantenimiento

Para mantenimiento de la fábrica:
- `harness/guides/FACTORY_MAINTENANCE.md` — guía completa de mantenimiento
- `skills/harness-engineer/SKILL.md` — skill de mantenimiento (Modo Mantenimiento de Fábrica)

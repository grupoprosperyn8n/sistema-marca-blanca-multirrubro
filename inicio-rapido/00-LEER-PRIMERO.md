# 🏭 Inicio rápido — Factory Harness v3.7.2 Stable

Lee `../AGENTS.md` para la guía del agente.

Antes de usar cualquier agente:

1. Ejecutar `bash harness/init.sh`.
2. Leer `progress/session-summary.md` si existe — contexto compacto para ahorrar tokens.
3. Leer `PROYECTO.md` como contexto de negocio.
4. Detectar `CREDENCIALES.md` como archivo local sensible autorizado. NO mostrar secretos.
5. Leer `FACTORY_HARNESS_MASTER.md` para la arquitectura (solo si necesitas reglas completas).
6. Leer `PROMPT_ARRANQUE.md` para prompts rápidos según la tarea.
7. Revisar `progress/tasks.json` para tareas pendientes.
8. Revisar `progress/memory/` para decisiones, bugs, preferencias y preguntas abiertas.
9. Proponer plan antes de construir. Esperar aprobación humana.

Al terminar: actualizar progress/session-summary.md con resumen corto de estado, próxima tarea y riesgos. ⚠️ Nunca incluir credenciales reales ni secretos en session-summary.md — esas van solo en CREDENCIALES.md o .env.

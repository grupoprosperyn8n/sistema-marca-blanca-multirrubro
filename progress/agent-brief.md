# Agent Brief — Factory Harness

Este proyecto trabaja bajo Factory Harness v3.7.2.

Antes de actuar, el agente debe:

1. Leer AGENTS.md.
2. Ejecutar bash harness/init.sh.
3. Leer progress/session-summary.md.
4. Leer PROYECTO.md si existe.
5. Revisar progress/tasks.json.
6. Revisar progress/memory/.
7. Identificar fase actual.
8. Proponer plan antes de ejecutar.
9. No hacer cambios reales sin aprobación.
10. No mostrar secretos.
11. No tocar Airtable, Supabase, n8n, frontend, producción ni archivos sensibles sin aprobación.
12. No modificar .env ni CREDENCIALES.md.
13. No commitear credenciales.
14. No borrar datos reales.
15. Reportar siempre:
    - fase actual,
    - archivos leídos,
    - próximo paso,
    - archivos a modificar,
    - riesgos,
    - aprobación necesaria.

Frase estándar para prompts:

Aplicá progress/agent-brief.md y continuá con la tarea indicada.

# 🚀 START — Guía Rápida

## 1. Verificar Harness

```bash
bash harnees/init.sh
```

## 2. Leer Contexto

```bash
cat PROYECTO.md        # Contexto de negocio
cat AGENTS.md          # → guía del agente
```

## 3. Revisar Tareas

```bash
cat progress/tasks.json
```

## 4. Empezar a Trabajar

1. Elige una tarea de `progress/tasks.json`.
2. Si requiere feature nueva, crea contrato en `harness/contracts/`.
3. Espera aprobación del usuario.
4. Implementa.
5. Prueba.
6. Documenta en `progress/memory/`.
7. Actualiza `progress/tasks.json`.
8. Entrega resumen humano.


## Contexto compacto

`progress/session-summary.md` es el resumen corto que el agente debe leer al inicio.
No reemplaza PROYECTO.md ni progress/tasks.json.
Actualizar al cierre de cada sesión. No contiene secretos reales.

## 🛠 Mantenimiento

Para mantenimiento de la fábrica:
- `harness/guides/FACTORY_MAINTENANCE.md` — guía completa
- `skills/harness-engineer/SKILL.md` — skill con Modo Mantenimiento

## Reglas de Oro

- `bash harness/init.sh` siempre primero.
- No toques producción sin aprobación.
- No borres archivos sin aprobación.
- `CREDENCIALES.md` es sensible — NO muestres secretos.
- Documenta decisiones en `progress/memory/decisions.md`.

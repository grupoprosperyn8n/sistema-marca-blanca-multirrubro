# Permisos — Resumen operativo

> ⚠️ **La política completa y fuente de verdad está en `harness/PERMISSIONS.md`.**
>
> Este archivo resume permisos para configuración de agentes y MCP.
> **Si hay contradicción, manda `harness/PERMISSIONS.md`.**

## Resumen rápido

| Entorno | Leer | Escribir | Migraciones | Workflows n8n | Borrar |
|---------|------|----------|-------------|---------------|--------|
| **Desarrollo local** | ✅ Permitido | ✅ Permitido | ⚠️ Aprobación | ✅ Borradores | ⚠️ Aprobación |
| **Staging** | ✅ Permitido | ⚠️ Con backup | ⚠️ Aprobación | ⚠️ Aprobación | ⚠️ Con backup |
| **Producción** | ✅ Controlado | ❌ Prohibido | ❌ Aprobación humana | ❌ Aprobación humana | ❌ Aprobación humana |

## Reglas clave para config de agentes/MCP

- ✅ Crear y editar config local (`config/`, `.env.example`)
- ⚠️ Modificar config de MCP real → requiere aprobación
- ❌ No exponer `service_role_key` en frontend
- ❌ No guardar secretos reales en repositorio
- ❌ No activar MCP en producción sin aprobación
- ❌ No borrar archivos sin aprobación

## Ver detalles completos

```bash
# Leer la política completa:
cat harness/PERMISSIONS.md
```

> Última actualización: 2026-05-31 | Alineado con `harness/PERMISSIONS.md` v2

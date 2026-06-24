# 🏚️ Legacy Isolation — Fase 1A

> Creado: 2026-06-15
> Fase: 1A — Base App Multirrubro Read-Only

## Archivos Legacy (NO modificados)

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `static/index.html` | 🛑 Congelado | Frontend original del sistema |
| `static/api.js` | 🛑 Congelado | Bridge JS directo a Airtable (dev/staging) |

## Regla de aislamiento

- ❌ No modificar, no borrar, no importar desde el nuevo frontend.
- ❌ `static/api.js` contiene código directo a Airtable — inseguro para producción.
- ✅ El nuevo frontend (`frontend/`) es el sucesor oficial.
- ✅ El nuevo backend (`backend/`) proxy Airtable sin exponer token.

## Migración futura

Cuando se active producción:
1. Eliminar `static/`
2. Deployar `frontend/dist/` como estáticos
3. El backend sirve como proxy seguro

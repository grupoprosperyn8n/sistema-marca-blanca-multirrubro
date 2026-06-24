# Incidente: Eliminación accidental de static/api.js

## Metadata
- **ID**: INCIDENT-2026-06-20-STATIC-API-JS
- **Fecha**: 2026-06-20
- **Fase afectada**: FASE_1H_G — Frontend catálogo de productos
- **Origen**: Error humano durante build clean-up

## Cronología
1. **FASE_1H_G build**: Se ejecutó `cp -r frontend/dist/* static/` para copiar el build Vite
2. **Clean-up inseguro**: Se ejecutó `rm static/api.js` sin verificar que no estaba versionado en git
3. **Detección**: Diego reportó el archivo como bloqueante — marcado "no tocar/no modificar/no borrar"
4. **Búsqueda**: Se buscó en git (nunca commiteado), filesystem, backups, .trash, proyectos hermanos
5. **Resultado**: Sin copia recuperable

## Impacto
- **Archivo**: `static/api.js` (29,677 bytes, fecha Jun 5 2026)
- **Contenido original**: Conector directo Airtable con token global, base ID `app93Vhy56KrxNhwe`, proxy n8n hardcodeado, CRUD desde navegador
- **Dependencias**: Posiblemente referenciado por `static/index.html` (versión pre-Vite)

## Decisión de seguridad
**NO se reconstruye el archivo con lógica funcional.**
- No se reintroduce `__AIRTABLE_TOKEN__`
- No se reintroduce `AIRTABLE_CONFIG` con base ID vieja
- No se reintroduce CRUD directo desde frontend
- No se reintroduce proxy n8n hardcodeado

## Estado final
- Se creó `static/api.js` como **stub seguro** (sin lógica, sin tokens, sin conexiones)
- El stub documenta que el legacy fue retirado y reemplazado por FastAPI Railway
- La app React NO importa ni depende de `static/api.js`
- El frontend consume `VITE_API_BASE_URL=https://earnest-comfort-production-3d75.up.railway.app`

## Validación
- [x] React build no importa `api.js`
- [x] `index.html` no referencia `api.js`
- [x] 0 tokens en build
- [x] 0 Airtable directo en build
- [x] 0 localhost en build
- [x] Railway presente en build

## Próximo paso
Si aparece un backup real del archivo original, restaurarlo como artefacto histórico aislado (sin reactivar lógica) y actualizar este documento.

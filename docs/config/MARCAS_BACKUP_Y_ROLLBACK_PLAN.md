# FASE_1K_B — Plan de Backup y Rollback para creación de Tabla MARCAS

> 📅 2026-06-20 | 🧪 Dry-run | 🚫 No ejecutar todavía | 📋 Versión 1.0

---

## 1. Principio rector

> **Antes de cualquier PATCH/POST al schema de Airtable, debe existir un snapshot completo
> del estado actual que permita revertir en < 5 minutos.**

---

## 2. ¿Qué se va a modificar?

| Acción | Target | Riesgo |
|--------|--------|:------:|
| Crear tabla `MARCAS` | Airtable Base `appuns6zIUKaJG7r0` | 🟢 Bajo — tabla nueva, no afecta existentes |
| Insertar 1 registro seed | Tabla `MARCAS` recién creada | 🟢 Bajo |
| **NO** se modifica `CONFIGURACION_PUBLICA` | — | — |
| **NO** se modifican otras 14+ tablas | — | — |

---

## 3. Snapshot pre-creación

### 3.1 Listar tablas existentes

```bash
# Opción A — vía API Airtable (requiere token)
curl -s "https://api.airtable.com/v0/meta/bases/appuns6zIUKaJG7r0/tables" \
  -H "Authorization: Bearer \$AIRTABLE_TOKEN" \
  | jq '[.tables[] | {name: .name, id: .id, fields: [.fields[]?.name]}]' \
  > docs/config/pre_backup_tablas_existentes_$(date +%Y%m%d_%H%M%S).json

# Opción B — vía backend Railway (sin token directo)
curl -s "https://earnest-comfort-production-3d75.up.railway.app/api/tablas" \
  > docs/config/pre_backup_tablas_via_backend_$(date +%Y%m%d_%H%M%S).json
```

### 3.2 Exportar estructura de CONFIGURACION_PUBLICA

```bash
curl -s "https://api.airtable.com/v0/meta/bases/appuns6zIUKaJG7r0/tables" \
  -H "Authorization: Bearer \$AIRTABLE_TOKEN" \
  | jq '.tables[] | select(.name == "CONFIGURACION_PUBLICA")' \
  > docs/config/pre_backup_CONFIGURACION_PUBLICA_schema_$(date +%Y%m%d_%H%M%S).json
```

### 3.3 Exportar todos los registros de CONFIGURACION_PUBLICA

```bash
curl -s "https://api.airtable.com/v0/appuns6zIUKaJG7r0/CONFIGURACION_PUBLICA" \
  -H "Authorization: Bearer \$AIRTABLE_TOKEN" \
  > docs/config/pre_backup_CONFIGURACION_PUBLICA_data_$(date +%Y%m%d_%H%M%S).json
```

### 3.4 Exportar MODULOS

```bash
curl -s "https://api.airtable.com/v0/appuns6zIUKaJG7r0/MODULOS" \
  -H "Authorization: Bearer \$AIRTABLE_TOKEN" \
  > docs/config/pre_backup_MODULOS_data_$(date +%Y%m%d_%H%M%S).json
```

### 3.5 Checksum del estado

```bash
# Generar hash del dump completo para verificar integridad post-cambio
cat docs/config/pre_backup_*_data_*.json | sha256sum > docs/config/pre_backup_checksum.sha256
```

---

## 4. Procedimiento de Rollback

### Escenario A: La tabla MARCAS se creó pero está vacía o tiene errores

| Paso | Acción | Tiempo |
|------|--------|:------:|
| 1 | Eliminar la tabla MARCAS desde UI de Airtable | 30s |
| 2 | Verificar que `/api/tablas` ya no la lista | 30s |
| 3 | Verificar que `/api/marca-blanca` sigue funcionando con nulls (estado original) | 30s |
| **Total** | | **~1.5 min** |

### Escenario B: La tabla MARCAS tiene datos pero el endpoint falla

| Paso | Acción | Tiempo |
|------|--------|:------:|
| 1 | Vaciar el registro seed de MARCAS (no eliminar la tabla) | 30s |
| 2 | El endpoint vuelve a devolver nulls → frontend usa fallback | 30s |
| 3 | Corregir el endpoint o el seed → reintentar | variable |
| **Total** | | **~1 min** |

### Escenario C: Se necesita revertir todo (incluyendo endpoint)

| Paso | Acción | Tiempo |
|------|--------|:------:|
| 1 | Eliminar tabla MARCAS (UI Airtable) | 30s |
| 2 | Revertir `modulos.py` a versión anterior (`git checkout HEAD~1 -- backend/routes/modulos.py`) | 30s |
| 3 | Redeploy backend Railway (`git push railway main`) | 2 min |
| 4 | Verificar health check y `/api/marca-blanca` | 30s |
| **Total** | | **~3.5 min** |

---

## 5. Qué NO se debe tocar durante la creación

| Prohibido | Razón |
|-----------|-------|
| ❌ Eliminar o modificar `CONFIGURACION_PUBLICA` | Es la fuente actual de banners y flags. Rompería AnnouncementBar |
| ❌ Eliminar o modificar `MODULOS` | Lo usa el endpoint `/api/modulos` y el backoffice |
| ❌ Modificar `main.py` | Ya incluye el router de modulos (que tiene `/api/marca-blanca`) |
| ❌ Modificar otras 12+ tablas | No están relacionadas con la configuración pública |
| ❌ Tocar `CREDENCIALES.md` | Contiene información de autenticación |
| ❌ Tocar `harness/` | Fábrica madre — se corrompe el proyecto si se modifica |
| ❌ Tocar `static/api.js` | Stub estático — no se toca en esta fase |
| ❌ Exponer `AIRTABLE_TOKEN` en logs, commits o archivos | Seguridad |

---

## 6. Archivos que respaldan el cambio

| Archivo | Propósito |
|---------|-----------|
| `docs/config/MARCAS_SCHEMA_DRY_RUN.md` | Schema completo de la tabla MARCAS |
| `docs/config/MARCAS_BACKUP_Y_ROLLBACK_PLAN.md` | Este documento |
| `docs/config/MARCAS_SCHEMA_EXECUTION_PLAN.md` | Pasos exactos de ejecución |
| `docs/config/PORTAL_PUBLICO_CONFIG_CONTRACT.md` | Contrato de claves frontend↔backend |
| `docs/config/PORTAL_PUBLICO_CONFIG_AUDIT.md` | Auditoría de hardcodes (FASE_1K) |
| `docs/config/pre_backup_*.json` | Snapshots pre-creación (se generan al ejecutar) |
| `docs/config/pre_backup_checksum.sha256` | Checksum de integridad |

---

## 7. Verificación post-creación

Después de crear la tabla MARCAS e insertar el seed, verificar:

- [ ] `GET /api/tablas` incluye `MARCAS` en la lista
- [ ] `GET /api/marca-blanca` devuelve `nombre_sistema: "BellezaPro Demo"` (no null)
- [ ] `GET /api/marca-blanca` → `colores.primary` NO es null
- [ ] `GET /api/configuracion-publica` sigue funcionando (sin cambios)
- [ ] `GET /api/modulos` sigue funcionando
- [ ] `GET /health` → `status: "ok"`
- [ ] Frontend `https://bellezapro-demo.surge.sh` carga sin errores de consola
- [ ] `resolveBrandConfig.js` ya no debería usar fallback para nombre/colores (verificar en consola)

---

> 📄 Documento generado en FASE_1K_B — Dry-run. Procedimiento listo, no ejecutado.

# Backend Registry — SISTEMA_MARCA_BLANCA_MULTIRRUBRO

> Registrado: 2026-06-14
> Base anterior `app93Vhy56KrxNhwe` (22 tablas) → DEPRECATED
> Backend activo: **SISTEMA_MARCA_BLANCA_MULTIRRUBRO**
> Demo piloto: Gestión de Salón de Belleza

---

## Datos de Conexión

| Campo | Valor |
|-------|-------|
| Base ID | `appuns6zIUKaJG7r0` |
| Base Name | `GESTION_SALON_BELLEZA_V2` |
| API Endpoint | `https://api.airtable.com/v0/appuns6zIUKaJG7r0` |
| PAT Token | Rotado por Diego (2026-06-14) |
| Tablas totales | **49** |
| Roles | 5 (ADMIN, GERENTE, EMPLEADO_GESTION, PROFESIONAL, SOLO_LECTURA) |

---

## Variables de Entorno (`.env`)

```bash
AIRTABLE_BASE_ID=appuns6zIUKaJG7r0
AIRTABLE_API_TOKEN=***o
AIRTABLE_API_URL=https://api.airtable.com
```

El adaptador busca en orden: `AIRTABLE_API_TOKEN` → `AIRTABLE_CREDENCIALES` → `AIRTABLE`.

---

## Tablas Principales

| Tabla | ID | Campos | Rol |
|-------|-----|--------|-----|
| PRODUCTOS_WEB | `tblKEEJGq536smJuQ` | 53 | Catálogo público |
| SERVICIOS_WEB | `tblLwIZkxOYsRu6M4` | 50 | Catálogo público |
| PRODUCTOS | `tbl...` | 49 | Inventario interno |
| SERVICIOS | `tbl...` | 45 | Inventario interno |
| REPORTES_CONFIGURADOS | `tbl8eXvSxhBFq9F66` | 63 | Reportes |
| USUARIOS | `tblTWVvTKR3eS0khF` | 17 | Auth |
| ROLES | `tbliEBXeaugJ2NcXK` | 13 | Roles |
| PERMISOS_CAMPO | `tblZp49ncoz1YOcxo` | 11 | Reglas x campo |
| PERMISOS_MODULO | `tblTDsuSzjmZQ9Lag` | 13 | Reglas x módulo |

---

## Archivos del Proyecto

```
backend/
  airtable_adapter.py         # Capa de acceso (read-only en Fase 1)
  contract_productos_web.py   # Modelos Python para PRODUCTOS_WEB
  contract_regeneracion_ia.py # Diseño de regeneración IA (sin ejecutar)

contracts/
  DEPRECATED__PRODUCT_CONTRACT_v1_base_app93Vhy.md  # Archivo muerto

progress/
  backend-registry.md         # Este archivo
```

---

## Reglas del Backend

1. **Read-only en Fase 1** — no escribir en Airtable hasta Fase 2 autorizada
2. **Token nunca al frontend** — backend intermedia todas las llamadas
3. **5 roles** con permisos granulares vía PERMISOS_CAMPO + PERMISOS_MODULO
4. **IA Web** (5 campos) invisible para PROFESIONAL y SOLO_LECTURA
5. **Regeneración IA** nunca aprueba frontend automáticamente (requiere humano)

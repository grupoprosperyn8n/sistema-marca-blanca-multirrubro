# FASE 1A — MICROCORRECCIÓN: CONFIG, TABLAS Y SCOPE

**Fecha:** 15 de Junio, 2026  
**Proyecto:** `sistema-marca-blanca-multirrubro`  
**Fase:** `FASE_1A_MICROCORRECCION_CONFIG_TABLAS_Y_SCOPE`

---

## Resumen

Corrección de 3 problemas detectados en el cierre de Fase 1A:

| # | Problema | Resolución |
|---|----------|------------|
| P1 | Bridge runtime legacy en `main.py` | Eliminado todo el puente de mapeo (`AIRTABLE_CREDENCIALES → AIRTABLE_API_TOKEN`, etc.) |
| P2 | Reporte decía que 4 tablas no existen | Auditoría Meta API confirmó: **las 4 tablas SÍ existen** (49 tablas total) |
| P3 | PRODUCTOS_WEB como módulo P0 | Sacado de navegación principal. Reemplazado por SERVICIOS y CLIENTES. Ruta `/backoffice/productos` preservada como técnica oculta. |

---

## Configuración estándar

El backend ahora depende **exclusivamente** de:

| Variable | Default | Origen |
|----------|---------|--------|
| `AIRTABLE_BASE_ID` | — | `.env` (requerida) |
| `AIRTABLE_API_TOKEN` | — | `.env` (requerida) |
| `AIRTABLE_API_URL` | `https://api.airtable.com` | `.env` o default seguro |

**0 bridges, 0 fallbacks legacy, 0 hardcodes.**

`config.py` y `airtable_adapter.py` ya estaban correctos desde origen — no requirieron modificación.

---

## Auditoría Meta API — 49 tablas

```
 1. AGENDA_SLOTS
 2. CALIFICACIONES_ATENCION
 3. CAMPAÑAS_MARKETING
 4. CAPACITACIONES
 5. CARRITOS
 6. CARRITO_ITEMS
 7. CATEGORIAS_MENU          ✅
 8. CITAS
 9. CLIENTES                  ✅ (existe)
10. CONCEPTOS_PAGO_EMPLEADO
11. CONFIGURACION_PUBLICA     ✅
12. COSTOS_FIJOS
13. CUENTAS_COBRO
14. CUPONES
15. EGRESOS
16. EMPLEADOS
17. ESCALAS_COMISION_EMPLEADO
18. HORARIOS_ATENCION
19. INSUMOS_SERVICIO
20. ITEMS_LIQUIDACION_EMPLEADO
21. ITEMS_VENTA
22. LANDING_SECCIONES
23. LIQUIDACIONES_EMPLEADOS
24. MODULOS                   ✅
25. MOVIMIENTOS_INVENTARIO
26. PACKS
27. PACK_ITEMS
28. PAGOS_COBROS
29. PAGOS_LIQUIDACION_EMPLEADO
30. PERFILES_LABORALES_EMPLEADO
31. PERMISOS_CAMPO
32. PERMISOS_MODULO
33. PRODUCTOS
34. PRODUCTOS_WEB
35. PROMOCIONES
36. PROVEEDORES
37. REDES_SOCIALES
38. REGLAS_LIQUIDACION_EMPLEADO
39. REPORTES_CONFIGURADOS
40. RESUMEN_COSTOS
41. ROLES
42. SERVICIOS                 ✅ (existe)
43. SERVICIOS_WEB
44. STOCK_OPERATIVO
45. SUCURSALES                ✅
46. TAREAS_INTERNAS
47. TESTIMONIOS
48. USUARIOS
49. VENTAS
```

### Coincidencias

| Buscada | Estado |
|---------|--------|
| CONFIGURACION_PUBLICA | ✅ **Existe** (tabla #11) |
| MODULOS | ✅ **Existe** (tabla #24) |
| CATEGORIAS_MENU | ✅ **Existe** (tabla #7) |
| SUCURSALES | ✅ **Existe** (tabla #45) |
| SERVICIOS | ✅ **Existe** (tabla #42) |
| CLIENTES | ✅ **Existe** (tabla #9) |
| PRODUCTOS_WEB | ✅ Existe (tabla #34 — ruta técnica, no P0) |
| MARCA_BLANCA | ❌ No existe como tabla separada |

### Diagnóstico del error anterior

El reporte FASE 1A original decía que las 4 tablas "no existían". **Causa:** los endpoints retornaban 404 no porque las tablas faltaran, sino porque el adapter no podía autenticar correctamente con el puente de variables legacy.

---

## Scope PRODUCTOS_WEB

| Aspecto | Estado |
|---------|--------|
| En Navbar principal | ❌ Eliminado |
| En subLinks Backoffice | ❌ Eliminado |
| En DashboardHome cards | ❌ Eliminado (reemplazado por Servicios + Clientes) |
| Ruta en App.jsx | ✅ Preservada como ruta técnica (`{/* Ruta técnica — no visible en navegación P0 */}`) |
| Página Productos.jsx | ✅ Conservada (sin borrar código) |

**Navegación P0 actual:** Sucursales, Servicios, Clientes.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/main.py` | Eliminado puente legacy (líneas 27-44). Health dinámico (no hardcode). |
| `frontend/src/components/Navbar.jsx` | Reemplazado Productos → Servicios + Clientes |
| `frontend/src/pages/Backoffice.jsx` | subLinks y DashboardHome: Productos → Servicios + Clientes |
| `frontend/src/App.jsx` | Agregadas rutas Servicios y Clientes. Productos como ruta técnica. |
| `frontend/src/pages/Servicios.jsx` | **Nuevo** — Página read-only placeholder (fetch `/api/servicios`) |
| `frontend/src/pages/Clientes.jsx` | **Nuevo** — Página read-only placeholder (fetch `/api/clientes`) |
| `docs/FASE_1A_MICROCORRECCION.md` | **Nuevo** — Este documento |

## Archivos NO tocados (verificados)

| Archivo | MD5 |
|---------|-----|
| `.env` | `ba42db8d6c411ec9b2d4912f60e211a9` |
| `static/api.js` | `5b51f96acccdb3b9950644b8a8ad2364` |
| `static/index.html` | `dbad282f74ebf83d975e3e76bb3e58e2` |
| `CREDENCIALES.md` | `38148b1548a97e1af236868fb513794b` |
| `harness/` | 22 archivos intactos |

---

## Validaciones ejecutadas

| # | Validación | Resultado |
|---|-----------|-----------|
| V1 | `main.py` sin bridge runtime | ✅ Ninguna referencia a tokens legacy |
| V2 | `main.py` sin base ID hardcodeado | ✅ `appuns6` no aparece |
| V3 | `config.py` solo vars estándar | ✅ 11 referencias a `AIRTABLE_*` |
| V4 | `.env.example` sin vars legacy | ✅ Solo `AIRTABLE_BASE_ID`, `AIRTABLE_API_TOKEN`, `AIRTABLE_API_URL` |
| V5 | `.env` intacto | ✅ MD5 coincide |
| V6 | `static/api.js` intacto | ✅ MD5 coincide |
| V7 | `static/index.html` intacto | ✅ MD5 coincide |
| V8 | `CREDENCIALES.md` intacto | ✅ MD5 coincide |
| V9 | `harness/` intacto | ✅ 22 archivos |
| V10 | PRODUCTOS_WEB fuera de Navbar | ✅ No aparece |
| V11 | PRODUCTOS_WEB fuera de Backoffice subLinks | ✅ No aparece |
| V12 | Servicios y Clientes en App.jsx | ✅ Rutas agregadas |
| V13 | Auditoría Meta API — tablas exactas listadas | ✅ 49 tablas |
| V14 | 4 tablas objetivo confirmadas existentes | ✅ CONFIGURACION_PUBLICA, MODULOS, CATEGORIAS_MENU, SUCURSALES |
| V15 | 0 escrituras Airtable | ✅ Solo GETs |

---

## Airtable — 0 escrituras

Confirmado: ningún endpoint nuevo creado. Los existentes son todos GET read-only. El health ahora usa `client.list_tables()` (Meta API read-only) para diagnóstico dinámico — no modifica datos.

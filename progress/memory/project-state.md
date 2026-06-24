# Project Memory — sistema-marca-blanca-multirrubro

## FASE_1K_C_FRONTEND_MARCA_BLANCA (COMPLETED)
- **Tecnología**: Vite + React + Tailwind CSS
- **Dominio**: https://bellezapro-demo.surge.sh
- **Backend**: https://earnest-comfort-production-3d75.up.railway.app
- **Datos**: Airtable base `appuns6zIUKaJG7r0` (50 tablas activas), incluye `MARCAS`, `USUARIOS`, `ROLES`
- **Consumer**: `frontend/src/context/BrandConfigContext.jsx` — única fuente de datos de marca
- **Endpoint**: `GET /api/marca-blanca` (Railway)
- **Variables CSS dinámicas**: 8 colores desde MARCAS.colores
- **Placeholders**: `{marca}` resuelto en 23 campos vía `resolvePlaceholders()`
- **Estado**: CERRADO ✅

## SALON-013_QA_FUNCIONAL_COMPLETO (COMPLETED)
- **Rutas**: 8/8 funcionales (/, /catalogo, /productos, /reserva, /login, /backoffice, /backoffice/agenda, /backoffice/clientes)
- **Roles**: 5 (ADMINISTRADOR, GERENTE, EMPLEADO_GESTION, PROFESIONAL, SOLO_LECTURA)
- **Seguridad**: 0 tokens en bundle, 0 Airtable directo, 0 PATCH/POST/DELETE
- **Consola**: 0 errores, 0 warnings
- **Estado**: CERRADO ✅

## MICROFIX_SALON_013 (COMPLETED)
- **Guard por rol**: PROFESIONAL redirigido a /profesional en rutas de gestión
- **Overflow**: html/body con overflow-x:hidden + max-width:100vw
- **Archivos**: App.jsx, index.css, App.css
- **Estado**: CERRADO ✅

## static/api.js — INCIDENTE SALON-014
- **Existe localmente**: Sí — `static/api.js` (raíz proyecto, 41 líneas, stub seguro)
- **Desplegado en Surge**: ❌ NO — fuera de `dist/`, Surge despliega desde `frontend/dist/`
- **URL pública `/api.js`**: Devuelve HTML (SPA 200.html), NO el archivo JS → seguro
- **Contenido local**: window.LegacyApiRetired = true + documentación. Sin tokens, sin Airtable, sin n8n.
- **Referenciado**: 0 archivos en frontend/src/

## MICROFIX_FRONTEND_BRANDCONFIG_SAFE (COMPLETED 2026-06-21)
- **Archivo**: `frontend/src/context/BrandConfigContext.jsx` (único modificado)
- **Fix 1**: `registroActivo` — fallback a `base.registroActivo` cuando `data.registro_activo` es undefined/null
- **Fix 2**: `googleMaps` — mapeado desde `textos.redes_maps` con fallback a `""`
- **Build**: ✅ npm run build (69 módulos, 0 errores)
- **Seguridad**: ✅ 0 airtable.com / AIRTABLE_TOKEN en frontend/src/
- **Deploy**: ❌ NO ejecutado (no autorizado)
- **CONFIGURACION_PUBLICA**: Sin tocar, sin deprecar
- **Estado**: CERRADO ✅

## PENDIENTES NO BLOQUEANTES
- QA mobile real (dispositivo/DevTools)
- Auth real JWT/bcrypt → planificar en FASE_2A_DRY_RUN
- Registro real de clientes
- Escritura real de reservas
- Carrito/pagos
- Multi-tenant real
- Menú hamburguer mobile
- Campos DEPRECATED_* en Airtable (eliminación manual)

## PRÓXIMA FASE
FASE_2A_AUTH_CLIENTE_REAL_DRY_RUN — Diseño de auth real SIN implementar

## FASE_2A — Auth Cliente Real Dry Run (COMPLETED 2026-06-21)
- **Decisión:** Auth propia FastAPI — JWT + bcrypt + HttpOnly cookies
- **Documento:** `docs/auth/FASE_2A_AUTH_CLIENTE_REAL_DRY_RUN.md`
- **Próximo:** FASE_2A_B (backend auth core, sin frontend ni clientes reales)
- **Base activa confirmada:** `appuns6zIUKaJG7r0` (50 tablas — la `app93Vhy56KrxNhwe` es DEPRECATED)

# FASE 1B — REPORTE INTEGRADO
## Navegación por Roles + Endpoints P0 + Diagnóstico Base

**Fecha:** 15 Jun 2026  
**Base Airtable:** `appuns6zIUKaJG7r0` (49 tablas)  
**Estado general:** ✅ Todos los endpoints P0 operativos

---

## 1. SALUD DEL BACKEND

| Indicador | Valor |
|-----------|-------|
| Status | `ok` |
| Fase | `FASE_1B_NAV_ROLES_CORE_READONLY` |
| Base ID presente | ✅ `appuns6zIUKaJG7r0` |
| API Token presente | ✅ (vía fallback legacy `AIRTABLE_CREDENCIALES`) |
| API URL | ✅ `https://api.airtable.com` (forzada, `.env` tenía URL incorrecta) |
| Tablas en base | **49** detectadas vía Meta API |

---

## 2. ENDPOINTS P0 — RESULTADOS

| # | Endpoint | HTTP | Records | Tabla Airtable | Notas |
|---|----------|------|---------|----------------|-------|
| 1 | `/api/configuracion-publica` | 200 | 90 | `CONFIGURACION_PUBLICA` | 90 flags de configuración (tipo `SI_NO`) |
| 2 | `/api/modulos` | 200 | 37 | `MODULOS` | Todos con `nombre: "sin_nombre"` — necesitan nombres reales |
| 3 | `/api/marca-blanca` | 200 | agregado | `CONFIGURACION_PUBLICA` + `MODULOS` | Campos de identidad vacíos (NOMBRE_SISTEMA, COLORES, LOGO = null) |
| 4 | `/api/categorias-menu` | 200 | 6 | `CATEGORIAS_MENU` | CLIENTES, ADMINISTRACION, GESTION, FINANZAS, MARKETING, CONFIGURACION |
| 5 | `/api/sucursales` | 200 | 7 | `SUCURSALES` | Ficticias (PAIS_FICTICIO, ONLINE), con MONEDA_PRINCIPAL=ARS |
| 6 | `/api/servicios` | 200 | 8 | `SERVICIOS` | Con CODIGO_SERVICIO, COSTO_TOTAL_ESTIMADO, PRECIO_MAXIMO |
| 7 | `/api/servicios-web` | 200 | 9 | `SERVICIOS_WEB` | Vinculados a SERVICIOS, con visibilidad web |
| 8 | `/api/clientes` | 200 | 13 | `CLIENTES` | Con NOMBRE_CLIENTE, FOTO_PERFIL, CALIFICACIONES |
| 9 | `/api/agenda-slots` | 200 | 12 | `AGENDA_SLOTS` | Slots con CAPACIDAD_TOTAL, ESTADO_SLOT=DISPONIBLE |
| 10 | `/api/citas` | 200 | 8 | `CITAS` | ESTADO_CITA=CONFIRMADA, vinculadas a CLIENTE + SERVICIO + AGENDA_SLOT |

**Resultado:** 10/10 endpoints OK. 0 escrituras realizadas.

---

## 3. ARQUITECTURA DE ROLES (FRONTEND)

### Roles implementados (mock, sin auth real)

| Rol | Acceso Backoffice | Módulos visibles |
|-----|-------------------|------------------|
| `PUBLICO` | ❌ Solo portal `/` | Landing, catálogo público |
| `ADMINISTRADOR` | ✅ Completo | Configuración, Sucursales, Servicios, Clientes, Agenda, Citas, Productos Web |
| `GERENTE` | ✅ Operativo | Sucursales, Servicios, Clientes, Agenda, Citas |
| `EMPLEADO_GESTION` | ✅ Limitado | Agenda, Citas, Clientes (solo lectura) |
| `PROFESIONAL` | ✅ Agenda propia | Agenda, Citas |
| `SOLO_LECTURA` | ✅ Solo lectura | Todos los módulos (read-only) |

### Componentes refactorizados
- `AuthContext.jsx` — `AuthProvider`, `useAuth()`, helpers `getNavLinks(role)`, `canAccessBackoffice(role)`, `getRoleLabel(role)`
- `Navbar.jsx` — Links dinámicos por rol, responsive
- `Backoffice.jsx` — Sidebar con acceso filtrado, `<Outlet>` para subrutas
- `App.jsx` — `<RequireRole>` guard, `/backoffice/*` con subrutas por módulo
- 6 páginas con estados `loading | error | empty`

---

## 4. SEED PLAN DRY-RUN (SIN ESCRITURA)

### Objetivo: Demo piloto "Salón de Belleza"

#### 4.1 Tablas que necesitan seed

| Tabla | Estado actual | Acción propuesta |
|-------|---------------|------------------|
| `CONFIGURACION_PUBLICA` | 90 flags — pero NOMBRE_SISTEMA, NOMBRE_NEGOCIO, COLORES, LOGO, TEXTOS_PUBLICOS, SECCIONES_VISIBLES están **NULL** | **Poblar 6 campos de identidad** para "Salón de Belleza Demo": nombre, colores (rosa-dorado), logo placeholder, textos públicos descriptivos |
| `MODULOS` | 37 registros — todos con `nombre: "sin_nombre"` | **Nombrar módulos**: Agenda, Clientes, Servicios, Caja, Inventario, Reportes, Configuración, Marketing, etc. |
| `SUCURSALES` | 7 — ficticias (PAIS_FICTICIO) | **Crear 1 sucursal demo real**: "Salón Belleza Centro", ARG, CABA, con WhatsApp realista |
| `SERVICIOS` | 8 — genéricos | **Asegurar servicios beauty**: Corte, Coloración, Peinado, Manicura, Pedicura, Tratamiento Capilar, Maquillaje, Depilación |
| `SERVICIOS_WEB` | 9 — vinculados | Revisar vínculos con servicios demo |
| `CLIENTES` | 13 — ficticios | **Crear 3-5 clientes demo**: nombres realistas argentinos, foto placeholder |
| `AGENDA_SLOTS` | 12 — DISPONIBLE | **Generar slots para próxima semana**: horarios 9-18hs, intervalos 30min |
| `CITAS` | 8 — CONFIRMADA | **Crear 3-5 citas demo**: cliente real + servicio real + slot real |
| `CATEGORIAS_MENU` | 6 — bien nombradas | No necesita seed inmediato |
| `MARCA_BLANCA` | ❌ No es tabla — es agregador de CONFIGURACION_PUBLICA | No aplica |

#### 4.2 Registros estimados a crear (DRY RUN — 0 writes)

| Tabla | Tipo | Cantidad estimada |
|-------|------|-------------------|
| `CONFIGURACION_PUBLICA` | UPDATE (6 campos) | 6 campos en registro existente |
| `MODULOS` | UPDATE (nombre) | ~37 registros |
| `SUCURSALES` | INSERT | 1 |
| `SERVICIOS` | UPDATE/INSERT | ~8 |
| `CLIENTES` | INSERT | 3-5 |
| `AGENDA_SLOTS` | INSERT | ~40 (1 semana) |
| `CITAS` | INSERT | 3-5 |

#### 4.3 Configuración demo propuesta

```json
{
  "marca_blanca": {
    "nombre_sistema": "Salón Belleza Pro",
    "nombre_negocio": "Belleza & Estilo",
    "colores": {
      "primario": "#D4A574",
      "secundario": "#2D2D2D",
      "acento": "#E8C4A2",
      "fondo": "#FAF5F0"
    },
    "logo": "💇‍♀️",
    "textos_publicos": {
      "hero": "Transformamos tu belleza",
      "subtitulo": "Profesionales a tu servicio desde 2010"
    },
    "secciones_visibles": ["servicios", "equipo", "reservas", "contacto"]
  },
  "sucursal_demo": {
    "codigo_sucursal": "SALON_CENTRO_001",
    "slug_sucursal": "salon-belleza-centro",
    "localidad": "CABA",
    "pais": "ARG",
    "estado_sucursal": "OPERATIVA",
    "whatsapp_sucursal": "5491112345678",
    "visibilidad_web": "PUBLICA"
  }
}
```

---

## 5. INCIDENCIAS RESUELTAS

| # | Incidencia | Solución |
|---|-----------|----------|
| 1 | `.env` tenía `AIRTABLE_API_URL=https://airtable.com` (sin `api.`) | Forzar URL canónica en `config.py` + `airtable_adapter.py` |
| 2 | `AIRTABLE_BASE_ID` no definido en `.env` (estaba hardcodeado en código viejo) | Fallback legacy + hardcode temporal `appuns6zIUKaJG7r0` |
| 3 | `AIRTABLE_API_TOKEN` no definido (legacy: `AIRTABLE_CREDENCIALES`) | Fallback a `AIRTABLE_CREDENCIALES` y `AIRTABLE_TOKEN_CREDENCIALES` |
| 4 | `fetch_schema()` bloqueaba event loop de uvicorn | Health endpoint simplificado (sin llamada API); workers=4 para endpoints |
| 5 | Health endpoint hacía llamada a Airtable (lento, bloqueante) | Separado en `/health` (rápido, solo config) y `/api/tablas` (bajo demanda) |

---

## 6. PRÓXIMOS PASOS (FUERA DE FASE 1B)

| Prioridad | Tarea | Dependencia |
|-----------|-------|-------------|
| P0 | Ejecutar seed plan (escribir en Airtable) | Aprobación del dry-run |
| P1 | Reemplazar roles mock por auth real (Supabase Auth) | Configuración Supabase |
| P1 | Conectar frontend a endpoints reales (fetch con auth) | Auth real |
| P2 | Implementar filtros por `marca_blanca_id` y `sucursal_id` en endpoints | Seed data con tenant real |
| P2 | Portal público con catálogo real de servicios | Endpoints con datos demo |

---

## 7. VERIFICACIÓN TÉCNICA FINAL

✅ Backend responde en `http://localhost:8420` con 4 workers  
✅ Health endpoint: `<200ms`  
✅ `/api/tablas`: 49 tablas detectadas  
✅ 10/10 endpoints P0 retornan 200 con datos reales  
✅ Frontend con navegación por roles funcional (Vite + React + Tailwind)  
✅ 0 escrituras a Airtable en toda la fase  
✅ `.env` no modificado  
✅ `harness/` no modificado

---

**Fase 1B completada.** Listo para seed plan con escritura real previa aprobación.

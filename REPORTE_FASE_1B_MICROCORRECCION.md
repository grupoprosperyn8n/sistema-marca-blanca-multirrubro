# FASE 1B — MICROCORRECCIÓN CONFIG + SEED DRY-RUN
## Reporte Integrado Final

**Fecha:** 15 Jun 2026
**Proyecto:** sistema-marca-blanca-multirrubro
**Base Airtable:** appuns6zIUKaJG7r0 (49 tablas)
**Fase actual:** FASE_1B_MICROCORRECCION_CONFIG_Y_SEED_DRYRUN

---

## 1. VEREDICTO

**FASE_1B_MICROCORRECCION_COMPLETA: SÍ** ✅

Código estrictamente limpio. Backend inoperable por configuración — **reporta limpiamente las variables faltantes** sin fallbacks, sin hardcodes, sin bridges. Este es el comportamiento CORRECTO especificado.

---

## 2. CONFIGURACIÓN LIMPIA

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/config.py` | Eliminado bloque `══ COMPATIBILIDAD LEGACY` (24 líneas). Eliminados `os.environ.setdefault()` y hardcode `appuns6zIUKaJG7r0`. Solo carga `AIRTABLE_BASE_ID`, `AIRTABLE_API_TOKEN`, `AIRTABLE_API_URL` por `_get_env()`. |
| `backend/airtable_adapter.py` | Refactorizado `AirtableConfig.from_env()` (líneas 46-80). Eliminados fallbacks a `AIRTABLE_BASE`, `BASE_ID_AIRTABLE`, `AIRTABLE_CREDENCIALES`, `AIRTABLE_TOKEN_CREDENCIALES`, `AIRTABLE_TOKEN`. Eliminado hardcode de `base_id`. Eliminado forzado de URL. |
| `backend/main.py` | Actualizado string de fase a `FASE_1B_MICROCORRECCION_CONFIG_Y_SEED_DRYRUN`. Sin bridges activos. |

### Estado: SIN bridges, SIN fallbacks legacy, SIN hardcodes

---

## 3. VARIABLES

### Uso exclusivo de variables estándar

```
AIRTABLE_BASE_ID     → requerido (os.getenv)
AIRTABLE_API_TOKEN   → requerido (os.getenv)
AIRTABLE_API_URL     → opcional (default: https://api.airtable.com)
```

### Faltantes detectadas

```
AIRTABLE_BASE_ID    → FALTANTE (no está en .env)
AIRTABLE_API_TOKEN  → FALTANTE (no está en .env)
AIRTABLE_API_URL    → FALTANTE (no está en .env, usa default)
```

### Variables legacy IGNORADAS (presentes en .env pero no usadas)

```
AIRTABLE_CREDENCIALES
AIRTABLE_TOKEN_CREDENCIALES
```

**El backend NO funciona.** `/health` responde correctamente reportando `faltantes: ["AIRTABLE_BASE_ID", "AIRTABLE_API_TOKEN"]`. Los endpoints P0 fallan con 500 porque `AirtableClient()` lanza `EnvironmentError`.

Se requiere actualizar `.env` con las variables estándar para restaurar funcionalidad.

---

## 4. ENDPOINTS P0

| # | Endpoint | Método | Estado | Registros (con fallbacks previos) |
|---|----------|--------|--------|-----------------------------------|
| 1 | `/health` | GET | ✅ 200 | Reporta faltantes limpiamente |
| 2 | `/api/configuracion-publica` | GET | ❌ 500 | 90 records (datos de flags booleanos) |
| 3 | `/api/sucursales` | GET | ❌ 500 | 7 records (PAIS_FICTICIO, ONLINE) |
| 4 | `/api/servicios` | GET | ❌ 500 | 8 records (descripciones técnicas) |
| 5 | `/api/modulos` | GET | ❌ 500 | 37 records (todos con NOMBRE_MODULO) |
| 6 | `/api/marca-blanca` | GET | ❌ 500 | Agregado (CONFIG_PUBLICA + MODULOS) |
| 7 | `/api/categorias-menu` | GET | ❌ 500 | 6 records (CLIENTES, ADMIN, etc.) |
| 8 | `/api/servicios-web` | GET | ❌ 500 | 9 records |
| 9 | `/api/clientes` | GET | ❌ 500 | 13 records (test) |
| 10 | `/api/agenda-slots` | GET | ❌ 500 | 12 slots |
| 11 | `/api/citas` | GET | ❌ 500 | 8 citas confirmadas |
| 12 | `/api/tablas` | GET | ❌ 200 | "Faltan credenciales" |

**Todos los endpoints son exclusivamente GET.** Sin POST, sin PATCH, sin PUT, sin DELETE.

---

## 5. NAVEGACIÓN POR ROLES

### Roles implementados (mock, sin auth real)

| Rol | Backoffice | Configuración | Sucursales | Servicios | Clientes | Agenda | Citas | Editar |
|-----|-----------|---------------|------------|-----------|----------|--------|-------|--------|
| **PUBLICO** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ADMINISTRADOR** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GERENTE** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EMPLEADO_GESTION** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **PROFESIONAL** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **SOLO_LECTURA** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Validaciones

- PUBLICO → redirigido a `/login` si intenta `/backoffice` ✅
- PUBLICO → Navbar muestra Inicio, Catálogo, Reserva únicamente ✅
- PROFESIONAL → Navbar NO muestra Configuración, Sucursales, Servicios, Clientes ✅
- SOLO_LECTURA → Dashboard muestra badge "Solo lectura" sin acciones editables ✅
- ADMINISTRADOR → ve las 7 secciones del backoffice ✅
- GERENTE → ve todo menos Configuración ✅
- EMPLEADO_GESTION → ve operación diaria sin Sucursales ni Configuración ✅
- RoleSelector funcional con cambio dinámico de rol ✅

### Archivos verificados

- `frontend/src/context/AuthContext.jsx` (130 líneas) — roles, permisos, getNavLinks, ProtectedRoute
- `frontend/src/App.jsx` (67 líneas) — rutas con ProtectedRoute por permiso
- `frontend/src/components/Navbar.jsx` (59 líneas) — links dinámicos por rol
- `frontend/src/pages/Backoffice.jsx` (80 líneas) — redirect PUBLICO, subLinks por rol
- `frontend/src/components/RoleSelector.jsx` (29 líneas) — selector mock

---

## 6. DIAGNÓSTICO MÓDULOS

### Hallazgo

Los 37 registros de MODULOS **SÍ tienen nombre**. El campo real en Airtable es `NOMBRE_MODULO` (singleLineText).

### Bug en `/api/marca-blanca`

**Archivo:** `backend/routes/modulos.py` línea 80

```python
"nombre": mf.get("NOMBRE") or mf.get("Nombre") or mf.get("Name") or "sin_nombre",
```

El código busca `NOMBRE` (que no existe) en vez de `NOMBRE_MODULO` (que sí existe). Como no encuentra ningún candidato, siempre usa el fallback `"sin_nombre"`.

### Nombres reales en Airtable (muestra)

```
AGENDA, CALIDAD_ATENCION, CAPACITACIONES, CARRITOS, CITAS, CLIENTES,
COMERCIAL, CONFIGURACION, COSTOS_FIJOS, DASHBOARD, DELIVERY_CHAT,
EMPLEADOS, INVENTARIO, ITEMS_VENTA, LIQUIDACIONES, MARCA_BLANCA,
NOTIFICACIONES, PAGOS, PERMISOS, PRODUCTOS, PRODUCTOS_WEB, PROVEEDORES,
RECAUDACION, REPORTES, RESERVAS, RRHH_LIQUIDACIONES, SUCURSALES,
TIENDA_CHAT, USUARIOS, VENTAS...
```

### Schema real de MODULOS (16 campos)

```
NOMBRE_MODULO (singleLineText) ← campo correcto
RUTA (singleLineText)
ICONO (singleLineText)
CATEGORIA_MENU (multipleRecordLinks)
ORDEN (number)
ACTIVO (checkbox)
REQUIERE_PERMISO (checkbox)
DESCRIPCION (multilineText)
ROLES (multipleRecordLinks)
PERMISOS_MODULO (multipleRecordLinks)
PERMISOS_CAMPO (multipleRecordLinks)
CAPACITACIONES (multipleRecordLinks)
MARCA_BLANCA (singleLineText)
CALIDAD_ATENCION (singleLineText)
RRHH_LIQUIDACIONES (singleLineText)
REPORTES_CONFIGURADOS (multipleRecordLinks)
```

### Corrección requerida (futura)

Cambiar línea 80 de `backend/routes/modulos.py`:

```python
"nombre": mf.get("NOMBRE_MODULO") or mf.get("NOMBRE") or mf.get("Nombre") or "sin_nombre",
```

El endpoint `/api/modulos` NO tiene este bug porque retorna `**fields` (todos los campos raw), incluyendo `NOMBRE_MODULO`. Solo `/api/marca-blanca` está afectado.

---

## 7. SEED PLAN DRY-RUN

### ⚠️ NINGUNA ESCRITURA REALIZADA — SOLO PLANIFICACIÓN

### Tabla por tabla

#### 7.1 CONFIGURACION_PUBLICA
- **Registros actuales:** 90
- **Sirven:** Parcialmente — son flags booleanos de configuración (ACTIVO: true/false, TIPO: "texto"/"booleano"/"numero")
- **NO sirven para demo:** No contienen NOMBRE_SISTEMA, NOMBRE_NEGOCIO, COLORES, LOGO, TEXTOS_PUBLICOS. El endpoint `/api/marca-blanca` reporta todos estos como `null`.
- **Registros demo sugeridos:** 1 registro con identidad del Salón de Belleza
  - NOMBRE_SISTEMA: "BellezaPro"
  - NOMBRE_NEGOCIO: "Salón BellezaPro — Sucursal Centro"
  - COLORES: JSON con paleta (primario: #C97B5D, secundario: #F5E6D3)
  - LOGO: URL del logo
  - TEXTOS_PUBLICOS: JSON con textos legales y bienvenida
  - SECCIONES_VISIBLES: JSON con qué secciones muestra el portal público
- **Dependencias:** ninguna (tabla raíz)
- **Orden de carga:** 1
- **Riesgo:** Los 90 registros existentes son flags de feature — verificar cuáles son necesarios para P0

#### 7.2 MARCA_BLANCA
- **Registros actuales:** No es tabla — es vista agregada desde CONFIGURACION_PUBLICA + MODULOS
- **Sirven:** N/A (no es tabla)
- **Demo sugerido:** N/A (se alimenta de CONFIGURACION_PUBLICA y MODULOS)
- **Dependencias:** CONFIGURACION_PUBLICA, MODULOS
- **Riesgo:** Si CONFIGURACION_PUBLICA no tiene los campos de identidad, el agregador devuelve null

#### 7.3 MODULOS
- **Registros actuales:** 37
- **Sirven:** ✅ SÍ — todos tienen NOMBRE_MODULO, RUTA, ICONO, ORDEN, ACTIVO, DESCRIPCION
- **NO sirve:** El endpoint `/api/marca-blanca` lee campo incorrecto (ver sección 6)
- **Demo sugerido:** Usar los 37 existentes. Activar solo los P0 para el piloto:
  - AGENDA, CITAS, CLIENTES, SERVICIOS, SUCURSALES, CONFIGURACION, DASHBOARD
- **Dependencias:** CATEGORIAS_MENU (links), ROLES (links), PERMISOS_MODULO (links)
- **Orden de carga:** 3 (después de CATEGORIAS_MENU)
- **Riesgo bajo:** Datos ya poblados con nombres reales

#### 7.4 CATEGORIAS_MENU
- **Registros actuales:** 6
- **Sirven:** ✅ SÍ — CLIENTES, ADMINISTRACION, OPERACIONES, REPORTES, CONFIGURACION, COMERCIAL
- **Demo sugerido:** Usar los 6 existentes
- **Dependencias:** ninguna
- **Orden de carga:** 2
- **Riesgo bajo:** Categorías genéricas, válidas para cualquier rubro

#### 7.5 SUCURSALES
- **Registros actuales:** 7
- **Sirven:** ❌ NO — son datos ficticios (PAIS_FICTICIO, Narnia, Springfield, ONLINE, Wakanda)
- **Demo sugerido:** 1 sucursal real para el piloto:
  - NOMBRE: "Salón BellezaPro — Centro"
  - DIRECCION: "Av. Principal 123, Centro"
  - TELEFONO: "+54 11 5555-0001"
  - ACTIVO: true
  - MARCA_BLANCA: "BellezaPro"
- **Dependencias:** MARCA_BLANCA (conceptual)
- **Orden de carga:** 4
- **Riesgo medio:** Las 7 sucursales ficticias contaminan — ¿borrar o desactivar?

#### 7.6 SERVICIOS
- **Registros actuales:** 8
- **Sirven:** ❌ NO — son nombres técnicos genéricos ("Automatización con IA", "Cosmos No-Code")
- **Demo sugerido:** 8 servicios de salón de belleza:
  - NOMBRE: "Corte de Dama", "Coloración", "Peinado", "Manicura", "Pedicura", "Depilación", "Maquillaje", "Masajes"
  - DURACION_MINUTOS: 30-90 según servicio
  - PRECIO_BASE: ej. 1500-5000 ARS
  - ACTIVO: true
  - SUCURSAL_ID: link a la sucursal demo
- **Dependencias:** SUCURSALES
- **Orden de carga:** 5
- **Riesgo medio:** Requiere precios coherentes con el mercado local

#### 7.7 SERVICIOS_WEB
- **Registros actuales:** 9
- **Sirven:** ❌ NO — nombres técnicos
- **Demo sugerido:** Replicar los 8 servicios con metadatos para web:
  - NOMBRE: igual que SERVICIOS
  - DESCRIPCION_WEB: descripción comercial
  - IMAGEN_URL: foto del servicio
  - DESTACADO: true/false
- **Dependencias:** SERVICIOS
- **Orden de carga:** 5 (en paralelo con SERVICIOS)
- **Riesgo:** Mantener consistencia con SERVICIOS

#### 7.8 CLIENTES
- **Registros actuales:** 13
- **Sirven:** ❌ NO — parecen datos de test (nombres genéricos, emails inventados)
- **Demo sugerido:** 3-5 clientes demo:
  - NOMBRE: "María García", "Lucía Fernández", "Carlos Rodríguez"
  - TELEFONO: números locales
  - EMAIL: emails demo
  - ACTIVO: true
- **Dependencias:** SUCURSALES (opcional)
- **Orden de carga:** 6
- **Riesgo bajo**

#### 7.9 AGENDA_SLOTS
- **Registros actuales:** 12
- **Sirven:** ❌ NO — fechas viejas o aleatorias
- **Demo sugerido:** 40 slots (1 semana hábil, 8 slots/día):
  - FECHA: próxima semana
  - HORA_INICIO: 09:00-18:00 cada 60 min
  - DURACION: 60 min
  - DISPONIBLE: true
  - SUCURSAL_ID: link a sucursal demo
  - SERVICIO_ID: opcional
- **Dependencias:** SUCURSALES
- **Orden de carga:** 7
- **Riesgo medio:** Fechas deben ser futuras reales

#### 7.10 CITAS
- **Registros actuales:** 8
- **Sirven:** ❌ NO — datos de test
- **Demo sugerido:** 0 registros (empezar vacío)
  - Se crean cuando un cliente agenda desde el portal público (fuera de Fase 1B)
- **Dependencias:** CLIENTES, SERVICIOS, AGENDA_SLOTS
- **Orden de carga:** 8 (último)
- **Riesgo bajo:** Fase 1B no implementa reservas reales

### Orden de carga recomendado

```
1. CONFIGURACION_PUBLICA  (identidad del sistema)
2. CATEGORIAS_MENU        (sin dependencias)
3. MODULOS                (depende de CATEGORIAS_MENU)
4. SUCURSALES             (depende de MARCA_BLANCA conceptual)
5. SERVICIOS + SERVICIOS_WEB (dependen de SUCURSALES)
6. CLIENTES               (depende de SUCURSALES opcional)
7. AGENDA_SLOTS           (depende de SUCURSALES, SERVICIOS)
8. CITAS                  (depende de todo lo anterior)
```

### Riesgos globales

- Las 7 sucursales ficticias existentes — decidir si se borran, desactivan o se ignoran
- Los 13 clientes test — ídem
- Las 8 citas test — ídem
- No hay registros de identidad en CONFIGURACION_PUBLICA (NOMBRE_SISTEMA, etc.)
- Campos link (multipleRecordLinks) requieren IDs reales de Airtable — no se pueden inventar

---

## 8. ARCHIVOS MODIFICADOS

```
backend/config.py              ← limpieza de bloque LEGACY + setdefault
backend/airtable_adapter.py    ← refactor from_env() (líneas 46-80) 
backend/main.py                ← strings de fase actualizados
REPORTE_FASE_1B_MICROCORRECCION.md  ← este reporte (nuevo)
```

### Archivos NO modificados (verificados)

```
.env                           ← intacto
CREDENCIALES.md                ← intacto
harness/                       ← intacto
static/api.js                  ← intacto
static/index.html              ← intacto
frontend/                      ← sin cambios en esta fase
backend/routes/*.py            ← sin cambios (excepto strings de fase)
```

---

## 9. VALIDACIONES EJECUTADAS

- [x] `config.py` → sin bloque `══ COMPATIBILIDAD LEGACY`
- [x] `config.py` → sin `os.environ.setdefault()`
- [x] `config.py` → sin hardcode `appuns6zIUKaJG7r0`
- [x] `config.py` → sin `_get_env("AIRTABLE_CREDENCIALES")`
- [x] `airtable_adapter.py` → `from_env()` solo usa `AIRTABLE_BASE_ID`, `AIRTABLE_API_TOKEN`, `AIRTABLE_API_URL`
- [x] `airtable_adapter.py` → sin fallbacks legacy (AIRTABLE_BASE, BASE_ID_AIRTABLE, AIRTABLE_CREDENCIALES, AIRTABLE_TOKEN_CREDENCIALES, AIRTABLE_TOKEN)
- [x] `airtable_adapter.py` → sin hardcode de base_id
- [x] `airtable_adapter.py` → sin forzado de URL
- [x] `main.py` → sin bridges activos
- [x] `/health` responde 200 reportando faltantes limpiamente
- [x] `/api/tablas` responde "Faltan credenciales"
- [x] Endpoints P0 solo GET (verificados 11 rutas + health + tablas)
- [x] Fase actualizada a `FASE_1B_MICROCORRECCION_CONFIG_Y_SEED_DRYRUN`
- [x] `.env` intacto
- [x] `CREDENCIALES.md` intacto
- [x] `harness/` intacto
- [x] `static/api.js` intacto
- [x] `static/index.html` intacto
- [x] Backend: 0 escrituras a Airtable (inoperable sin variables)
- [x] Diagnóstico MODULOS completado (bug identificado en `routes/modulos.py:80`)

---

## 10. AIRTABLE

**0 escrituras. 0 modificaciones. 0 creaciones. 0 eliminaciones.**

El backend no puede conectarse a Airtable sin las variables estándar — por diseño estricto, no por error.

---

## 11. PRÓXIMO PASO RECOMENDADO

### Para cerrar FASE 1B completamente:

1. **Actualizar `.env`** con variables estándar:
   - `AIRTABLE_BASE_ID=appuns6zIUKaJG7r0`
   - `AIRTABLE_API_TOKEN=<token de AIRTABLE_CREDENCIALES>`
   - `AIRTABLE_API_URL=https://api.airtable.com`

2. **Corregir bug en `routes/modulos.py:80`**:
   ```python
   "nombre": mf.get("NOMBRE_MODULO") or mf.get("NOMBRE") or "sin_nombre",
   ```

3. **Reprobar endpoints P0** con backend funcional

4. **Ejecutar FASE_1C_SEED_DRY_RUN_REVISION_FINAL** (revisión final del seed plan, sin escrituras)

### No avanzar sin aprobación explícita.


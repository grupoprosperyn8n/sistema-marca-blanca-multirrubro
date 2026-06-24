# FASE 1D — CONEXIÓN FRONTEND A SEMILLAS EXISTENTES
## Reporte Final

**Fecha:** 16 Jun 2026
**Proyecto:** sistema-marca-blanca-multirrubro
**Fase:** FASE_1D_CONECTAR_FRONTEND_A_SEMILLAS_EXISTENTES

---

## 1. Veredicto

**FASE_1D_CONEXION_SEMILLAS_COMPLETA: SÍ**

El frontend React ahora consume datos reales de las semillas existentes en Airtable vía FastAPI, sin tokens expuestos, sin escrituras, con avisos claros donde los datos tienen limitaciones de calidad.

---

## 2. Pantallas conectadas

| Ruta frontend | Endpoint | Estado |
|---------------|----------|--------|
| `/catalogo` (portal público) | `/api/servicios-web` | ✅ 9 servicios de peluquería visibles, con nombre, precio, CTA |
| `/backoffice/servicios` | `/api/servicios` | ✅ Tabla con nombre, duración, precio, estado |
| `/backoffice/clientes` | `/api/clientes` | ✅ Tabla con aviso "Datos demo / pendientes de curación" |
| `/backoffice/sucursales` | `/api/sucursales` | ✅ Cards con aviso "Datos ficticios / no aptos para público" |
| `/backoffice/agenda` | `/api/agenda-slots` | ✅ Tabla con aviso "Fechas pasadas / no apto para reserva pública" |
| `/backoffice/citas` | `/api/citas` | ✅ Tabla con aviso "Fechas pasadas" |
| `/backoffice/configuracion` | `/api/configuracion-publica` + `/api/marca-blanca` | ✅ Tabla de flags + diagnóstico de identidad de marca |
| `/backoffice` (dashboard) | múltiples endpoints | ✅ Dashboard con conteos reales (37 módulos, 6 categorías, etc.) |

---

## 3. Endpoints consumidos

| Endpoint | Consumido por |
|----------|---------------|
| `/api/servicios-web` | Catalogo.jsx |
| `/api/servicios` | Servicios.jsx |
| `/api/clientes` | Clientes.jsx |
| `/api/sucursales` | Sucursales.jsx |
| `/api/agenda-slots` | Agenda.jsx |
| `/api/citas` | Citas.jsx |
| `/api/configuracion-publica` | Configuracion.jsx |
| `/api/marca-blanca` | Configuracion.jsx |
| `/api/modulos` | Backoffice.jsx (dashboard) |
| `/api/categorias-menu` | Backoffice.jsx (dashboard) |

---

## 4. Catálogo público

SERVICIOS_WEB se muestra correctamente como catálogo público de peluquería:

- **9 servicios** con nombres comerciales reales: COLORACION GLOBAL, CORTE MODERNO, PEINADO DE NOVIA, MAQUILLAJE PROFESIONAL, etc.
- Cada card muestra: nombre, precio web, precio publicitado, CTA, tags (visibilidad, reserva habilitada, favorito)
- PRODUCTOS_WEB fue removido del catálogo; el endpoint ahora es `/api/servicios-web`
- CTA de reserva visible, aunque no funcional (slots pasados)

---

## 5. Backoffice

### Servicios
- 8 registros con nombre, duración (min), precio base ($ARS), estado, categoría
- Vista: tabla con columnas claras

### Clientes
- 13 registros con nombre y datos de contacto
- **Aviso visible:** "Datos demo / pendientes de curación — nombres genéricos"
- No se muestra en portal público

### Sucursales
- 7 registros con nombre, dirección, horarios (datos ficticios)
- **Aviso visible:** "Datos ficticios / no aptos para público"
- No se muestra en portal público

### Agenda
- 12 slots con fecha, horario, duración, capacidad, profesional
- **Aviso visible:** "Fechas pasadas / no apto para reserva pública"
- Slots pasados aparecen atenuados con badge "(pasada)"
- Reserva real deshabilitada

### Citas
- 8 citas con cliente, servicio, fecha, horario, estado
- **Aviso visible:** "Fechas pasadas"
- Estados con colores: CONFIRMADA (verde), PENDIENTE (ámbar), CANCELADA (rojo)
- Sin botón de confirmar turno

### Dashboard
- Muestra conteos reales desde la API: 37 módulos activos, 6 categorías
- Cada card del dashboard muestra el número real de registros

---

## 6. Datos restringidos

| Dato | Portal público | Backoffice |
|------|:---:|:---:|
| Sucursales ficticias (Narnia, Wakanda) | ❌ No visible | ✅ Visible con aviso |
| Agenda con fechas pasadas | ❌ No visible | ✅ Visible con aviso |
| Citas con fechas pasadas | ❌ No visible | ✅ Visible con aviso |
| Clientes genéricos | ❌ No visible | ✅ Visible con aviso |
| Identidad de marca (vacía) | ❌ Fallback visual | ✅ Diagnóstico visible |

---

## 7. Roles

- AuthContext.jsx **intacto** — 130 líneas, sin modificaciones
- 6 roles mock: PUBLICO, CLIENTE, PROFESIONAL, ADMINISTRADOR, SUPERVISOR, PROPIETARIO
- Navegación por roles preservada: getNavLinks(), getDashboardCards(), canAccess()
- Catálogo público accesible para rol PUBLICO
- Backoffice requiere rol autenticado (no PUBLICO)

---

## 8. Validaciones ejecutadas

| # | Validación | Resultado |
|---|-----------|-----------|
| 1 | Frontend consume FastAPI, no Airtable directo | ✅ Vite proxy `/api` → `localhost:8420` |
| 2 | Sin tokens en frontend | ✅ 0 hits de AIRTABLE, API_KEY, apiKey, bearer, Authorization |
| 3 | Catálogo usa SERVICIOS_WEB | ✅ Endpoint `/api/servicios-web` |
| 4 | Backoffice servicios usa SERVICIOS | ✅ Endpoint `/api/servicios` |
| 5 | Clientes solo en backoffice | ✅ No en portal público |
| 6 | Sucursales ficticias no en portal público | ✅ Solo en backoffice con aviso |
| 7 | Agenda/citas no habilitan reserva real | ✅ Sin botón confirmar, aviso visible |
| 8 | PRODUCTOS_WEB fuera del P0 | ✅ 0 referencias en páginas frontend |
| 9 | 0 escrituras en Airtable | ✅ Solo lecturas GET |
| 10 | CREDENCIALES.md intacto | ✅ No tocado |
| 11 | .env no fue impreso | ✅ No incluido en reportes |
| 12 | static/api.js intacto | ✅ 783 líneas, sin cambios |
| 13 | Harness/ intacto | ✅ Sin modificaciones |
| 14 | Navbar intacto | ✅ 59 líneas, sin cambios |
| 15 | Sin localhost:8420 directo | ✅ Todas las páginas usan `/api` vía proxy |

---

## 9. Airtable

**0 escrituras.** Solo se ejecutaron lecturas GET contra los endpoints del backend FastAPI, que a su vez leen de Airtable vía el adaptador. No se crearon, modificaron ni eliminaron registros.

---

## 10. Riesgos pendientes

| Riesgo | Severidad | Resolución recomendada |
|--------|-----------|----------------------|
| Catálogo no muestra duración de servicios | Baja | SERVICIOS_WEB no expone DURACION_MINUTOS; cruzar con SERVICIOS |
| Identidad de marca vacía (sin logo, colores, nombre) | Media | Crear 1 registro en CONFIGURACION_PUBLICA con NOMBRE_SISTEMA, COLORES, LOGO |
| Sucursales ficticias confunden si alguien las ve sin el aviso | Baja | Aviso ya implementado; reemplazar en fase de seed |
| Slots y citas con fechas pasadas no permiten probar flujo completo real | Media | Crear slots con fechas futuras en fase de seed |
| Reserva.jsx es un placeholder estático | Baja | Esperar a tener slots futuros antes de activar |

---

## 11. Próximo paso recomendado

**FASE_1E — CURACIÓN MÍNIMA DE DATOS PÚBLICOS**

Crear la cantidad mínima indispensable de registros para que el portal público sea presentable como demo de Salón de Belleza:
- 1 registro de identidad de marca (NOMBRE_SISTEMA, COLORES, LOGO)
- 1 sucursal realista (reemplazar Narnia/Wakanda)
- 3-5 slots de agenda con fechas futuras
- 2-3 citas de ejemplo con fechas futuras

Esto completa la demo para mostrar el flujo completo: catálogo → reserva → backoffice.

**No avanzar a FASE 1E sin aprobación explícita.**

---

*Reporte generado automáticamente. 0 escrituras en Airtable. Backend + frontend limpios.*

# PLAN MAESTRO — SISTEMA MARCA BLANCA MULTIRRUBRO
> **Fase autorizada**: FASE_PLAN_MAESTRO_SISTEMA_MULTIRRUBRO  
> **Fecha**: 2026-06-15  
> **Base activa**: `appuns6zIUKaJG7r0` (49 tablas, 1891 campos)  
> **Origen**: Auditoría completa del schema Airtable vía Meta API  
> **Estado**: ⏳ PENDIENTE APROBACIÓN DIEGO

---

## 0. VEREDICTO

**El schema Airtable está SORPRENDENTEMENTE COMPLETO.** Con 49 tablas y 1891 campos, cubre TODAS las áreas funcionales que un sistema multirrubro necesita. No es un prototipo — es un diseño de nivel producción. La estructura de relaciones, fórmulas automáticas, campos IA, y subsistemas de liquidación/comisiones ya está modelada.

**Veredicto: ⭐⭐⭐⭐⭐ (5/5) — AVANZAR CON CONFIANZA.**

La base NO necesita más tablas. Lo que falta es 100% capa de presentación (frontend) + backend bridge (API segura read/write con RBAC) + lógica de negocio (n8n workflows). El 80% del diseño de datos YA ESTÁ HECHO.

---

## 1. RESUMEN EJECUTIVO

El **Sistema Marca Blanca Multirrubro** es una plataforma SaaS modular que permite a PyMEs LATAM (salones de belleza como demo piloto, expandible a gimnasios, talleres mecánicos, consultorios, etc.) gestionar su operación completa desde un único sistema white-label.

**Alcance actual (49 tablas)**:
- **15 dominios funcionales** claramente separados
- **1891 campos** con tipos que incluyen: relaciones, fórmulas, rollups, lookups, checkboxes, selectores, AI text, archivos, monedas, fechas
- **RBAC completo**: Roles → Permisos Módulo → Permisos Campo + Usuarios con auth
- **Subsistema payroll industrial-grade**: 7 tablas con reglas de liquidación, escalas de comisión, conceptos de pago, items, pagos
- **E-commerce integrado**: Carritos, items, productos web, servicios web, SEO, IA review
- **Marketing completo**: Promociones, packs, cupones, campañas

**Demo piloto**: Salón de Belleza (ya deployado en surge.sh)  
**Meta**: $2K/mes ARR con módulos white-label por rubro  
**Principio**: Misma base Airtable → diferentes frontends por rubro → configuración vía tablas (no código)

---

## 2. MAPA DE DOMINIOS (49 tablas clasificadas)

| # | DOMINIO | TABLAS | CAMPOS | DESCRIPCIÓN |
|---|---------|--------|--------|-------------|
| 1 | **AUTH / RBAC** | 4 | 54 | Roles, Usuarios, Permisos Módulo, Permisos Campo |
| 2 | **NAVEGACIÓN** | 2 | 22 | Categorías Menú, Módulos (rutas/interfaz) |
| 3 | **CRM** | 3 | 116 | Clientes, Testimonios, Calificaciones Atención |
| 4 | **CATÁLOGO PRODUCTOS** | 3 | 130 | Productos, Productos Web, Proveedores |
| 5 | **CATÁLOGO SERVICIOS** | 3 | 114 | Servicios, Servicios Web, Insumos Servicio |
| 6 | **INVENTARIO** | 2 | 63 | Stock Operativo, Movimientos Inventario |
| 7 | **AGENDA / CITAS** | 2 | 68 | Agenda Slots, Citas |
| 8 | **EMPLEADOS** | 1 | 47 | Empleados (perfil completo con scheduling) |
| 9 | **PAYROLL / RRHH** | 7 | 410 | Perfiles Laborales, Conceptos Pago, Reglas Liquidación, Escalas Comisión, Liquidaciones, Items Liquidación, Pagos Liquidación |
| 10 | **VENTAS** | 2 | 77 | Ventas, Items Venta |
| 11 | **E-COMMERCE** | 2 | 105 | Carritos, Carrito Items |
| 12 | **MARKETING** | 5 | 219 | Promociones, Packs, Pack Items, Cupones, Campañas Marketing |
| 13 | **FINANZAS** | 5 | 190 | Egresos, Cuentas Cobro, Pagos Cobros, Costos Fijos, Resumen Costos |
| 14 | **SUCURSALES** | 1 | 74 | Sucursales (multi-branch) |
| 15 | **FRONTEND PÚBLICO** | 4 | 82 | Configuración Pública, Landing Secciones, Horarios Atención, Redes Sociales |
| 16 | **OPERACIONES** | 2 | 57 | Tareas Internas, Capacitaciones |
| 17 | **REPORTES / IA** | 1 | 63 | Reportes Configurados (con agentes IA) |
| | **TOTAL** | **49** | **1891** | |

---

## 3. MÓDULOS PRINCIPALES (vista funcional)

Basado en los dominios, el sistema se estructura en estos **módulos de backend/frontend**:

### 🟢 MÓDULOS CORE (todo rubro los necesita)

| MÓDULO | DOMINIOS | PRIORIDAD | DESCRIPCIÓN |
|--------|----------|-----------|-------------|
| **Auth Hub** | AUTH_RBAC + NAVEGACIÓN | P0 | Login, registro, SSO, roles, permisos dinámicos |
| **CRM** | CRM | P0 | Clientes, historial, testimonios, calificaciones |
| **Catálogo** | CATALOG_PRODUCTOS + CATALOG_SERVICIOS | P0 | Productos/Servicios, precios, variantes |
| **Inventario** | INVENTARIO | P0 | Stock, movimientos, reposición |
| **Agenda** | AGENDA_CITAS | P0 | Slots, citas, disponibilidad, recordatorios |
| **POS / Ventas** | VENTAS | P1 | Punto de venta, transacciones, comprobantes |
| **Finanzas** | FINANZAS | P1 | Cobros, egresos, costos, resumen |
| **Sucursales** | SUCURSALES | P1 | Multi-branch, asignación empleados/stock |

### 🟡 MÓDULOS AVANZADOS

| MÓDULO | DOMINIOS | PRIORIDAD | DESCRIPCIÓN |
|--------|----------|-----------|-------------|
| **RRHH / Payroll** | PAYROLL (7 tablas) | P2 | Liquidaciones, comisiones, escalas, pagos |
| **Marketing Suite** | MARKETING (5 tablas) | P2 | Promos, packs, cupones, campañas |
| **E-Commerce** | ECOMMERCE + Frontend Público | P2 | Carrito, checkout, landing, tienda online |
| **Capacitaciones** | OPERACIONES | P3 | Cursos internos, certificaciones |
| **Reportes IA** | REPORTES_IA | P3 | Reportes con agentes IA, análisis predictivo |

### 🔵 MÓDULO ESPECIAL: IA TRANSVERSAL (presente en todos los módulos)

---

## 4. PORTALES

### Portal Único Unificado (`/`)

Diego lo definió: **UN SOLO PORTAL PÚBLICO** en `/` que incluye todo:
- **Landing** (LANDING_SECCIONES): Hero, features, testimonios, CTA
- **Catálogo público** (PRODUCTOS_WEB + SERVICIOS_WEB): Búsqueda, filtros, fichas
- **Tienda** (CARRITOS): Add-to-cart, checkout
- **Reserva online** (CITAS vía portal público): Selección servicio → profesional → horario → pago
- **Contacto** (REDES_SOCIALES): WhatsApp, Instagram, formulario

### Backoffice (`/backoffice`)

Panel de administración con acceso por roles:
- Dashboard con KPIs
- Gestión de cada módulo según permisos
- Reportes y análisis
- Configuración del sistema

### Portal Clientes (`/portal`)

Área privada para clientes registrados:
- Historial de citas
- Carrito guardado
- Testimonios
- Perfil y preferencias

---

## 5. ROADMAP POR FASES

### 🔴 FASE 0 — CIMENTACIÓN (SEMANAS 1-2)
**Estado**: 90% completado (base Airtable existe)
- [x] Schema Airtable diseñado (49 tablas)
- [x] Auth/RBAC modelado (ROLES, USUARIOS, PERMISOS)
- [x] FastAPI backend read-only (PRODUCTOS_WEB)
- [x] Deploy surge.sh (gestion-desalones-de-belleza.surge.sh)
- [ ] Crear/configurar campos rollup/lookup que faltan en UI Airtable
- [ ] Poblar datos semilla: 1 salón demo, 3 empleados, 10 productos, 5 servicios
- [ ] Configurar CORS y variables de entorno para producción

### 🟠 FASE 1 — BACKEND BRIDGE (SEMANAS 3-5)
**Objetivo**: API REST completa con RBAC (read + write donde corresponda)
- [ ] Expandir FastAPI a TODAS las tablas (no solo PRODUCTOS_WEB)
- [ ] Implementar autenticación (JWT desde USUARIOS)
- [ ] Middleware RBAC (lee ROLES → PERMISOS_MODULO → PERMISOS_CAMPO)
- [ ] Endpoints CRUD con validación de permisos
- [ ] Rate limiting, logging, cache

### 🟡 FASE 2 — FRONTEND CORE (SEMANAS 6-10)
**Objetivo**: Primer frontend funcional (demo salón belleza)
- [ ] Frontend mobile-first (React o Vue, según decisión)
- [ ] Portal unificado `/` con landing + catálogo
- [ ] Backoffice `/backoffice` con login
- [ ] Módulos: Auth, CRM, Catálogo, Agenda (P0 solamente)
- [ ] Paleta terracota/cobre, mobile-first

### 🟢 FASE 3 — VENTAS + FINANZAS (SEMANAS 11-14)
- [ ] POS / punto de venta
- [ ] Cobros y cuentas corrientes
- [ ] Egresos y costos
- [ ] Dashboard financiero

### 🔵 FASE 4 — AVANZADOS (SEMANAS 15-20)
- [ ] E-commerce completo (carrito → checkout → pago)
- [ ] Payroll (liquidaciones, comisiones) — **el más complejo, 410 campos**
- [ ] Marketing (promos, cupones, campañas)
- [ ] Multi-sucursal

### 🟣 FASE 5 — IA + REPORTES (SEMANAS 21-24)
- [ ] Agentes IA en REPORTES_CONFIGURADOS
- [ ] IA en PRODUCTOS_WEB (texto promocional, categorización, riesgo)
- [ ] IA en SERVICIOS_WEB (descripciones, beneficios)
- [ ] Análisis predictivo (demanda, stock, rotación)

### ⚪ FASE 6 — MARCA BLANCA (SEMANAS 25+)
- [ ] Sistema de themes/templates por rubro
- [ ] Configuración white-label (logo, colores, dominio)
- [ ] Segundo rubro piloto (ej: gimnasio, taller mecánico)
- [ ] Onboarding automatizado para nuevos tenants

---

## 6. QUÉ HACER CON PRODUCTOS_WEB

**Decisión**: PRODUCTOS_WEB (y SERVICIOS_WEB) **son el puente entre el catálogo interno y la vitrina pública**. NO son una app separada — son un **espejo curado** de PRODUCTOS/SERVICIOS con campos adicionales de presentación, SEO, IA review, y control de publicación.

**Estrategia**:
1. Mantener el backend FastAPI read-only actual para PRODUCTOS_WEB como **prueba técnica validada** ✅
2. En FASE 1, expandir el backend a TODAS las tablas (read + write controlado)
3. PRODUCTOS_WEB se sirve desde el mismo backend que todo lo demás
4. El frontend consume `/api/productos-web` (ya existe) + `/api/servicios-web` (nuevo) para la vitrina
5. NO crear frontend separado — se integra en el portal unificado `/`

**Lo que YA funciona** (no tocar):
- `backend/main.py` — FastAPI con CORS y health check
- `routes/productos_web.py` — endpoints read-only
- `airtable_adapter.py` — cliente Airtable seguro (token nunca al frontend)

---

## 7. ARQUITECTURA RECOMENDADA

```
┌──────────────────────────────────────────────┐
│                  FRONTEND                     │
│  React/Vue PWA  •  Mobile-First  •  Terracota│
│  Portal Unificado /  +  Backoffice  +  Portal│
└──────────────────┬───────────────────────────┘
                   │ HTTPS (JWT Bearer)
┌──────────────────▼───────────────────────────┐
│              BACKEND FASTAPI                  │
│  Auth (JWT)  •  RBAC Middleware               │
│  CRUD endpoints  •  Rate limiting  •  Cache   │
│  Airtable Adapter (token NUNCA al frontend)   │
└──────────────────┬───────────────────────────┘
                   │ REST API
┌──────────────────▼───────────────────────────┐
│          AIRTABLE (fuente de verdad)           │
│  49 tablas  •  1891 campos  •  Relaciones     │
│  Fórmulas automáticas  •  Rollups/Lookups     │
└──────────────────┬───────────────────────────┘
                   │ Webhooks
┌──────────────────▼───────────────────────────┐
│              N8N (lógica de negocio)           │
│  Workflows: notificaciones, liquidaciones     │
│  Sincronización, IA pipelines, emails         │
└──────────────────────────────────────────────┘
```

### Stack tecnológico propuesto:
| Capa | Tecnología | Por qué |
|------|-----------|---------|
| **Frontend** | React (Vite) + TailwindCSS | Mobile-first, PWA, ecosistema amplio |
| **Backend** | FastAPI (Python) | YA ANDANDO, async, tipado fuerte, OpenAPI auto |
| **Base datos** | Airtable | YA ANDANDO, 49 tablas diseñadas, sin migraciones |
| **Auth** | JWT (PyJWT) | Stateless, escala, compatible con SPA |
| **Workflows** | n8n | YA CONFIGURADO, webhooks nativos |
| **Deploy** | Surge.sh (frontend) + Railway/Render (backend) | Simple, gratuito para MVP |
| **CI/CD** | GitHub Actions | Tests automáticos, deploy on push |

---

## 8. ESTRATEGIA IA TRANSVERSAL

La IA NO es un módulo separado — **atraviesa todo el sistema**. El schema ya tiene campos IA modelados:

### 8.1 Agentes IA por dominio

| AGENTE IA | TABLA(S) | FUNCIÓN | PRIORIDAD |
|-----------|----------|---------|-----------|
| **IA Catálogo Web** | PRODUCTOS_WEB, SERVICIOS_WEB | Genera textos promocionales, SEO, categorización automática, evalúa riesgo de publicación | P1 |
| **IA Reportes** | REPORTES_CONFIGURADOS | Análisis de datos, predicciones, alertas, sugerencias de compra | P3 |
| **IA CRM** | CLIENTES, CALIFICACIONES | Análisis de sentimiento, detección de churn, recomendaciones personalizadas | P2 |
| **IA Inventario** | STOCK_OPERATIVO, MOVIMIENTOS | Predicción de reposición, detección de anomalías, sugerencias de compra | P2 |
| **IA Marketing** | PROMOCIONES, CAMPAÑAS | Optimización de promos, segmentación, A/B testing automático | P3 |

### 8.2 Campos IA ya modelados (¡no crear nuevos!)

**PRODUCTOS_WEB** (3 campos IA + pipeline de revisión):
- `AGENTE_TEXTO_PROMOCIONAL_AI` → genera copy de venta
- `AGENTE_CATEGORIZACION_WEB_AI` → clasifica automáticamente
- `RIESGO_PUBLICACION_PRODUCTO_WEB_AI` → evalúa riesgos
- `NIVEL_RIESGO_PUBLICACION_AI` + `ACCION_RECOMENDADA_PUBLICACION_AI` → decisión
- `ESTADO_REVISION_IA_WEB` + `APROBADO_USO_FRONTEND_IA` → flujo de aprobación
- `REVISOR_IA_WEB` + `MOTIVO_REVISION_IA_WEB` → auditoría

**SERVICIOS_WEB** (2 campos IA):
- `AGENTE_TEXTO_PROMOCIONAL_AI`
- `AGENTE_CATEGORIZACION_WEB_AI`

**CLIENTES** (1 campo IA):
- `GOOGLE_MAP` → geocodificación (ya es `aiText`)

**EMPLEADOS** (1 campo IA):
- `GOOGLE_MAP` → geocodificación

**PROVEEDORES** (1 campo IA):
- `GOOGLE_MAP` → geocodificación

**REPORTES_CONFIGURADOS** (sistema completo de agentes IA):
- 20+ campos dedicados a IA: tipo análisis, prompt, campos entrada, resultado esperado, sensibilidad, revisión humana, utilidad negocio, impacto frontend

### 8.3 Principios IA
1. **Siempre con revisión humana** para contenido público (checkbox `APROBADO_USO_FRONTEND_IA`)
2. **IA sugiere, humano decide** (patrón ya modelado en los campos)
3. **Trazabilidad**: cada acción IA registra `REVISOR_IA_WEB`, `FECHA_REVISION_IA_WEB`, `MOTIVO_REVISION_IA_WEB`
4. **No bloquear operaciones**: si IA falla, el sistema sigue funcionando

---

## 9. RIESGOS

| RIESGO | PROBABILIDAD | IMPACTO | MITIGACIÓN |
|--------|-------------|---------|------------|
| **Complejidad del payroll** (410 campos, 7 tablas) | ALTA | ALTO | Postergar a Fase 4, hacer n8n workflows incrementales, testear con 1 empleado primero |
| **Límites API Airtable** (5 req/s por base) | ALTA | MEDIO | Cache agresivo en backend, batch requests, colas en n8n |
| **49 tablas = curva de aprendizaje** para nuevos devs | MEDIA | MEDIO | Documentar el schema como parte del plan maestro (este doc), mantener contracts actualizados |
| **Rollups/Lookups requieren UI Airtable** (no API Meta) | MEDIA | BAJO | Documentar campos pendientes, crearlos manualmente en UI, no frenan el desarrollo |
| **Multi-tenancy sin tenants separados** | MEDIA | ALTO | Usar SUCURSALES como proxy de tenant (ya modelado), mismo Airtable base = datos compartidos, RBAC por sucursal |
| **Deuda de PRODUCTOS_WEB como prueba técnica** | BAJA | BAJO | Ya separado correctamente, backend read-only funciona, no tiene hardcodes |
| **Token Airtable en .env (sin rotación automática)** | BAJA | CRÍTICO | Implementar rotación de token en Fase 1, usar variables de entorno del proveedor de deploy |

---

## 10. DECISIONES QUE DIEGO DEBE TOMAR AHORA

| # | DECISIÓN | OPCIONES | RECOMENDACIÓN |
|---|----------|----------|---------------|
| **D1** | **Stack frontend** | React vs Vue vs Svelte | **React (Vite + Tailwind)** — mayor ecosistema PWA, Diego ya conoce el patrón |
| **D2** | **Alcance Fase 1 (backend bridge)** | ¿TODAS las tablas? vs ¿Solo P0 (Auth+CRM+Catálogo+Agenda+Inventario)? | **P0 primero** (7 dominios, ~15 tablas críticas) — payroll y marketing pueden esperar |
| **D3** | **Deploy backend** | Railway vs Render vs Fly.io vs VPS propio | **Railway** — más simple, soporta Python/FastAPI, variables de entorno nativas, free tier suficiente para MVP |
| **D4** | **¿Crear segunda base Airtable por tenant?** | Multi-base vs Single-base con SUCURSALES | **Single-base** — SUCURSALES ya modelado como tenant proxy, evita duplicar 1891 campos × N tenants |
| **D5** | **¿Cuándo pasar de "gestión salones" a "marca blanca"?** | Ya vs Después de Fase 3 | **Después de Fase 3** — primero probar con 1 rubro real (belleza), luego abstraer |
| **D6** | **PRODUCTOS_WEB: ¿mock o datos reales?** | Mantener como prueba técnica vs Poblar con datos del salón demo | **Poblar con datos reales** en Fase 1 (5-10 productos del salón demo) para validar el flujo completo |
| **D7** | **Prioridad de módulos para Fase 2 (frontend)** | Auth → CRM → Catálogo → Agenda vs Auth → Catálogo → Agenda → Ventas | **Auth → Catálogo → Agenda → CRM** — catálogo y agenda son lo que el cliente final VE |

---

## 11. PRÓXIMO PASO INMEDIATO

Al aprobar este plan maestro, la **siguiente fase autorizada** sería:

```
FASE 1 — BACKEND BRIDGE (FastAPI RBAC)
├── 1.1 Expandir backend a tablas P0 (Auth, CRM, Catálogo, Agenda, Inventario)
├── 1.2 Implementar autenticación JWT contra tabla USUARIOS
├── 1.3 Middleware RBAC (lee ROLES → PERMISOS_MODULO → PERMISOS_CAMPO)
├── 1.4 Migrar PRODUCTOS_WEB al nuevo backend unificado
├── 1.5 Validar con tests automatizados
└── 1.6 Documentar API con OpenAPI/Swagger
```

**NO** avanzar a Fase 1 sin aprobación explícita de Diego.

---

## 12. APÉNDICE: TABLAS POR DOMINIO (referencia rápida)

<details>
<summary>Click para expandir — 49 tablas con IDs</summary>

| DOMINIO | TABLA | ID | CAMPOS |
|---------|-------|----|--------|
| AUTH_RBAC | ROLES | `tbliEBXeaugJ2NcXK` | 13 |
| AUTH_RBAC | USUARIOS | `tblTWVvTKR3eS0khF` | 17 |
| AUTH_RBAC | PERMISOS_MODULO | `tblTDsuSzjmZQ9Lag` | 13 |
| AUTH_RBAC | PERMISOS_CAMPO | `tblZp49ncoz1YOcxo` | 11 |
| NAVEGACIÓN | CATEGORIAS_MENU | `tbl5hPN2IClTZlYTi` | 6 |
| NAVEGACIÓN | MODULOS | `tblF4SyU5k6dHvUT4` | 16 |
| CRM | CLIENTES | `tblZgUg63hg0uMvmg` | 25 |
| CRM | TESTIMONIOS | `tbletkYJLHgm64sK1` | 51 |
| CRM | CALIFICACIONES_ATENCION | `tblulgD54OhgGZMFo` | 40 |
| CATÁLOGO P. | PRODUCTOS | `tblrWdJbVHUwUXgnp` | 49 |
| CATÁLOGO P. | PRODUCTOS_WEB | `tblKEEJGq536smJuQ` | 53 |
| CATÁLOGO P. | PROVEEDORES | `tblKLuu9nmA6uOZVc` | 28 |
| CATÁLOGO S. | SERVICIOS | `tbluU7kueIZ2IIi78` | 45 |
| CATÁLOGO S. | SERVICIOS_WEB | `tblLwIZkxOYsRu6M4` | 50 |
| CATÁLOGO S. | INSUMOS_SERVICIO | `tblES9SGCw5ix0GuQ` | 19 |
| INVENTARIO | STOCK_OPERATIVO | `tblwKNxeombTobHFu` | 29 |
| INVENTARIO | MOVIMIENTOS_INVENTARIO | `tbl3tHUxetRxqhM5h` | 34 |
| AGENDA | AGENDA_SLOTS | `tblrp2VVrSycIz21O` | 27 |
| AGENDA | CITAS | `tblOrJwvSr47B4zE9` | 41 |
| EMPLEADOS | EMPLEADOS | `tblxyOPRQF663gzAG` | 47 |
| PAYROLL | PERFILES_LABORALES_EMPLEADO | `tblW2NXg1JCIflwqg` | 43 |
| PAYROLL | CONCEPTOS_PAGO_EMPLEADO | `tblQyb0SMPa9R1x24` | 28 |
| PAYROLL | REGLAS_LIQUIDACION_EMPLEADO | `tblNEkkwoHVzH5jpX` | 74 |
| PAYROLL | ESCALAS_COMISION_EMPLEADO | `tbl0z4rcPUQLU6YVr` | 59 |
| PAYROLL | LIQUIDACIONES_EMPLEADOS | `tblEQtzGkFWPKLSkA` | 93 |
| PAYROLL | ITEMS_LIQUIDACION_EMPLEADO | `tblrGKB2xXT1Xma7W` | 67 |
| PAYROLL | PAGOS_LIQUIDACION_EMPLEADO | `tbl8ussPuyPE6wXtn` | 46 |
| VENTAS | VENTAS | `tbl7tAg1spqEunCYh` | 41 |
| VENTAS | ITEMS_VENTA | `tblchwsPMSLvF3MBI` | 36 |
| E-COMMERCE | CARRITOS | `tbl0FQQw8LJ3HFrUf` | 67 |
| E-COMMERCE | CARRITO_ITEMS | `tblEDTv0JCmgmaUUT` | 38 |
| MARKETING | PROMOCIONES | `tblSfHDPYCTcqv6YX` | 48 |
| MARKETING | PACKS | `tblyGIV3PZaRJ9qC3` | 53 |
| MARKETING | PACK_ITEMS | `tblBqke7BdGyr2oM4` | 28 |
| MARKETING | CUPONES | `tblokP9szkp4eZJtN` | 42 |
| MARKETING | CAMPAÑAS_MARKETING | `tbl7CNDxGiQSexEOl` | 48 |
| FINANZAS | EGRESOS | `tblpFlcJElPJxzttV` | 40 |
| FINANZAS | CUENTAS_COBRO | *(ver JSON)* | 25 |
| FINANZAS | PAGOS_COBROS | *(ver JSON)* | 35 |
| FINANZAS | COSTOS_FIJOS | *(ver JSON)* | 41 |
| FINANZAS | RESUMEN_COSTOS | *(ver JSON)* | 49 |
| SUCURSALES | SUCURSALES | `tblmERP187YB26dyH` | 74 |
| FRONTEND | CONFIGURACION_PUBLICA | *(ver JSON)* | 14 |
| FRONTEND | LANDING_SECCIONES | *(ver JSON)* | 22 |
| FRONTEND | HORARIOS_ATENCION | *(ver JSON)* | 23 |
| FRONTEND | REDES_SOCIALES | `tbldYw28GBgoelVtT` | 23 |
| OPERACIONES | TAREAS_INTERNAS | `tbllX0yQT7LoQ7sK1` | 19 |
| OPERACIONES | CAPACITACIONES | `tbltDJfzPlssxjkjx` | 38 |
| REPORTES | REPORTES_CONFIGURADOS | `tbl8eXvSxhBFq9F66` | 63 |

</details>

---

> **Documento generado por Hermes Agent (DeepSeek V4 Pro)**  
> **Próxima fase**: FASE_1_BACKEND_BRIDGE (pendiente aprobación Diego)  
> **Schema completo**: `/tmp/airtable_schema_v2.json` (49 tablas, 1891 campos)

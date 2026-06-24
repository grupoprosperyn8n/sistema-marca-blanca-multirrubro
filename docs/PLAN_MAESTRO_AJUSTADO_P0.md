# PLAN MAESTRO AJUSTADO — SISTEMA MARCA BLANCA MULTIRRUBRO
> **Fase autorizada**: FASE_PLAN_MAESTRO_AJUSTE_P0  
> **Fecha**: 2026-06-15  
> **Base activa**: `appuns6zIUKaJG7r0` (49 tablas, 1891 campos)  
> **Origen**: Plan Maestro original + decisiones de Diego  
> **Estado**: ⏳ PENDIENTE APROBACIÓN DIEGO

---

## 0. VEREDICTO

**PLAN_P0_AJUSTADO: SI** ✅

Las decisiones de Diego corrigen 3 puntos críticos del plan original:
1. **P0 era demasiado ambicioso** (incluía productos, inventario, ventas) → ahora P0 es el NÚCLEO REAL: auth + configuración + CRM + servicios + agenda
2. **MARCA_BLANCA no estaba diferenciada de SUCURSALES** → ahora son capas separadas desde el día 1
3. **PRODUCTOS_WEB estaba mal posicionado** como centro del catálogo → ahora es prueba técnica validada, el centro es SERVICIOS_WEB + SERVICIOS

Las 49 tablas y 1891 campos del schema siguen siendo el activo más valioso. Nada cambia en la base. El ajuste es de PRIORIDADES y ORDEN DE CONSTRUCCIÓN.

---

## 1. RESUMEN EJECUTIVO (sin cambios)

El **Sistema Marca Blanca Multirrubro** es una plataforma SaaS modular para PyMEs LATAM. Demo piloto: Salón de Belleza. Meta: $2K/mes ARR. Principio: misma base Airtable → diferentes frontends por rubro → configuración vía tablas (no código).

---

## 2. ARQUITECTURA DE TENANT (CORREGIDO)

### ❌ Visión anterior (incorrecta)
```
SUCURSALES = tenant proxy
→ Problema: confunde "negocio" con "sucursal física"
```

### ✅ Visión corregida
```
MARCA_BLANCA (tenant lógico)
├── CONFIGURACION_PUBLICA (branding: colores, logo, textos)
├── LANDING_SECCIONES (contenido del portal público)
├── MODULOS.MARCA_BLANCA (filtro de módulos por tenant)
│
└── SUCURSALES (unidades operativas)
    ├── EMPLEADOS (asignados a sucursales)
    ├── STOCK_OPERATIVO (por sucursal)
    ├── AGENDA_SLOTS (por sucursal)
    ├── CITAS (en sucursal)
    └── HORARIOS_ATENCION (por sucursal)
```

**Regla**: 
- **MARCA_BLANCA** = 1 registro por negocio/cliente (nombre, branding, dominio)
- **SUCURSALES** = N registros por marca blanca (ubicaciones físicas)
- Un negocio puede tener 1 o N sucursales. Una sucursal pertenece a 1 marca blanca.

**Estado actual del schema**: MARCA_BLANCA no es una tabla independiente — existe como campo `singleLineText` en MODULOS. CONFIGURACION_PUBLICA (14 campos) es la tabla de branding. Para Fase 1 alcanza con lectura de CONFIGURACION_PUBLICA + mock de tenant.

---

## 3. MAPA DE DOMINIOS (49 tablas — sin cambios)

| # | DOMINIO | TABLAS | CAMPOS | PRIORIDAD |
|---|---------|--------|--------|-----------|
| 1 | **AUTH / RBAC** | 4 | 54 | 🔴 P0 |
| 2 | **NAVEGACIÓN** | 2 | 22 | 🔴 P0 |
| 3 | **CRM** | 3 | 116 | 🔴 P0 |
| 4 | **CATÁLOGO SERVICIOS** | 3 | 114 | 🔴 P0 |
| 5 | **AGENDA / CITAS** | 2 | 68 | 🔴 P0 |
| 6 | **SUCURSALES** | 1 | 74 | 🔴 P0 |
| 7 | **FRONTEND PÚBLICO** | 4 | 82 | 🔴 P0 |
| 8 | **EMPLEADOS** | 1 | 47 | 🟡 P1 |
| 9 | **CATÁLOGO PRODUCTOS** | 3 | 130 | 🟡 P1 |
| 10 | **INVENTARIO** | 2 | 63 | 🟡 P1 |
| 11 | **VENTAS** | 2 | 77 | 🟡 P1 |
| 12 | **FINANZAS** | 5 | 190 | 🟠 P2 |
| 13 | **E-COMMERCE** | 2 | 105 | 🟠 P2 |
| 14 | **MARKETING** | 5 | 219 | 🟠 P2 |
| 15 | **PAYROLL / RRHH** | 7 | 410 | 🟣 P3 |
| 16 | **OPERACIONES** | 2 | 57 | 🟣 P3 |
| 17 | **REPORTES / IA** | 1 | 63 | 🟣 P3 |
| | **TOTAL** | **49** | **1891** | |

---

## 4. FASE 0: CIMENTACIÓN (COMPLETADA ✅)

Lo que ya existe y funciona:
- [x] Schema Airtable completo (49 tablas, 1891 campos)
- [x] Auth/RBAC modelado (ROLES, USUARIOS, PERMISOS_MODULO, PERMISOS_CAMPO)
- [x] FastAPI backend funcionando (read-only PRODUCTOS_WEB)
- [x] Deploy surge.sh como prueba técnica
- [x] Plan Maestro auditado y documentado

---

## 5. FASE 1: P0 — NÚCLEO REAL DEL SISTEMA (CORREGIDO)

**Objetivo**: Shell de app funcional con login, navegación por rol, catálogo de servicios, agenda, y portal público unificado. Todo read-only vía FastAPI bridge. Sin productos, sin inventario, sin ventas.

### 5.1 ¿QUÉ INCLUYE P0?

| # | CAPA | QUÉ SE CONSTRUYE | TABLAS INVOLUCRADAS |
|---|------|-----------------|---------------------|
| **1** | **Shell React + Vite + Tailwind** | App base con router, layout, tema terracota/cobre, PWA manifest | — |
| **2** | **Login mock** | Pantalla de login con validación contra USUARIOS (sin JWT real aún — mock de sesión) | USUARIOS (read) |
| **3** | **Roles mock** | Selector de rol para desarrollo. En producción: lee ROLES del usuario | ROLES (read) |
| **4** | **Navegación por rol** | Menú dinámico que lee MODULOS y filtra por permisos del rol activo | MODULOS, ROLES, PERMISOS_MODULO (read) |
| **5** | **FastAPI bridge read-only** | Backend unificado que expone TODAS las tablas P0 como endpoints GET | USUARIOS, ROLES, PERMISOS_MODULO, PERMISOS_CAMPO, MODULOS, CATEGORIAS_MENU, CLIENTES, SERVICIOS, SERVICIOS_WEB, CITAS, AGENDA_SLOTS, SUCURSALES, CONFIGURACION_PUBLICA, LANDING_SECCIONES, HORARIOS_ATENCION, REDES_SOCIALES, TESTIMONIOS, CALIFICACIONES_ATENCION |
| **6** | **Marca blanca / configuración pública** | Endpoint GET `/api/configuracion-publica` que devuelve branding (colores, logo, textos). Mock de tenant con 1 registro. | CONFIGURACION_PUBLICA (read) |
| **7** | **Portal público unificado (`/`)** | Página pública con: landing (LANDING_SECCIONES), catálogo de servicios (SERVICIOS_WEB), reserva de turnos (AGENDA_SLOTS → CITAS), sucursales, horarios, contacto, testimonios, redes | LANDING_SECCIONES, SERVICIOS_WEB, AGENDA_SLOTS, SUCURSALES, HORARIOS_ATENCION, REDES_SOCIALES, TESTIMONIOS |
| **8** | **Backoffice (`/backoffice`)** | Panel con login + navegación. Listados read-only de clientes, servicios, citas, sucursales | CLIENTES, SERVICIOS, CITAS, SUCURSALES |
| **9** | **Catálogo de servicios** | Listado + ficha de servicios con precios, duración, profesionales. Filtros por categoría. | SERVICIOS, SERVICIOS_WEB |
| **10** | **Agenda y citas** | Vista de slots disponibles → selección → confirmación de cita (read-only + mock de reserva) | AGENDA_SLOTS, CITAS |

### 5.2 ¿QUÉ EXCLUYE P0? (PAUSADO)

| QUEDA PAUSADO | MOTIVO | FASE PREVISTA |
|---------------|--------|---------------|
| **PRODUCTOS_WEB** | Prueba técnica validada. No es el centro del sistema (el centro es SERVICIOS). No escribir datos nuevos. | Fase 2 |
| **PRODUCTOS** (catálogo) | No es prioritario para demo salón de belleza (servicios primero) | Fase 2 |
| **PROVEEDORES** | Depende de PRODUCTOS | Fase 2 |
| **INVENTARIO** (STOCK_OPERATIVO, MOVIMIENTOS) | Depende de PRODUCTOS | Fase 2 |
| **VENTAS** (VENTAS, ITEMS_VENTA) | Depende de PRODUCTOS + SERVICIOS + CLIENTES | Fase 3 |
| **FINANZAS** (EGRESOS, COSTOS, COBROS) | Depende de VENTAS | Fase 3 |
| **E-COMMERCE** (CARRITOS) | Depende de PRODUCTOS_WEB + VENTAS | Fase 3 |
| **MARKETING** (PROMOCIONES, PACKS, CUPONES) | Complejidad alta, no bloquea demo | Fase 4 |
| **PAYROLL** (7 tablas, 410 campos) | Altísima complejidad, no necesario para demo | Fase 5 |
| **CAPACITACIONES** | Secundario | Fase 5 |
| **REPORTES IA** | Depende de datos reales en producción | Fase 5 |
| **EMPLEADOS** (completo) | Solo lectura básica en P0. Gestión completa pospuesta. | Fase 2 |
| **ESCRITURA en Airtable** | P0 es 100% read-only. Las escrituras vienen en Fase 2. | Fase 2 |

---

## 6. DEPENDENCIAS: QUÉ TABLAS SE NECESITAN PRIMERO

### Orden estricto de lectura (P0):

```
PASO 1 — CONFIGURACIÓN DEL SISTEMA
  ├── CONFIGURACION_PUBLICA (branding, colores, logo)
  ├── CATEGORIAS_MENU (estructura de navegación)
  ├── MODULOS (rutas, íconos, orden)
  └── LANDING_SECCIONES (contenido del portal público)

PASO 2 — AUTH & RBAC
  ├── ROLES (definiciones de rol)
  ├── USUARIOS (cuentas de acceso)
  ├── PERMISOS_MODULO (qué puede ver cada rol)
  └── PERMISOS_CAMPO (qué campos puede ver/editar cada rol)

PASO 3 — ESTRUCTURA OPERATIVA
  ├── SUCURSALES (ubicaciones físicas)
  ├── HORARIOS_ATENCION (cuándo atiende cada sucursal)
  └── REDES_SOCIALES (canales de contacto)

PASO 4 — CATÁLOGO
  ├── SERVICIOS (servicios ofrecidos)
  └── SERVICIOS_WEB (vitrina pública de servicios)

PASO 5 — AGENDA
  ├── AGENDA_SLOTS (horarios disponibles por profesional/sucursal)
  └── CITAS (reservas de clientes)

PASO 6 — CRM
  ├── CLIENTES (perfiles de cliente)
  ├── TESTIMONIOS (reseñas públicas)
  └── CALIFICACIONES_ATENCION (métricas de calidad)
```

---

## 7. ORDEN DE IMPLEMENTACIÓN (PASO A PASO)

### 🟢 SEMANA 1: SHELL + CONFIGURACIÓN
```
1.1 Crear proyecto React + Vite + Tailwind
1.2 Tema terracota/cobre (CSS variables, paleta)
1.3 Router base (/, /backoffice, /portal)
1.4 FastAPI: expandir endpoints a CONFIGURACION_PUBLICA, MODULOS, CATEGORIAS_MENU
1.5 Frontend: leer configuración pública y aplicar branding dinámico
```

### 🟢 SEMANA 2: AUTH + NAVEGACIÓN
```
2.1 FastAPI: endpoints USUARIOS, ROLES, PERMISOS_MODULO, PERMISOS_CAMPO
2.2 Frontend: pantalla de login mock (sin JWT, sesión en memoria)
2.3 Frontend: menú dinámico que filtra MODULOS según ROL del usuario
2.4 Frontend: layout base (sidebar + contenido + header con branding)
```

### 🟡 SEMANA 3: SUCURSALES + HORARIOS + CONTACTO
```
3.1 FastAPI: endpoints SUCURSALES, HORARIOS_ATENCION, REDES_SOCIALES
3.2 Backoffice: listado de sucursales (read-only)
3.3 Portal público: sección sucursales + horarios + redes sociales
```

### 🟡 SEMANA 4: CATÁLOGO DE SERVICIOS
```
4.1 FastAPI: endpoints SERVICIOS, SERVICIOS_WEB
4.2 Portal público: catálogo de servicios con filtros y ficha
4.3 Backoffice: listado de servicios (read-only)
```

### 🟠 SEMANA 5: AGENDA + CITAS
```
5.1 FastAPI: endpoints AGENDA_SLOTS, CITAS
5.2 Portal público: selector de servicio → profesional → horario → mock de confirmación
5.3 Backoffice: vista de citas del día (read-only)
```

### 🟠 SEMANA 6: CRM + LANDING COMPLETO
```
6.1 FastAPI: endpoints CLIENTES, TESTIMONIOS, CALIFICACIONES_ATENCION
6.2 Portal público: testimonios destacados, calificaciones
6.3 Portal público: landing completa con LANDING_SECCIONES (hero, features, CTA)
6.4 Backoffice: listado de clientes (read-only)
```

### 🔵 SEMANA 7: INTEGRACIÓN + PULIDO
```
7.1 Tests end-to-end (playwright o cypress)
7.2 Responsive completo (mobile-first verificado)
7.3 PWA manifest + service worker
7.4 Documentación de endpoints (OpenAPI/Swagger)
7.5 Deploy a surge.sh del portal público
```

---

## 8. PORTAL PÚBLICO UNIFICADO (CONFIRMADO)

El portal público es **UNA SOLA APLICACIÓN** en `/` que integra:

| SECCIÓN | FUENTE DE DATOS | COMPONENTE |
|---------|----------------|------------|
| **Landing** | LANDING_SECCIONES | Hero, features, about, CTA principal |
| **Catálogo de servicios** | SERVICIOS_WEB + SERVICIOS | Cards, filtros, búsqueda, ficha con precio/duración |
| **Catálogo de productos** | PRODUCTOS_WEB (pausado hasta Fase 2) | — |
| **Reserva de turnos** | AGENDA_SLOTS → CITAS | Selector servicio → profesional → fecha/hora → confirmar |
| **Sucursales** | SUCURSALES | Mapa, direcciones, teléfonos |
| **Horarios** | HORARIOS_ATENCION | Tabla de horarios por sucursal |
| **Contacto** | REDES_SOCIALES | WhatsApp, Instagram, email, formulario |
| **Testimonios** | TESTIMONIOS | Carrusel de reseñas con estrellas |
| **CTA** | LANDING_SECCIONES (botones CTA) | "Reservar turno", "Ver servicios" |

**NO** se separan en portales distintos. **NO** hay `/tienda` separado. Todo en `/`.

---

## 9. QUÉ QUEDA PAUSADO (EXPLÍCITO)

### PRODUCTOS_WEB
- **Estado**: Prueba técnica completada y validada ✅
- **Backend**: `backend/main.py` + `routes/productos_web.py` siguen funcionando
- **NO** se expande con datos nuevos
- **NO** se integra al portal público en P0
- **Se retoma en Fase 2** cuando se active el catálogo de productos
- Si se quiere poblar datos demo → PRIMERO hacer dry-run de seed (sin escribir todavía)

### PRODUCTOS + PROVEEDORES + INVENTARIO
- Pausados hasta Fase 2
- El schema está listo. Solo falta frontend + endpoints.

### VENTAS + FINANZAS
- Pausados hasta Fase 3
- Dependen de PRODUCTOS + SERVICIOS + CLIENTES funcionando

### E-COMMERCE + MARKETING
- Pausados hasta Fase 3-4
- Dependen de catálogo + ventas funcionando

### PAYROLL + CAPACITACIONES + REPORTES IA
- Pausados hasta Fase 5
- Complejidad extrema (410 campos solo en payroll). No necesario para demo.

### EMPLEADOS (gestión completa)
- Pausado hasta Fase 2
- En P0 solo se leen para mostrar "profesional asignado" en servicios y citas.

---

## 10. RIESGOS DE CONSTRUIR DEMASIADO RÁPIDO

| RIESGO | CONSECUENCIA | MITIGACIÓN (aplicada en este ajuste) |
|--------|-------------|--------------------------------------|
| **Hacer P0 con 20 tablas** | Parálisis por análisis, nunca se llega a demo | ✅ P0 limitado a 18 tablas (solo lectura). Nada de escritura. |
| **Empezar por PRODUCTOS en vez de SERVICIOS** | Demo salón belleza no muestra su core (servicios) | ✅ SERVICIOS es P0. PRODUCTOS es Fase 2. |
| **Construir e-commerce antes que agenda** | Un salón de belleza agenda citas, no vende productos online (al inicio) | ✅ AGENDA es P0. CARRITOS es Fase 3. |
| **Diseñar frontend sin tener configuración pública** | Branding hardcodeado, cada cambio requiere deploy | ✅ CONFIGURACION_PUBLICA en semana 1. Branding dinámico desde día 1. |
| **No diferenciar MARCA_BLANCA de SUCURSALES** | Imposible escalar a múltiples tenants después | ✅ Distinción clara desde P0. Tablas separadas conceptualmente. |
| **Postergar marca blanca** | El core del producto ("white-label") llega tarde | ✅ CONFIGURACION_PUBLICA + MODULOS.MARCA_BLANCA en P0. |
| **Querer JWT real en P0** | Complejidad innecesaria para demo | ✅ Login mock primero. JWT real en Fase 2. |
| **Migrar todo el legacy de golpe** | Riesgo de rotura, pérdida de lo que funciona | ✅ Migración progresiva. PRODUCTOS_WEB legacy se deja intacto. |

---

## 11. DECISIONES DE DIEGO (RESUELTAS EN ESTE AJUSTE)

| # | DECISIÓN | RESPUESTA DE DIEGO | APLICADO EN |
|---|----------|-------------------|-------------|
| D1 | Stack frontend | ✅ React + Vite + Tailwind (migración progresiva) | §5, §7 |
| D2 | Alcance Fase 1 | ✅ Solo P0 (Auth, Config, CRM, Servicios, Agenda) | §5.1 |
| D3 | Deploy backend | ✅ Railway más adelante. Primero local. | §7 (sin deploy) |
| D4 | Multi-tenant | ✅ Single base. MARCA_BLANCA ≠ SUCURSALES. | §2 |
| D5 | Marca blanca | ✅ En Fase 1. CONFIGURACION_PUBLICA + lectura inicial. | §5.1, §7 (semana 1) |
| D6 | PRODUCTOS_WEB | ✅ Prueba técnica validada. NO centro del sistema. | §9 |
| D7 | Prioridad frontend | ✅ Shell → Login → Config → Sucursales → Servicios → Agenda → CRM | §7 |

---

## 12. PRÓXIMO PASO

Al aprobar este plan ajustado, la siguiente fase sería:

```
FASE_1_P0_NUCLEO_REAL
├── SEMANA 1: Shell React + Configuración pública + FastAPI expandido
├── SEMANA 2: Auth mock + Navegación por rol
├── SEMANA 3: Sucursales + Horarios + Redes
├── SEMANA 4: Catálogo de servicios
├── SEMANA 5: Agenda y citas
├── SEMANA 6: CRM + Landing completa
└── SEMANA 7: Integración + Tests + PWA + Deploy
```

**Próximo prompt recomendado**:
> *"Iniciar FASE_1_P0_NUCLEO_REAL — Semana 1: crear proyecto React + Vite + Tailwind con tema terracota/cobre y expandir backend FastAPI a CONFIGURACION_PUBLICA, MODULOS, CATEGORIAS_MENU. Solo lectura. Sin Airtable writes."*

---

## 13. APÉNDICE: TABLAS P0 (18 tablas activas en Fase 1)

| DOMINIO | TABLA | CAMPOS | USO EN P0 |
|---------|-------|--------|-----------|
| FRONTEND | CONFIGURACION_PUBLICA | 14 | Branding dinámico |
| FRONTEND | LANDING_SECCIONES | 22 | Portal público |
| FRONTEND | HORARIOS_ATENCION | 23 | Horarios en portal |
| FRONTEND | REDES_SOCIALES | 23 | Contacto en portal |
| NAVEGACIÓN | CATEGORIAS_MENU | 6 | Menú backoffice |
| NAVEGACIÓN | MODULOS | 16 | Rutas + navegación |
| AUTH | ROLES | 13 | Roles mock |
| AUTH | USUARIOS | 17 | Login mock |
| AUTH | PERMISOS_MODULO | 13 | Navegación por rol |
| AUTH | PERMISOS_CAMPO | 11 | Visibilidad de campos |
| SUCURSALES | SUCURSALES | 74 | Ubicaciones en portal |
| CATÁLOGO S. | SERVICIOS | 45 | Catálogo + fichas |
| CATÁLOGO S. | SERVICIOS_WEB | 50 | Vitrina pública |
| AGENDA | AGENDA_SLOTS | 27 | Disponibilidad |
| AGENDA | CITAS | 41 | Reservas |
| CRM | CLIENTES | 25 | Perfiles |
| CRM | TESTIMONIOS | 51 | Carrusel público |
| CRM | CALIFICACIONES_ATENCION | 40 | Ratings |
| | **TOTAL P0** | **511 campos** | |

---

> **Documento generado por Hermes Agent (DeepSeek V4 Pro)**  
> **Fase actual**: FASE_PLAN_MAESTRO_AJUSTE_P0  
> **Próxima fase**: FASE_1_P0_NUCLEO_REAL (pendiente aprobación Diego)  
> **Schema completo**: `/tmp/airtable_schema_v2.json` (49 tablas, 1891 campos)

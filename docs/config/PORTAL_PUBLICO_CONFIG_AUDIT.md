# FASE 1K — Auditoría de Configuración del Portal Público

> 📅 2026-06-20 | 🧪 Dry-run | 🚫 No modifica Airtable ni backend | 📋 Autor: Diego López + Hermes Agent

---

## 1. Objetivo

Identificar qué elementos del portal público (`https://bellezapro-demo.surge.sh`) están
configurados desde el backend/Airtable y cuáles permanecen **hardcodeados** en los componentes
React del frontend.

---

## 2. Arquitectura actual

```
┌──────────────────────┐      GET /api/configuracion-publica      ┌──────────────────────┐
│   FRONTEND (Surge)   │ ◄─────────────────────────────────────── │  BACKEND (Railway)   │
│                      │                                          │                      │
│ resolveBrandConfig.js│ ── fallback ─► brandTheme.js (hardcodes) │ configuracion_publica│
│ AnnouncementBar.jsx  │                                          │     .py              │
│ Home.jsx             │                                          │                      │
│ PublicFooter.jsx     │                                          │  ┌─────────────────┐ │
│ Catalogo.jsx         │                                          │  │  AIRTABLE        │ │
│ Reserva.jsx          │                                          │  │  CONFIGURACION_  │ │
│ Login.jsx            │                                          │  │  PUBLICA         │ │
│ Productos.jsx        │                                          │  └─────────────────┘ │
│ index.html           │                                          │                      │
└──────────────────────┘                                          └──────────────────────┘

   ❌ GET /api/marca-blanca ──► 404 (route NO EXISTE — solo listado en health check)
```

---

## 3. Endpoint existente — `/api/configuracion-publica`

| Campo | Estado |
|-------|--------|
| Ruta real | `backend/routes/configuracion_publica.py` ✅ |
| Método | GET |
| Tabla Airtable | `CONFIGURACION_PUBLICA` |
| Campos expuestos | `NOMBRE_SISTEMA`, `NOMBRE_MARCA_PUBLICA`, `CATEGORIA_CONFIGURACION`, `TEXTO_CONFIGURACION`, `CLAVE_CONFIGURACION`, `VALOR_CONFIGURACION`, `VISIBLE_EN_FRONTEND_PUBLICO`, etc. |
| Consumido por | `Home.jsx` (nombre marca), `AnnouncementBar.jsx` (banners CATEGORIA=BANNER_ROTATIVO) |
| NO consumido por | `PublicFooter`, `PublicNavbar`, `Login`, `Catalogo`, `Reserva`, `index.html` |

---

## 4. Matriz BACKEND vs FRONTEND

Cada fila representa un elemento público del portal que podría ser configurable.

| # | Elemento | Ubicación Frontend | Origen actual | ¿Configurable hoy? | Gravedad |
|---|----------|-------------------|---------------|---------------------|----------|
| **IDENTIDAD** |
| 1 | Nombre de marca ("BellezaPro Demo") | `index.html` `<title>`, `PublicNavbar`, `PublicFooter`, `Login`, `Home` | Hardcode + `/api/configuracion-publica` (parcial) | Home lo carga; navbar/footer/index no | 🔴 ALTA |
| 2 | Logo / favicon | `index.html` `<link rel="icon">`, `Login` (iniciales "BD") | Hardcode. `brandTheme.js` → `brandLogo: null` | ❌ No | 🔴 ALTA |
| 3 | Descripción corta ("Sistema de gestión para salones…") | `PublicFooter` L11 | Hardcode | ❌ No | 🟡 MEDIA |
| **COLORES / TEMA** |
| 4 | Paleta de colores (#006686, #7DD3FC, #0B1C30, #F8F9FF) | `brandTheme.js`, inline `style={{}}` en TODOS los componentes | Hardcode | ❌ No (aunque `resolveBrandConfig.js` lo intenta desde `/api/marca-blanca` → 404) | 🔴 ALTA |
| 5 | Gradientes (`linear-gradient(135deg, #7dd3fc, #006686)`) | Home, Reserva, Catalogo, Login, AnnouncementBar | Repetido hardcoded 15+ veces | ❌ No | 🟡 MEDIA |
| 6 | Tipografía (Manrope) | `index.html` L9 | Hardcode en `<link>` Google Fonts | ❌ No | 🟢 BAJA |
| **HERO SECTION (HOME)** |
| 7 | Badge "Nuevo" | `Home.jsx` L64 | Hardcode | ❌ No | 🟢 BAJA |
| 8 | Headline ("Belleza, bienestar y reservas simples…") | `Home.jsx` L66-68 | Hardcode | ❌ No | 🔴 ALTA |
| 9 | Sub-headline ("{marca} te conecta con servicios…") | `Home.jsx` L70-72 | Semi-dinámico (marca sí, resto hardcode) | ⚠️ Parcial | 🟡 MEDIA |
| 10 | CTAs ("Reservar turno", "Ver servicios") | `Home.jsx` L78,82 | Hardcode | ❌ No | 🔴 ALTA |
| 11 | Hero card pasos ("Elegí servicio", "Seleccioná horario", "Confirmá y listo") | `Home.jsx` L94 | Hardcode | ❌ No | 🟢 BAJA |
| **SERVICIOS HOME** |
| 12 | Título sección ("Servicios destacados") | `Home.jsx` L113 | Hardcode | ❌ No | 🟡 MEDIA |
| 13 | Subtítulo ("Los tratamientos más elegidos…") | `Home.jsx` L115 | Hardcode | ❌ No | 🟡 MEDIA |
| 14 | Link "Ver catálogo completo" | `Home.jsx` L160 | Hardcode | ❌ No | 🟢 BAJA |
| **PRODUCTOS HOME** |
| 15 | Título sección ("Productos destacados") | `Home.jsx` L171 | Hardcode | ❌ No | 🟡 MEDIA |
| 16 | Subtítulo ("Productos profesionales para el cuidado diario") | `Home.jsx` L173 | Hardcode | ❌ No | 🟡 MEDIA |
| 17 | Link "Ver productos" | `Home.jsx` L221 | Hardcode | ❌ No | 🟢 BAJA |
| **CÓMO FUNCIONA** |
| 18 | Título ("¿Cómo funciona?") | `Home.jsx` L232 | Hardcode | ❌ No | 🟡 MEDIA |
| 19 | Subtítulo ("Reservar nunca fue tan simple") | `Home.jsx` L234 | Hardcode | ❌ No | 🟢 BAJA |
| 20 | Pasos (Explorá, Reservá, Disfrutá + descs) | `Home.jsx` L239-241 | Hardcode | ❌ No | 🟢 BAJA |
| **VISITANOS + CTA** |
| 21 | "Visitanos", "Consultá nuestras sucursales…", "Ver sucursales" | `Home.jsx` L261-268 | Hardcode | ❌ No | 🟡 MEDIA |
| 22 | "¿Lista para tu próximo turno?", "Reservá ahora…", "Reservar turno" | `Home.jsx` L272-278 | Hardcode | ❌ No | 🟡 MEDIA |
| **NAVBAR PÚBLICO** |
| 23 | Logo texto ("BellezaPro Demo") | `PublicNavbar.jsx` L19 | Hardcode | ❌ No | 🔴 ALTA |
| 24 | Botón "Acceder" | `PublicNavbar.jsx` L32-34 | Hardcode | ❌ No | 🟢 BAJA |
| 25 | Links navegación (Inicio, Servicios, Productos, Reservar) | `PublicNavbar.jsx` L5-9 | Hardcode (estructural) | ❌ — son estructurales, no configuración | 🟢 BAJA |
| **FOOTER PÚBLICO** |
| 26 | Nombre marca footer | `PublicFooter.jsx` L10, L35 | Hardcode | ❌ No | 🔴 ALTA |
| 27 | Descripción footer | `PublicFooter.jsx` L11 | Hardcode | ❌ No | 🟡 MEDIA |
| 28 | Teléfono ("+54 11 5555-0000") | `PublicFooter.jsx` L24 | Hardcode | ❌ No | 🔴 ALTA |
| 29 | Email ("contacto@bellezapro.com") | `PublicFooter.jsx` L25 | Hardcode | ❌ No | 🔴 ALTA |
| 30 | Dirección ("Av. Corrientes 1234, CABA") | `PublicFooter.jsx` L26 | Hardcode | ❌ No | 🔴 ALTA |
| 31 | Texto legal ("BellezaPro Demo es un sistema de demostración…") | `PublicFooter.jsx` L31 | Hardcode | ❌ No | 🔴 ALTA |
| 32 | Copyright ("Powered by Sistema Marca Blanca") | `PublicFooter.jsx` L35 | Hardcode | ❌ No | 🟡 MEDIA |
| **ANNOUNCEMENT BAR** |
| 33 | Banners rotativos (3 mensajes) | `AnnouncementBar.jsx` L5-9 | Hardcode (`DEMO_MESSAGES`) + intenta cargar de CONFIGURACION_PUBLICA | ⚠️ Parcial (carga funciona, fallback hardcode) | 🟡 MEDIA |
| 34 | Colores del banner (gradient #006686→#0b4d6a) | `AnnouncementBar.jsx` L58 | Hardcode | ❌ No | 🟡 MEDIA |
| **CATÁLOGO** |
| 35 | Título ("Catálogo de Servicios") | `Catalogo.jsx` L75 | Hardcode | ❌ No | 🟡 MEDIA |
| 36 | Subtítulo ("Servicios profesionales de belleza y bienestar") | `Catalogo.jsx` L76 | Hardcode | ❌ No | 🟡 MEDIA |
| 37 | Filtros de categoría (Cabello, Manos y Pies, etc.) | `Catalogo.jsx` L10, L81 | Hardcode | ❌ No (las categorías vienen de datos, pero el array inicial es hardcode) | 🟢 BAJA |
| 38 | Empty state ("Catálogo en preparación") | `Catalogo.jsx` L100-101 | Hardcode | ❌ No | 🟢 BAJA |
| **RESERVA** |
| 39 | Título ("Reservá tu Turno") | `Reserva.jsx` L109 | Hardcode | ❌ No | 🟡 MEDIA |
| 40 | Subtítulo ("Seleccioná servicio, sucursal y horario") | `Reserva.jsx` L109 | Hardcode | ❌ No | 🟡 MEDIA |
| 41 | Steps (Servicio, Sucursal, Horario, Datos) | `Reserva.jsx` L116 | Hardcode | ❌ No | 🟢 BAJA |
| 42 | Textos de steps ("1. ¿Qué servicio querés reservar?", etc.) | `Reserva.jsx` L137,184,226,273 | Hardcode | ❌ No | 🟡 MEDIA |
| 43 | Resumen lateral (labels: Servicio, Sucursal, Horario, Total estimado) | `Reserva.jsx` L322-343 | Hardcode | ❌ No | 🟢 BAJA |
| 44 | CTA confirmación ("Ingresá para confirmar tu turno") | `Reserva.jsx` L354 | Hardcode | ❌ No | 🟡 MEDIA |
| 45 | Empty states (5 variantes) | `Reserva.jsx` múltiples líneas | Hardcode | ❌ No | 🟢 BAJA |
| 46 | Form labels (Nombre, Teléfono, Notas) | `Reserva.jsx` L276-306 | Hardcode | ❌ No | 🟢 BAJA |
| **LOGIN** |
| 47 | Título y encabezados ("BellezaPro Demo", "Acceso demo interno") | `Login.jsx` L87-89 | Hardcode | ❌ No | 🟡 MEDIA |
| 48 | Tabs ("Ya soy cliente", "Soy cliente nuevo") | `Login.jsx` L68,77 | Hardcode | ❌ No | 🟢 BAJA |
| 49 | Roles (Administrador, Gerente, Gestión, Profesional, Solo lectura) | `Login.jsx` L8-13 | Hardcode | ❌ No (estructural) | 🟢 BAJA |
| 50 | Textos demo ("Modo demostración", "Seleccioná un perfil…") | `Login.jsx` L100-104 | Hardcode | ❌ No | 🟡 MEDIA |
| 51 | Textos registro ("Próximamente", "Este formulario es visual…") | `Login.jsx` L178-182 | Hardcode | ❌ No | 🟢 BAJA |
| 52 | Footer login ("Portal interno de demostración") | `Login.jsx` L272 | Hardcode | ❌ No | 🟢 BAJA |
| **INDEX.HTML** |
| 53 | `<title>` ("BellezaPro Demo") | `index.html` L11 | Hardcode | ❌ No | 🔴 ALTA |
| 54 | Meta description (no existe) | `index.html` | ❌ Ausente | — | 🟡 MEDIA |
| 55 | Google Fonts (Manrope, Inter, JetBrains Mono, Hanken Grotesk) | `index.html` L9 | Hardcode | ❌ No | 🟢 BAJA |
| **BACKOFFICE (Navbar, Footer)** |
| 56 | Navbar logo ("🏷️ Sistema") | `Navbar.jsx` L13-14 | Hardcode. Backoffice — no es portal público. | 🟢 BAJA (backoffice, no cliente) |
| 57 | Footer texto ("Sistema Marca Blanca Multirrubro (Fase 1A)") | `Footer.jsx` L5 | Hardcode. Backoffice. | 🟢 BAJA |

---

## 5. Resumen estadístico

| Categoría | Total elementos | Configurados desde backend | Hardcodeados | Parcial |
|-----------|----------------|---------------------------|--------------|---------|
| Identidad | 3 | 1 (nombre en Home) | 2 | 0 |
| Colores / Tema | 3 | 0 | 3 | 0 |
| Hero Section (Home) | 5 | 0 | 4 | 1 |
| Servicios Home | 3 | 0 | 3 | 0 |
| Productos Home | 3 | 0 | 3 | 0 |
| Cómo funciona | 3 | 0 | 3 | 0 |
| Visitanos + CTA | 2 | 0 | 2 | 0 |
| Navbar público | 3 | 0 | 3 | 0 |
| Footer público | 7 | 0 | 7 | 0 |
| Announcement Bar | 2 | 0 | 1 | 1 |
| Catálogo | 4 | 0 | 4 | 0 |
| Reserva | 8 | 0 | 8 | 0 |
| Login | 6 | 0 | 6 | 0 |
| index.html | 3 | 0 | 3 | 0 |
| Backoffice | 2 | 0 | 2 | 0 |
| **TOTAL** | **57** | **1** | **54** | **2** |

**Ratio de configuración real: 1.8%** — 1 solo elemento (nombre de marca en Home) proviene del backend.
**Ratio de hardcode: 94.7%** — 54 elementos son texto/color/imagen fijos en código.

---

## 6. Problema crítico detectado

**El endpoint `/api/marca-blanca` NO EXISTE.** Aparece en el health check (`/health`) como endpoint
P0, pero no hay archivo `routes/marca_blanca.py` ni router importado en `main.py`. 

El frontend lo intenta consumir en `resolveBrandConfig.js` → falla con 404 → usa `brandTheme.js` (hardcode).

**Consecuencia**: TODOS los colores, logo, tipografía, imágenes y CTAs del portal son fijos.
Cambiarlos requiere modificar código + rebuild + deploy.

---

## 7. Conclusión preliminar

El portal público tiene **prácticamente 0% de configuración dinámica real**. El único mecanismo
existente (`/api/configuracion-publica`) es insuficiente — se diseñó para texto genérico, no para
la estructura de un portal marca blanca (colores, imágenes, datos de contacto, textos de secciones).

Se requiere:
1. Crear endpoint `/api/marca-blanca` (o ampliar `/api/configuracion-publica`)
2. Publicar contrato de claves de configuración pública
3. Definir schema Airtable para alojar la configuración
4. Migrar TODOS los hardcodes a variables alimentadas desde backend

---

> 📄 Documento generado en FASE 1K — Dry-run. No se modifica Airtable ni backend.

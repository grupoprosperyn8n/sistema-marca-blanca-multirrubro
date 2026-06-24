# FASE 1K — Contrato de Configuración Pública (Portal Marca Blanca)

> 📅 2026-06-20 | 🧪 Dry-run | 🚫 No implementar | 📋 Versión 1.0

---

## 1. Propósito

Este documento define el **contrato de claves** que el frontend espera recibir del backend
para renderizar el portal público sin hardcodes. Cada clave es un identificador semántico
que el frontend consulta **una sola vez** al cargar la app.

---

## 2. Formato de respuesta

El backend debe exponer un **único endpoint** que devuelva el objeto completo:

```
GET /api/marca-blanca
```

### Respuesta esperada (JSON):

```json
{
  "identidad": { ... },
  "tema": { ... },
  "textos": { ... },
  "contacto": { ... },
  "banners": [ ... ],
  "seo": { ... },
  "legal": { ... },
  "imagenes": { ... }
}
```

**Reglas**:
- Todas las claves son requeridas. Si no hay valor, devolver `null` o string vacío `""`.
- El frontend usará lo que reciba. Si una clave es `null`, usará el fallback de `brandTheme.js`.
- Los cambios en este contrato deben ser versionados (v1, v2, etc.) para no romper frontends deployados.

---

## 3. Contrato de claves

### 3.1 Identidad

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `identidad.nombre` | `string` | Nombre comercial público de la marca | `"BellezaPro Demo"` |
| `identidad.nombre_corto` | `string` | Versión abreviada (2-3 palabras) | `"BellezaPro"` |
| `identidad.tagline` | `string` | Claim/frase de identidad (máx 60 chars) | `"Belleza, bienestar y reservas simples en un solo lugar."` |
| `identidad.descripcion` | `string` | Descripción institucional (máx 200 chars) | `"Sistema de gestión para salones de belleza y centros de estética."` |
| `identidad.logo_url` | `string\|null` | URL del logo (SVG o PNG recomendado) | `"https://cdn.ejemplo.com/logo.svg"` |
| `identidad.favicon_url` | `string\|null` | URL del favicon | `"https://cdn.ejemplo.com/favicon.ico"` |
| `identidad.iniciales` | `string` | Iniciales para ícono fallback (2 letras) | `"BD"` |

---

### 3.2 Tema (colores)

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `tema.color_primario` | `string` | Color principal (hex, sin #) | `"006686"` |
| `tema.color_secundario` | `string` | Color secundario (hex, sin #) | `"7DD3FC"` |
| `tema.color_acento` | `string` | Color de acento (hex, sin #) | `"38BDF8"` |
| `tema.color_texto` | `string` | Color de texto principal (hex, sin #) | `"0B1C30"` |
| `tema.color_texto_secundario` | `string` | Color de texto secundario (hex, sin #) | `"3F484E"` |
| `tema.color_superficie` | `string` | Color de fondo/superficie (hex, sin #) | `"F8F9FF"` |
| `tema.gradiente_primario` | `string` | Gradiente CSS para botones/destacados | `"linear-gradient(135deg, #7DD3FC, #006686)"` |
| `tema.gradiente_banner` | `string` | Gradiente para announcement bar | `"linear-gradient(135deg, #006686, #0B4D6A)"` |
| `tema.tipografia_titulos` | `string` | Font family para headings | `"Manrope"` |
| `tema.tipografia_cuerpo` | `string` | Font family para body | `"Manrope"` |

---

### 3.3 Textos públicos

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `textos.hero_headline` | `string` | Título principal del hero (máx 120 chars) | `"Belleza, bienestar y reservas simples en un solo lugar."` |
| `textos.hero_subheadline` | `string` | Subtítulo del hero | `"{marca} te conecta con servicios profesionales de salón. Reservá tu turno en segundos, sin llamadas ni mensajes."` |
| `textos.hero_badge` | `string\|null` | Badge sobre el hero (ej: "Nuevo", "Promo") | `"Nuevo"` |
| `textos.cta_principal` | `string` | Label del CTA principal | `"Reservar turno"` |
| `textos.cta_secundario` | `string` | Label del CTA secundario | `"Ver servicios"` |
| `textos.servicios_titulo` | `string` | Título sección servicios destacados | `"Servicios destacados"` |
| `textos.servicios_subtitulo` | `string` | Subtítulo sección servicios | `"Los tratamientos más elegidos por nuestras clientas"` |
| `textos.productos_titulo` | `string` | Título sección productos destacados | `"Productos destacados"` |
| `textos.productos_subtitulo` | `string` | Subtítulo sección productos | `"Productos profesionales para el cuidado diario"` |
| `textos.como_funciona_titulo` | `string` | Título sección "Cómo funciona" | `"¿Cómo funciona?"` |
| `textos.como_funciona_subtitulo` | `string` | Subtítulo sección | `"Reservar nunca fue tan simple"` |
| `textos.visitanos_titulo` | `string` | Título sección visita | `"Visitanos"` |
| `textos.visitanos_subtitulo` | `string` | Subtítulo sección visita | `"Consultá nuestras sucursales disponibles y vení a conocernos."` |
| `textos.visitanos_link` | `string` | Label link sucursales | `"Ver sucursales"` |
| `textos.cta_final_titulo` | `string` | Título CTA final en home | `"¿Lista para tu próximo turno?"` |
| `textos.cta_final_subtitulo` | `string` | Subtítulo CTA final | `"Reservá ahora y asegurate tu espacio."` |
| `textos.catalogo_titulo` | `string` | Título página catálogo | `"Catálogo de Servicios"` |
| `textos.catalogo_subtitulo` | `string` | Subtítulo página catálogo | `"Servicios profesionales de belleza y bienestar"` |
| `textos.reserva_titulo` | `string` | Título página reserva | `"Reservá tu Turno"` |
| `textos.reserva_subtitulo` | `string` | Subtítulo página reserva | `"Seleccioná servicio, sucursal y horario"` |
| `textos.login_titulo` | `string` | Título página login | `"BellezaPro Demo"` |
| `textos.login_subtitulo_login` | `string` | Subtítulo tab login | `"Acceso demo interno"` |
| `textos.login_subtitulo_registro` | `string` | Subtítulo tab registro | `"Creá tu cuenta de cliente"` |
| `textos.login_demo_banner` | `string` | Texto banner modo demo | `"Seleccioná un perfil para explorar la plataforma. No se usan contraseñas reales."` |
| `textos.ver_catalogo` | `string` | Link "Ver catálogo completo" | `"Ver catálogo completo"` |
| `textos.ver_productos` | `string` | Link "Ver productos" | `"Ver productos"` |

---

### 3.4 Contacto

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `contacto.telefono` | `string\|null` | Teléfono público de la marca | `"+54 11 5555-0000"` |
| `contacto.email` | `string\|null` | Email público | `"contacto@bellezapro.com"` |
| `contacto.whatsapp` | `string\|null` | Número WhatsApp (con código país) | `"5491155550000"` |
| `contacto.direccion` | `string\|null` | Dirección física principal | `"Av. Corrientes 1234, CABA"` |
| `contacto.instagram` | `string\|null` | URL o @ de Instagram | `"@bellezapro"` |
| `contacto.facebook` | `string\|null` | URL de Facebook | `"https://facebook.com/bellezapro"` |

---

### 3.5 Banners rotativos (Announcement Bar)

Array de objetos. Si está vacío, no se muestra la barra.

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `banners[].texto` | `string` | Texto del banner (máx 120 chars) |
| `banners[].cta_label` | `string\|null` | Label del botón CTA (ej: "Ver servicios") |
| `banners[].cta_link` | `string\|null` | Ruta del CTA (ej: "/catalogo") |
| `banners[].orden` | `number` | Orden visual (1 = primero) |

---

### 3.6 SEO

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `seo.titulo` | `string` | `<title>` de la página | `"BellezaPro Demo"` |
| `seo.descripcion` | `string` | Meta description (máx 160 chars) | `"Reservá turnos de belleza online. Servicios profesionales de salón en segundos."` |
| `seo.keywords` | `string\|null` | Meta keywords (opcional) | `"belleza, salón, reservas, turnos"` |

---

### 3.7 Legal

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `legal.texto_footer` | `string` | Disclaimer legal en footer | `"BellezaPro Demo es un sistema de demostración. No se realizan reservas reales."` |
| `legal.copyright` | `string` | Línea de copyright | `"Powered by Sistema Marca Blanca"` |
| `legal.terminos_url` | `string\|null` | URL a términos y condiciones | `"/terminos"` |
| `legal.privacidad_url` | `string\|null` | URL a política de privacidad | `"/privacidad"` |

---

### 3.8 Imágenes

| Clave | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `imagenes.hero_fondo_url` | `string\|null` | Imagen de fondo del hero | `"https://cdn.ejemplo.com/hero-bg.jpg"` |
| `imagenes.hero_ilustracion_url` | `string\|null` | Ilustración decorativa del hero | `null` |
| `imagenes.default_producto_url` | `string\|null` | Imagen default para productos sin foto | `null` |
| `imagenes.default_servicio_url` | `string\|null` | Imagen default para servicios sin foto | `null` |

---

## 4. Comportamiento del frontend

1. **Al montar la app** (`main.jsx` o `App.jsx`), hacer `GET /api/marca-blanca`.
2. Si el endpoint responde 200, usar **todas** las claves del JSON.
3. Si responde 404 o falla, usar `brandTheme.js` como fallback (comportamiento actual).
4. El objeto se guarda en un **contexto React** (`BrandConfigContext`) disponible para todos los componentes.
5. Los componentes leen del contexto en vez de tener strings hardcodeados o `style={{}}` con colores fijos.

---

## 5. Relación con CONFIGURACION_PUBLICA existente

La tabla `CONFIGURACION_PUBLICA` en Airtable **puede seguir existiendo** para:
- Configuraciones administrativas internas
- Flags de feature (`RESERVA_ONLINE_HABILITADA`, etc.)
- Banners rotativos (el `AnnouncementBar` ya usa esta fuente)

Pero el contrato de marca blanca requiere **su propio endpoint** (`/api/marca-blanca`) con:
- **Estructura fija** (no key-value genérico como CONFIGURACION_PUBLICA)
- **Tipos de datos explícitos** (colores hex sin #, URLs, arrays de banners)
- **Caché agresivo** (cambia raramente, CDN-friendly)

---

## 6. Campos que NO van en este contrato

Estos datos son **dinámicos** y se obtienen de otros endpoints existentes:
- Lista de servicios → `GET /api/servicios-web` ✅
- Lista de productos → `GET /api/productos-web` ✅
- Sucursales → `GET /api/sucursales` ✅
- Slots de agenda → `GET /api/agenda-slots` ✅
- Citas → `GET /api/citas` ✅

---

## 7. Versionado

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1.0 | 2026-06-20 | Contrato inicial — 57 claves en 8 categorías |

---

> 📄 Documento generado en FASE 1K — Dry-run. Define el contrato pero no lo implementa.

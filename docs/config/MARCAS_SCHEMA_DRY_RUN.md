# FASE_1K_B — Schema Dry-Run de Tabla MARCAS

> 📅 2026-06-20 | 🧪 Dry-run | 🚫 No se crea la tabla todavía | 📋 Versión 1.0
> 🔗 Complementa: `PORTAL_PUBLICO_CONFIG_CONTRACT.md`, `PORTAL_PUBLICO_CONFIG_AUDIT.md`

---

## 1. Descubrimiento: `/api/marca-blanca` SÍ existe

**Corrección a FASE_1K**: La auditoría anterior reportó que el endpoint no existía. Esto fue un **falso
negativo** — el endpoint vive dentro de `backend/routes/modulos.py` (línea 35), no en un archivo
separado. El endpoint responde 200 correctamente.

### Lo que devuelve actualmente:

```json
{
  "nombre_sistema": null,
  "nombre_negocio": null,
  "colores": null,
  "logo": null,
  "textos_publicos": null,
  "secciones_visibles": null,
  "modulos_activos": [...],    // ← 23 módulos, este sí tiene datos
  "faltantes": [
    "CONFIGURACION_PUBLICA.NOMBRE_SISTEMA",
    "CONFIGURACION_PUBLICA.NOMBRE_NEGOCIO",
    "CONFIGURACION_PUBLICA.COLORES",
    "CONFIGURACION_PUBLICA.LOGO",
    "CONFIGURACION_PUBLICA.TEXTOS_PUBLICOS",
    "CONFIGURACION_PUBLICA.SECCIONES_VISIBLES"
  ]
}
```

### Diagnóstico

El endpoint busca en el **primer registro** de `CONFIGURACION_PUBLICA` campos de alto nivel:
`NOMBRE_SISTEMA`, `NOMBRE_NEGOCIO`, `COLORES`, `LOGO`, `TEXTOS_PUBLICOS`, `SECCIONES_VISIBLES`.

Ninguno existe en esa tabla → todo `null` → el frontend recibe nulls → `resolveBrandConfig.js`
usa el fallback `brandTheme.js` (hardcode).

**Conclusión**: El endpoint ya está construido. Solo necesita una fuente de datos con la estructura
correcta. La tabla `MARCAS` es esa fuente.

---

## 2. Propósito de la tabla MARCAS

Almacenar la configuración completa de identidad visual y textual de **una marca** para el portal
público. Un registro = una instancia del sistema marca blanca (ej: "BellezaPro Demo").

---

## 3. Estructura de campos (organizados por bloques)

### 3.1 Bloque IDENTIDAD (7 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 1 | `MARCA_ID` | Single line text | ✅ | `"bellezapro-demo"` | Slug único, se usa como clave en URL y caché |
| 2 | `NOMBRE_MARCA` | Single line text | ✅ | `"BellezaPro Demo"` | Nombre comercial público largo |
| 3 | `NOMBRE_CORTO_MARCA` | Single line text | ✅ | `"BellezaPro"` | Abreviado para espacios reducidos (navbar, tabs) |
| 4 | `TAGLINE_MARCA` | Single line text | | `"Belleza, bienestar y reservas simples en un solo lugar."` | Claim principal (máx 80 chars) |
| 5 | `RUBRO` | Single select | | `"Salón de Belleza"` | Opciones: Salón de Belleza, Barbería, Spa, Centro Estética, Clínica Dental, Veterinaria, Gimnasio, Consultorio |
| 6 | `ESTADO_MARCA` | Single select | ✅ | `"demo"` | Opciones: `activo`, `demo`, `inactivo`, `mantenimiento` |
| 7 | `SLUG_PUBLICO` | Single line text | ✅ | `"bellezapro"` | Usado en URL del portal público (sin espacios ni tildes) |

### 3.2 Bloque TEMA VISUAL (9 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 8 | `THEME_PRESET` | Single select | | `"glaciar"` | Presets: `glaciar`, `lilac`, `bosque`, `calido`, `personalizado` |
| 9 | `COLOR_PRIMARIO` | Single line text | ✅ | `"006686"` | Hex SIN # — el frontend agrega # |
| 10 | `COLOR_SECUNDARIO` | Single line text | ✅ | `"7DD3FC"` | Hex SIN # |
| 11 | `COLOR_ACENTO` | Single line text | | `"38BDF8"` | Hex SIN # |
| 12 | `COLOR_FONDO` | Single line text | | `"F8F9FF"` | Color de superficie/fondo |
| 13 | `COLOR_TEXTO` | Single line text | ✅ | `"0B1C30"` | Color principal de texto |
| 14 | `COLOR_TEXTO_SECUNDARIO` | Single line text | | `"3F484E"` | Texto secundario (grises, subtítulos) |
| 15 | `TIPOGRAFIA_TITULOS` | Single line text | | `"Manrope"` | Font family para headings |
| 16 | `TIPOGRAFIA_CUERPO` | Single line text | | `"Manrope"` | Font family para body text |

### 3.3 Bloque HERO / LANDING (8 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 17 | `HERO_BADGE` | Single line text | | `"Nuevo"` | Badge flotante sobre hero. Null = no mostrar |
| 18 | `HERO_TITULO` | Long text | ✅ | `"Belleza, bienestar y reservas simples en un solo lugar."` | H1 del hero |
| 19 | `HERO_SUBTITULO` | Long text | | `"{marca} te conecta con servicios profesionales de salón. Reservá tu turno en segundos, sin llamadas ni mensajes."` | `{marca}` se reemplaza por NOMBRE_MARCA |
| 20 | `HERO_CTA_PRIMARIO_TEXTO` | Single line text | ✅ | `"Reservar turno"` | Label del CTA principal |
| 21 | `HERO_CTA_PRIMARIO_URL` | Single line text | | `"/reserva"` | Ruta interna del CTA |
| 22 | `HERO_CTA_SECUNDARIO_TEXTO` | Single line text | | `"Ver servicios"` | Label del CTA secundario |
| 23 | `HERO_CTA_SECUNDARIO_URL` | Single line text | | `"/catalogo"` | Ruta del CTA secundario |
| 24 | `HERO_IMAGEN_URL` | URL | | `null` | Imagen de fondo/ilustración del hero |

### 3.4 Bloque BANNERS / AVISOS (5 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 25 | `BANNER_ACTIVO` | Checkbox | ✅ | ☑ | ¿Mostrar announcement bar? |
| 26 | `BANNER_TITULO` | Single line text | | `"🆕 ¡Nuevo sistema de turnos online!"` | Título del banner principal |
| 27 | `BANNER_MENSAJE` | Long text | | `"Reservá desde cualquier dispositivo. Sin llamadas, sin esperas."` | Texto del banner |
| 28 | `BANNER_CTA_TEXTO` | Single line text | | `"Ver servicios"` | Label del botón del banner |
| 29 | `BANNER_CTA_URL` | Single line text | | `"/catalogo"` | Ruta del botón |

### 3.5 Bloque SECCIONES LANDING (7 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 30 | `MOSTRAR_SERVICIOS` | Checkbox | | ☑ | ¿Mostrar sección "Servicios destacados" en home? |
| 31 | `MOSTRAR_PRODUCTOS` | Checkbox | | ☑ | ¿Mostrar sección "Productos destacados" en home? |
| 32 | `MOSTRAR_SUCURSALES` | Checkbox | | ☑ | ¿Mostrar sección "Visitanos" en home? |
| 33 | `MOSTRAR_OFERTAS` | Checkbox | | ☐ | ¿Mostrar sección de ofertas? (sin implementar aún) |
| 34 | `MOSTRAR_TESTIMONIOS` | Checkbox | | ☐ | ¿Mostrar sección de testimonios? (sin implementar aún) |
| 35 | `MOSTRAR_COMO_FUNCIONA` | Checkbox | | ☑ | ¿Mostrar sección "Cómo funciona"? |
| 36 | `ORDEN_SECCIONES` | Long text | | `"hero,servicios,como_funciona,productos,visitanos,cta_final"` | Orden de secciones en home (CSV) |

### 3.6 Bloque RESERVA (6 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 37 | `RESERVA_TITULO` | Single line text | | `"Reservá tu Turno"` | Título de la página de reserva |
| 38 | `RESERVA_SUBTITULO` | Single line text | | `"Seleccioná servicio, sucursal y horario"` | Subtítulo |
| 39 | `RESERVA_REQUIERE_LOGIN` | Checkbox | | ☑ | ¿Obliga a crear cuenta para confirmar? |
| 40 | `RESERVA_MENSAJE_SIN_HORARIOS` | Long text | | `"Próximamente publicaremos nuevos horarios. Mientras tanto, consultá disponibilidad por WhatsApp o acercate a la sucursal."` | Texto cuando no hay slots |
| 41 | `RESERVA_MENSAJE_DEMO` | Long text | | `"Para confirmar tu turno necesitás ingresar o registrarte"` | Texto pie de demo |
| 42 | `RESERVA_CTA_TEXTO` | Single line text | | `"Ingresá para confirmar tu turno"` | Label del botón de confirmación |

### 3.7 Bloque CONTACTO / REDES (8 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 43 | `TELEFONO_PUBLICO` | Phone | | `"+54 11 5555-0000"` | Teléfono visible en footer |
| 44 | `WHATSAPP_PUBLICO` | Phone | | `null` | Número WhatsApp (código país incluido) |
| 45 | `EMAIL_PUBLICO` | Email | | `"contacto@bellezapro.com"` | Email público |
| 46 | `DIRECCION_PUBLICA` | Single line text | | `"Av. Corrientes 1234, CABA"` | Dirección física principal |
| 47 | `INSTAGRAM_URL` | URL | | `"https://instagram.com/bellezapro"` | URL completa de Instagram |
| 48 | `FACEBOOK_URL` | URL | | `"https://facebook.com/bellezapro"` | URL completa de Facebook |
| 49 | `TIKTOK_URL` | URL | | `null` | URL de TikTok |
| 50 | `GOOGLE_MAPS_URL` | URL | | `null` | URL de Google Maps (sede principal) |

### 3.8 Bloque SEO / LEGAL (5 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 51 | `SEO_TITLE` | Single line text | ✅ | `"BellezaPro Demo"` | `<title>` HTML |
| 52 | `SEO_DESCRIPTION` | Long text | | `"Reservá turnos de belleza online. Servicios profesionales de salón en segundos."` | Meta description (máx 160 chars) |
| 53 | `LEGAL_AVISO_PUBLICO` | Long text | | `"BellezaPro Demo es un sistema de demostración. No se realizan reservas reales."` | Disclaimer legal en footer |
| 54 | `PRIVACY_URL` | Single line text | | `"/privacidad"` | Ruta a política de privacidad |
| 55 | `TERMS_URL` | Single line text | | `"/terminos"` | Ruta a términos y condiciones |

### 3.9 Bloque CONTROL TÉCNICO (6 campos)

| # | Nombre Airtable | Tipo Airtable | Req | Seed BellezaPro Demo | Notas |
|---|----------------|---------------|-----|---------------------|-------|
| 56 | `REGISTRO_ACTIVO` | Checkbox | ✅ | ☑ | ¿Registro de cliente habilitado? |
| 57 | `PRIORIDAD` | Number (integer) | | `1` | Prioridad si hay múltiples marcas. Menor = más prioritario |
| 58 | `AMBIENTE` | Single select | ✅ | `"demo"` | `produccion`, `staging`, `demo` |
| 59 | `VERSION_CONFIG` | Single line text | | `"1.0.0"` | Versión del schema de configuración (para migraciones) |
| 60 | `UPDATED_AT` | Last modified time | — | (automático) | Airtable auto-genera este campo |

**TOTAL: 60 campos en 9 bloques.**

---

## 4. Validaciones Airtable

| Campo | Regla |
|-------|-------|
| `MARCA_ID` | Único. Solo letras minúsculas, números y guiones. |
| `SLUG_PUBLICO` | Único. Sin espacios, sin tildes. |
| `COLOR_*` | 6 caracteres hexadecimales. Sin #. Frontend agrega #. |
| `ESTADO_MARCA` | Solo valores del select (activo/demo/inactivo/mantenimiento) |
| `AMBIENTE` | Solo valores del select (produccion/staging/demo) |
| `PRIORIDAD` | Entero ≥ 0 |
| URLs | Validación nativa de Airtable (tipo URL) |
| Emails | Validación nativa de Airtable (tipo Email) |
| Teléfonos | Validación nativa de Airtable (tipo Phone) |

---

## 5. Relación con endpoint existente

El endpoint `GET /api/marca-blanca` (en `modulos.py`) deberá **modificarse** para leer de `MARCAS`
en lugar de buscar en `CONFIGURACION_PUBLICA`. El mapeo sería:

| Campo MARCAS | → | Campo endpoint |
|--------------|---|---------------|
| `NOMBRE_MARCA` | → | `nombre_sistema` |
| `NOMBRE_CORTO_MARCA` | → | `nombre_negocio` |
| `COLOR_PRIMARIO..TEXTO` (empaquetado) | → | `colores` (objeto JSON) |
| `LOGO_URL` | → | `logo` |
| `HERO_*, CTA_*, RESERVA_*` (empaquetado) | → | `textos_publicos` (objeto JSON) |
| `MOSTRAR_*` flags | → | `secciones_visibles` (objeto JSON) |

---

## 6. Campo LOGO_URL y FAVICON_URL

Actualmente no hay campo específico para favicon. Se agrega como subcampo del logo:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `LOGO_URL` | URL | Logo principal (SVG o PNG, recomendado 200×60px) |
| `FAVICON_URL` | URL | Favicon (ICO o PNG 32×32px). Si es null, se usa la inicial. |

---

## 7. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:----------:|:-------:|-----------|
| Que Airtable no soporte 60 campos en una tabla nueva | Baja (límite: 500) | Medio | Validar antes de crear |
| Que el endpoint `/api/marca-blanca` necesite refactor grande | Baja | Medio | Solo cambia la fuente (MARCAS en vez de CONFIGURACION_PUBLICA) |
| Que falten campos al implementar frontend | Media | Bajo | Agregar campos a MARCAS es trivial (Airtable lo permite) |
| Que el seed no sea suficiente para la demo | Baja | Bajo | El seed cubre todos los hardcodes detectados en FASE_1K |
| Colisión con CONFIGURACION_PUBLICA existente | Baja | Bajo | Son tablas independientes con propósitos distintos |

---

## 8. Notas para frontend

- `resolveBrandConfig.js` ya está preparado para recibir `colores` como objeto JSON y `textos_publicos`
  como objeto JSON desde `/api/marca-blanca`.
- Los campos `HERO_CTA_PRIMARIO_URL`, `HERO_CTA_SECUNDARIO_URL`, etc. son **rutas internas**
  (ej: `/reserva`), no URLs completas.
- `{marca}` en `HERO_SUBTITULO` es un placeholder que el frontend reemplaza por `NOMBRE_MARCA`.
- `ORDEN_SECCIONES` es un CSV que define el orden de renderizado en home.
- Los flags `MOSTRAR_*` controlan visibilidad de secciones completas (no solo texto).

---

## 9. Notas para backend

- El endpoint `/api/marca-blanca` debe:
  1. Leer el registro de `MARCAS` donde `ESTADO_MARCA != "inactivo"` y `AMBIENTE` coincida con el entorno.
  2. Si hay múltiples registros activos, usar `PRIORIDAD` (menor número = mayor prioridad).
  3. Empaquetar `COLOR_*` en un objeto `colores`.
  4. Empaquetar `HERO_*`, `CTA_*`, `RESERVA_*`, `BANNER_*` en `textos_publicos`.
  5. Empaquetar `MOSTRAR_*` + `ORDEN_SECCIONES` en `secciones_visibles`.
  6. Mantener la consulta a `MODULOS` para `modulos_activos` (ya funciona).

---

> 📄 Documento generado en FASE_1K_B — Dry-run. No se crea tabla todavía.

# FASE 1K — Propuesta de Schema Airtable (Dry-run)

> 📅 2026-06-20 | 🧪 Dry-run | 🚫 No crear tablas todavía | 📋 Versión 1.0

---

## 1. Objetivo

Proponer la estructura de tablas Airtable necesarias para almacenar la configuración del
portal público definida en `PORTAL_PUBLICO_CONFIG_CONTRACT.md`, sin modificar el schema
existente en esta fase.

---

## 2. Estado actual

| Elemento | Existe | Tabla |
|----------|--------|-------|
| Configuración general (key-value) | ✅ Sí | `CONFIGURACION_PUBLICA` |
| Endpoint `/api/marca-blanca` | ❌ No | — |
| Configuración de marca (colores, textos, contacto) | ❌ No | — |
| Banners rotativos | ⚠️ Parcial | `CONFIGURACION_PUBLICA` (vía CATEGORIA_CONFIGURACION) |

---

## 3. Propuesta: Nueva tabla `MARCAS`

Una tabla **única** que almacena la configuración completa de una marca. Para la demo actual
(Salón de Belleza), habrá **un solo registro**. En futuro multi-rubro, un registro por cliente.

### 3.1 Estructura de la tabla

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `NOMBRE_MARCA` | Single line text | ✅ | Nombre comercial público | `"BellezaPro Demo"` |
| `NOMBRE_CORTO_MARCA` | Single line text | ✅ | Versión abreviada | `"BellezaPro"` |
| `TAGLINE_MARCA` | Single line text | | Claim/frase | `"Belleza, bienestar y reservas..."` |
| `DESCRIPCION_MARCA` | Long text | | Descripción institucional | |
| `LOGO_URL` | URL | | URL del logo | |
| `FAVICON_URL` | URL | | URL del favicon | |
| `INICIALES_MARCA` | Single line text | ✅ | 2 letras para ícono fallback | `"BD"` |
| **COLORES** |
| `COLOR_PRIMARIO` | Single line text | ✅ | Hex sin # | `"006686"` |
| `COLOR_SECUNDARIO` | Single line text | ✅ | Hex sin # | `"7DD3FC"` |
| `COLOR_ACENTO` | Single line text | | Hex sin # | `"38BDF8"` |
| `COLOR_TEXTO` | Single line text | ✅ | Hex sin # | `"0B1C30"` |
| `COLOR_TEXTO_SECUNDARIO` | Single line text | | Hex sin # | `"3F484E"` |
| `COLOR_SUPERFICIE` | Single line text | | Hex sin # | `"F8F9FF"` |
| `GRADIENTE_PRIMARIO` | Single line text | | CSS gradient string | `"linear-gradient(135deg, #7DD3FC, #006686)"` |
| `GRADIENTE_BANNER` | Single line text | | CSS gradient string | |
| `TIPOGRAFIA_TITULOS` | Single line text | | Font family | `"Manrope"` |
| `TIPOGRAFIA_CUERPO` | Single line text | | Font family | `"Manrope"` |
| **TEXTOS** |
| `HERO_HEADLINE` | Long text | | Título principal hero | |
| `HERO_SUBHEADLINE` | Long text | | Subtítulo hero | |
| `HERO_BADGE` | Single line text | | Badge (null = no mostrar) | `"Nuevo"` |
| `CTA_PRINCIPAL` | Single line text | ✅ | Label CTA principal | `"Reservar turno"` |
| `CTA_SECUNDARIO` | Single line text | | Label CTA secundario | `"Ver servicios"` |
| `SECCION_SERVICIOS_TITULO` | Single line text | | | `"Servicios destacados"` |
| `SECCION_SERVICIOS_SUBTITULO` | Long text | | | |
| `SECCION_PRODUCTOS_TITULO` | Single line text | | | `"Productos destacados"` |
| `SECCION_PRODUCTOS_SUBTITULO` | Long text | | | |
| `SECCION_COMO_FUNCIONA_TITULO` | Single line text | | | `"¿Cómo funciona?"` |
| `SECCION_COMO_FUNCIONA_SUBTITULO` | Long text | | | |
| `SECCION_VISITANOS_TITULO` | Single line text | | | `"Visitanos"` |
| `SECCION_VISITANOS_SUBTITULO` | Long text | | | |
| `SECCION_VISITANOS_LINK` | Single line text | | | `"Ver sucursales"` |
| `CTA_FINAL_TITULO` | Single line text | | | `"¿Lista para tu próximo turno?"` |
| `CTA_FINAL_SUBTITULO` | Long text | | | |
| `CATALOGO_TITULO` | Single line text | | | `"Catálogo de Servicios"` |
| `CATALOGO_SUBTITULO` | Long text | | | |
| `RESERVA_TITULO` | Single line text | | | `"Reservá tu Turno"` |
| `RESERVA_SUBTITULO` | Long text | | | |
| `LOGIN_TITULO` | Single line text | | | `"BellezaPro Demo"` |
| `LOGIN_SUBTITULO_LOGIN` | Single line text | | | `"Acceso demo interno"` |
| `LOGIN_SUBTITULO_REGISTRO` | Single line text | | | `"Creá tu cuenta de cliente"` |
| `LOGIN_DEMO_BANNER` | Long text | | | |
| `VER_CATALOGO_LINK` | Single line text | | | `"Ver catálogo completo"` |
| `VER_PRODUCTOS_LINK` | Single line text | | | `"Ver productos"` |
| **CONTACTO** |
| `TELEFONO` | Phone | | | `"+54 11 5555-0000"` |
| `EMAIL` | Email | | | `"contacto@bellezapro.com"` |
| `WHATSAPP` | Phone | | | `"5491155550000"` |
| `DIRECCION` | Single line text | | | `"Av. Corrientes 1234, CABA"` |
| `INSTAGRAM` | Single line text | | | `"@bellezapro"` |
| `FACEBOOK` | URL | | | |
| **SEO** |
| `SEO_TITULO` | Single line text | | `<title>` HTML | `"BellezaPro Demo"` |
| `SEO_DESCRIPCION` | Long text | | Meta description | |
| `SEO_KEYWORDS` | Single line text | | Meta keywords | |
| **LEGAL** |
| `LEGAL_TEXTO_FOOTER` | Long text | | Disclaimer legal en footer | |
| `LEGAL_COPYRIGHT` | Single line text | | Línea copyright | `"Powered by Sistema Marca Blanca"` |
| `LEGAL_TERMINOS_URL` | URL | | URL términos | |
| `LEGAL_PRIVACIDAD_URL` | URL | | URL privacidad | |
| **IMÁGENES** |
| `IMAGEN_HERO_FONDO` | URL | | Imagen fondo hero | |
| `IMAGEN_HERO_ILUSTRACION` | URL | | Ilustración decorativa | |
| `IMAGEN_DEFAULT_PRODUCTO` | URL | | Fallback producto sin foto | |
| `IMAGEN_DEFAULT_SERVICIO` | URL | | Fallback servicio sin foto | |
| **META** |
| `ACTIVO` | Checkbox | ✅ | Marca activa (visible) | ☑ |
| `ES_DEMO` | Checkbox | | Es demo (mostrar textos demo) | ☑ |
| `RUBRO` | Single select | | Rubro del negocio | `"Salón de Belleza"` |

**Total: 57 campos** (mismos que el contrato)

---

### 3.2 Ventajas de una tabla única

1. **Una sola consulta** → el endpoint devuelve un registro, no un array.
2. **Sin joins** → Airtable no tiene joins reales, rendimiento óptimo.
3. **Control de acceso simple** → un solo registro por cliente.
4. **Caché trivial** → ETag sobre `LAST_MODIFIED` del registro.
5. **Validación en Airtable** → tipos nativos (URL, Email, Phone, Checkbox).

---

### 3.3 Desventajas

1. **Tabla ancha** (57 campos) — pero Airtable lo soporta sin problema hasta 500 campos.
2. **Sin historial de cambios por campo** — si se necesita auditoría, habría que crear tabla `MARCAS_LOG`.
3. **No soporta multi-idioma nativo** — si en futuro se necesita ES/EN/PT, se requeriría tabla separada `MARCAS_IDIOMAS`.

---

## 4. Propuesta alternativa: Ampliar `CONFIGURACION_PUBLICA`

En lugar de crear `MARCAS`, agregar registros a la tabla existente con categorías nuevas.

| Categoría nueva | Ejemplo de registros |
|----------------|---------------------|
| `COLOR_PRIMARIO` | CLAVE=`HEX`, VALOR=`006686` |
| `COLOR_SECUNDARIO` | CLAVE=`HEX`, VALOR=`7DD3FC` |
| `TEXTO_HERO_HEADLINE` | VALOR=`"Belleza, bienestar..."` |
| `TEXTO_CTA_PRINCIPAL` | VALOR=`"Reservar turno"` |
| `CONTACTO_TELEFONO` | CLAVE=`NUMERO`, VALOR=`+54 11..."` |
| ... | (uno por cada campo del contrato) |

### Comparación

| Criterio | Tabla `MARCAS` (nueva) | Ampliar `CONFIGURACION_PUBLICA` |
|----------|------------------------|-------------------------------|
| Cantidad de registros | 1 por marca | ~57 por marca |
| Complejidad backend | Nuevo endpoint + nuevo router | Mismo endpoint, nuevo parser |
| Validación de tipos | Tipos nativos Airtable (URL, Email, etc.) | Todo string, validación manual |
| Performance | 1 registro → instantáneo | 57 registros + filtrado |
| Flexibilidad futura | Multi-marca (1 registro por cliente) | Requiere campo MARCA_ID o similar |
| Migración desde estado actual | Crear tabla + seed data | Agregar registros a tabla existente |
| Riesgo | Medio (nueva dependencia) | Bajo (misma infraestructura) |

---

## 5. Recomendación

**Crear tabla `MARCAS`** (opción A) por las siguientes razones:

1. **Semántica clara**: un registro = una marca. No key-value genérico.
2. **Tipos Airtable nativos**: URL se valida como URL, Email como email, etc.
3. **Escalabilidad multi-rubro**: cuando el sistema soporte múltiples clientes, solo se agregan registros.
4. **Endpoint dedicado**: `/api/marca-blanca` con contrato fijo (no genérico).
5. **Caché eficiente**: un solo registro con `LAST_MODIFIED` → ETag.

La tabla `CONFIGURACION_PUBLICA` existente se mantiene para:
- Banners rotativos (ya funciona)
- Flags de feature (RESERVA_ONLINE_HABILITADA, etc.)
- Configuraciones que no son de identidad de marca

---

## 6. Seed data para registro demo

```json
{
  "NOMBRE_MARCA": "BellezaPro Demo",
  "NOMBRE_CORTO_MARCA": "BellezaPro",
  "TAGLINE_MARCA": "Belleza, bienestar y reservas simples en un solo lugar.",
  "DESCRIPCION_MARCA": "Sistema de gestión para salones de belleza y centros de estética.",
  "INICIALES_MARCA": "BD",
  "COLOR_PRIMARIO": "006686",
  "COLOR_SECUNDARIO": "7DD3FC",
  "COLOR_ACENTO": "38BDF8",
  "COLOR_TEXTO": "0B1C30",
  "COLOR_TEXTO_SECUNDARIO": "3F484E",
  "COLOR_SUPERFICIE": "F8F9FF",
  "GRADIENTE_PRIMARIO": "linear-gradient(135deg, #7DD3FC, #006686)",
  "GRADIENTE_BANNER": "linear-gradient(135deg, #006686, #0B4D6A)",
  "TIPOGRAFIA_TITULOS": "Manrope",
  "TIPOGRAFIA_CUERPO": "Manrope",
  "CTA_PRINCIPAL": "Reservar turno",
  "CTA_SECUNDARIO": "Ver servicios",
  "SECCION_SERVICIOS_TITULO": "Servicios destacados",
  "SECCION_SERVICIOS_SUBTITULO": "Los tratamientos más elegidos por nuestras clientas",
  "SECCION_PRODUCTOS_TITULO": "Productos destacados",
  "SECCION_PRODUCTOS_SUBTITULO": "Productos profesionales para el cuidado diario",
  "SECCION_COMO_FUNCIONA_TITULO": "¿Cómo funciona?",
  "SECCION_COMO_FUNCIONA_SUBTITULO": "Reservar nunca fue tan simple",
  "SECCION_VISITANOS_TITULO": "Visitanos",
  "SECCION_VISITANOS_SUBTITULO": "Consultá nuestras sucursales disponibles y vení a conocernos.",
  "SECCION_VISITANOS_LINK": "Ver sucursales",
  "CTA_FINAL_TITULO": "¿Lista para tu próximo turno?",
  "CTA_FINAL_SUBTITULO": "Reservá ahora y asegurate tu espacio.",
  "CATALOGO_TITULO": "Catálogo de Servicios",
  "CATALOGO_SUBTITULO": "Servicios profesionales de belleza y bienestar",
  "RESERVA_TITULO": "Reservá tu Turno",
  "RESERVA_SUBTITULO": "Seleccioná servicio, sucursal y horario",
  "LOGIN_TITULO": "BellezaPro Demo",
  "LOGIN_SUBTITULO_LOGIN": "Acceso demo interno",
  "LOGIN_SUBTITULO_REGISTRO": "Creá tu cuenta de cliente",
  "LOGIN_DEMO_BANNER": "Seleccioná un perfil para explorar la plataforma. No se usan contraseñas reales.",
  "VER_CATALOGO_LINK": "Ver catálogo completo",
  "VER_PRODUCTOS_LINK": "Ver productos",
  "TELEFONO": "+54 11 5555-0000",
  "EMAIL": "contacto@bellezapro.com",
  "DIRECCION": "Av. Corrientes 1234, CABA",
  "LEGAL_TEXTO_FOOTER": "BellezaPro Demo es un sistema de demostración. No se realizan reservas reales.",
  "LEGAL_COPYRIGHT": "Powered by Sistema Marca Blanca",
  "SEO_TITULO": "BellezaPro Demo",
  "ACTIVO": true,
  "ES_DEMO": true,
  "RUBRO": "Salón de Belleza"
}
```

---

## 7. Plan de implementación (futuro — no en FASE 1K)

| Fase | Descripción |
|------|-------------|
| FASE 2A | Crear tabla `MARCAS` en Airtable + seed data |
| FASE 2B | Crear endpoint `GET /api/marca-blanca` en backend Railway |
| FASE 2C | Migrar frontend: `BrandConfigContext` + consumir endpoint en todos los componentes |
| FASE 2D | Eliminar hardcodes, dejar solo fallbacks en `brandTheme.js` |

---

> 📄 Documento generado en FASE 1K — Dry-run. Propuesta de schema, no se crean tablas.

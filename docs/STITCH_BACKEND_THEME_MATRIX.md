# STITCH ↔ BACKEND THEME MATRIX

> Mapeo completo entre tokens del design system Stitch, claves de la API backend y su uso visual en el frontend.

**Backend endpoints:** `/api/configuracion-publica` + `/api/marca-blanca`
**Frontend:** `resolveBrandConfig.js` → CSS custom properties
**Paleta base:** Glacier (Ice Blue `#006686` / Lilac `#674bb5` / Cobre `#D4A574`)

---

## Matriz de tokens

| # | Token Stitch | Uso Visual | Clave Backend Esperada | Campo Backend Usado | Fallback | Donde se Aplica | Riesgo Contraste | Estado |
|---|---|---|---|---|---|---|---|---|
| 1 | `--brand-name` | Título landing, navbar, footer | NOMBRE_SISTEMA | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | "BellezaPro Demo" | Todo el frontend | N/A | ✅ activo |
| 2 | `--brand-primary` | Botones, acentos, links, highlights | COLOR_PRIMARIO | CLAVE_CONFIGURACION → COLOR_HEX_CONFIGURACION | `#006686` (Ice Blue) | Botones, links, iconos | Usar solo en fondos/tint; si es muy claro → no usar en texto | ✅ activo |
| 3 | `--brand-secondary` | Gradientes, fondos secundarios, badges | COLOR_SECUNDARIO | CLAVE_CONFIGURACION → COLOR_HEX_CONFIGURACION | `#674bb5` (Lilac) | Badges, tags, fondos de sección | Similar a primary | ✅ activo |
| 4 | `--brand-accent` | Bordes, glowing effects, decoración sutil | COLOR_ACCENTO | CLAVE_CONFIGURACION → COLOR_HEX_CONFIGURACION | `#D4A574` (Cobre) | Bordes, glow, iconos decorativos | Si es muy tenue → usar como borde/glow, no como texto | ✅ activo |
| 5 | `--brand-text` | Texto principal en todo el frontend | COLOR_TEXTO | CLAVE_CONFIGURACION → COLOR_HEX_CONFIGURACION | `#0b1c30` | Todos los textos | Debe contrastar ≥4.5:1 con surface | ✅ activo |
| 6 | `--brand-surface` | Fondo de página, cards, modales | COLOR_FONDO | CLAVE_CONFIGURACION → COLOR_HEX_CONFIGURACION | `#f8f9ff` | Body, cards, paneles | Debe ser claro para glassmorphism | ✅ activo |
| 7 | `--brand-hero-image` | Imagen de fondo en hero section landing | IMAGEN_HERO | CLAVE_CONFIGURACION → IMAGEN_CONFIGURACION | null | Hero section landing | Si es muy oscura → overlay claro | ✅ activo |
| 8 | `--brand-background-image` | Imagen de fondo global (opcional) | IMAGEN_FONDO | CLAVE_CONFIGURACION → IMAGEN_CONFIGURACION | null | Body background | Puede reducir legibilidad si hay mucho texto | ✅ activo |
| 9 | `--brand-logo` | Logo en navbar, footer, emails | LOGO | CLAVE_CONFIGURACION → IMAGEN_CONFIGURACION | null | Navbar, footer, favicon | Si no se carga → usar texto | ✅ activo |
| 10 | `--brand-cta-label` | Texto del botón principal de acción | TEXTO_CTA | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | "Reservar turno" | Hero, cards, navbar | N/A | ✅ activo |
| 11 | `--brand-contact-phone` | Teléfono en footer y sección contacto | TELEFONO | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | null | Footer, sección contacto | N/A | ✅ activo |
| 12 | `--brand-contact-email` | Email en footer y sección contacto | EMAIL | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | null | Footer, sección contacto | N/A | ✅ activo |
| 13 | `--brand-contact-whatsapp` | Link WhatsApp en contacto | WHATSAPP | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | null | Sección contacto, floating button | N/A | ✅ activo |
| 14 | `--glass-blur` | Intensidad del desenfoque glass | GLASS_BLUR | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | `16px` | Cards, paneles, modales | Si es muy alto (>24px) → puede ser molesto | ✅ activo |
| 15 | `--glass-opacity` | Opacidad base glassmorphism | GLASS_OPACITY | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | `0.6` | Cards, paneles | Si es muy bajo (<0.3) → contenido ilegible | ✅ activo |
| 16 | `--glass-border-color` | Color del borde glass | GLASS_BORDER_COLOR | CLAVE_CONFIGURACION → COLOR_HEX_CONFIGURACION | `rgba(255,255,255,0.2)` | Bordes de cards/paneles glass | N/A | ✅ activo |
| 17 | `--font-heading` | Tipografía headings | FUENTE_HEADING | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | `Manrope` | h1-h6, títulos de sección | Debe ser font de Google Fonts o system | ✅ activo |
| 18 | `--font-body` | Tipografía cuerpo | FUENTE_BODY | CLAVE_CONFIGURACION → TEXTO_CONFIGURACION | `Manrope` | Body, párrafos, inputs | Debe ser legible a 14-16px | ✅ activo |

---

## Reglas de contraste y seguridad visual

| Regla | Descripción |
|-------|------------|
| **R1** | Si `brandPrimary` es muy claro (luminosidad > 180/255), NO usarlo como color de texto — usarlo como fondo, borde, glow o acento |
| **R2** | Si `brandText` contrasta menos de 3:1 con `brandSurface`, forzar `brandText` a `#0b1c30` (fallback seguro) |
| **R3** | Si `brandHeroImage` es muy oscura, aplicar overlay `rgba(255,255,255,0.4)` arriba |
| **R4** | Si `brandBackgroundImage` existe, aplicar `backdrop-blur` leve a todo el contenido |
| **R5** | Si `brandLogo` no carga (404), mostrar `brandName` como texto en navbar |
| **R6** | `brandAccent` SIEMPRE se usa como borde/glow/decoración — NUNCA como texto principal |
| **R7** | Glassmorphism requiere `brandSurface` claro — si es oscuro (>50% negro), glass no se verá |

---

## Jerarquía de datos

```
Prioridad 1: /api/configuracion-publica (clave-valor, la más específica)
Prioridad 2: /api/marca-blanca (endpoint unificado, valores agrupados)
Prioridad 3: brandTheme.js (fallback estático Stitch Glacier seguro)
```

---

## Campos backend reales (verificados 2026-06-15)

Extracto de `/api/configuracion-publica` (97 registros activos):

| CLAVE_CONFIGURACION esperada | Ejemplo de valor | Campo en Airtable |
|---|---|---|
| COLOR_PRIMARIO | `#006686` | `COLOR_HEX_CONFIGURACION` |
| COLOR_SECUNDARIO | `#674bb5` | `COLOR_HEX_CONFIGURACION` |
| NOMBRE_SISTEMA | `BellezaPro Demo` | `TEXTO_CONFIGURACION` |
| TEXTO_CTA | `Reservar turno` | `TEXTO_CONFIGURACION` |
| TELEFONO | `+54 11 5555-0000` | `TEXTO_CONFIGURACION` |
| EMAIL | `contacto@bellezapro.com` | `TEXTO_CONFIGURACION` |

**Nota:** Los nombres exactos de CLAVE_CONFIGURACION pueden variar — `resolveBrandConfig.js` ya soporta variantes (case-insensitive, con/sin guiones bajos).


# STITCH DESIGN AUDIT — Glacier Design System

> **Proyecto:** Sistema Marca Blanca Multirrubro (Beauty & Wellness SaaS)
> **Versión:** 1.0
> **Fecha compilación:** 2026-06-15
> **Design System base:** Stitch → Glacier (público) + Glacier Admin (backoffice)

---

## 1. ARCHIVOS LEÍDOS

| # | Archivo | Ruta completa | Líneas |
|---|---------|--------------|--------|
| 1 | `DESIGN.md` (Glacier público) | `docs/design-references/stitch/glacier/DESIGN.md` | 157 |
| 2 | `DESIGN.md` (Glacier Admin) | `docs/design-references/stitch/glacier_admin/DESIGN.md` | 144 |

### Estructura completa de referencia Stitch (15 carpetas con HTMLs)

```
docs/design-references/stitch/
├── glacier/                          → Landing pública
│   ├── DESIGN.md
│   ├── code.html
│   └── screen*.png
├── glacier_admin/                    → Backoffice base
│   ├── DESIGN.md
│   ├── code.html
│   └── screen*.png
├── tienda_boutique_completa_glacier/ → Catálogo de servicios
│   ├── code.html
│   └── screen13.png
├── reserva_de_cita_modal_glacier_1/  → Modal de reserva (paso 1)
│   ├── code.html
│   └── screen11.png
├── reserva_de_cita_modal_glacier_2/  → Modal de reserva (paso 2)
│   ├── code.html
│   └── screen12.png
├── nuestras_sucursales_glacier/      → Ubicaciones / sucursales
│   ├── code.html
│   └── screen8.png
├── glacier_management_dashboard_desktop/ → Dashboard admin principal
│   ├── code.html
│   └── screen6.png
├── agenda_operativa_de_citas_staff_view/ → Agenda de citas (staff)
│   ├── code.html
│   └── screen.png
├── gesti_n_de_clientes_glacier_admin/ → Gestión de clientes
│   ├── code.html
│   └── screen4.png
├── control_de_inventario_glacier_admin/ → Control de inventario/servicios
│   ├── code.html
│   └── screen2.png
├── gesti_n_de_staff_glacier_admin/   → Gestión de staff
│   ├── code.html
│   └── screen5.png
├── nueva_cita_modal_administrativo/  → Modal nueva cita (admin)
│   ├── code.html
│   └── screen9.png
├── galer_a_de_transformaciones_glacier/ → Galería de transformaciones
│   ├── code.html
│   └── screen3.png
├── nuestro_equipo_elite_glacier/     → Página "Nuestro equipo"
│   ├── code.html
│   └── screen7.png
└── portal_h_brido_boutique_showcase/ → Portal híbrido boutique
    └── screen10.png
```

---

## 2. TOKENS DE COLOR — GLACIER (PÚBLICO)

### Filosofía cromática
El sistema público se centra en **Ice Blue (#7dd3fc)** como color primario y **Lilac (#a78bfa)** como acento secundario. Es un modo claro especializado donde las superficies no son blancas sólidas sino translúcidas (glassmorphism).

### Tokens completos

#### Surface tokens (superficies translúcidas)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `surface` | `#f8f9ff` | Fondo general |
| `surface-dim` | `#cbdbf5` | Superficie atenuada |
| `surface-bright` | `#f8f9ff` | Superficie brillante |
| `surface-container-lowest` | `#ffffff` | Contenedor más bajo |
| `surface-container-low` | `#eff4ff` | Contenedor bajo |
| `surface-container` | `#e5eeff` | Contenedor estándar |
| `surface-container-high` | `#dce9ff` | Contenedor elevado |
| `surface-container-highest` | `#d3e4fe` | Contenedor más elevado |
| `surface-variant` | `#d3e4fe` | Variante de superficie |
| `inverse-surface` | `#213145` | Superficie invertida |
| `inverse-on-surface` | `#eaf1ff` | Texto sobre superficie invertida |

#### On-surface tokens (texto sobre superficies)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `on-surface` | `#0b1c30` | Texto principal |
| `on-surface-variant` | `#3f484e` | Texto secundario |

#### Outline tokens
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `outline` | `#6f787e` | Bordes principales |
| `outline-variant` | `#bec8ce` | Bordes sutiles |

#### Primary tokens (Ice Blue)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `primary` | `#006686` | Acciones principales, CTAs |
| `on-primary` | `#ffffff` | Texto sobre primary |
| `primary-container` | `#7dd3fc` | Contenedor primario (Ice Blue!) |
| `on-primary-container` | `#005b78` | Texto sobre contenedor primario |
| `inverse-primary` | `#7bd1fa` | Primario en contexto invertido |
| `primary-fixed` | `#c0e8ff` | Primario fijo |
| `primary-fixed-dim` | `#7bd1fa` | Primario fijo atenuado |
| `on-primary-fixed` | `#001e2b` | Texto sobre primario fijo |
| `on-primary-fixed-variant` | `#004d66` | Texto variante sobre primario fijo |
| `surface-tint` | `#006686` | Tinte de superficie |

#### Secondary tokens (Lilac)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `secondary` | `#674bb5` | Acentos VIP, premium |
| `on-secondary` | `#ffffff` | Texto sobre secundario |
| `secondary-container` | `#ab8ffe` | Contenedor secundario |
| `on-secondary-container` | `#3f1e8c` | Texto sobre contenedor secundario |
| `secondary-fixed` | `#e8ddff` | Secundario fijo |
| `secondary-fixed-dim` | `#cebdff` | Secundario fijo atenuado |
| `on-secondary-fixed` | `#21005e` | Texto sobre secundario fijo |
| `on-secondary-fixed-variant` | `#4f319c` | Texto variante sobre secundario fijo |

#### Tertiary tokens
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `tertiary` | `#576065` | Elementos terciarios |
| `on-tertiary` | `#ffffff` | Texto sobre terciario |
| `tertiary-container` | `#c1cad0` | Contenedor terciario |
| `on-tertiary-container` | `#4c555a` | Texto sobre contenedor terciario |
| `tertiary-fixed` | `#dbe4ea` | Terciario fijo |
| `tertiary-fixed-dim` | `#bfc8ce` | Terciario fijo atenuado |
| `on-tertiary-fixed` | `#141d21` | Texto sobre terciario fijo |
| `on-tertiary-fixed-variant` | `#3f484d` | Texto variante sobre terciario fijo |

#### Error tokens
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `error` | `#ba1a1a` | Error, validación |
| `on-error` | `#ffffff` | Texto sobre error |
| `error-container` | `#ffdad6` | Contenedor de error |
| `on-error-container` | `#93000a` | Texto sobre contenedor de error |

#### Background
| Token | Valor HEX |
|-------|-----------|
| `background` | `#f8f9ff` |
| `on-background` | `#0b1c30` |

---

## 3. TOKENS DE COLOR — GLACIER ADMIN (BACKOFFICE)

### Filosofía cromática
Extensión productividad-enfocada del Glacier público. Mantiene la estética glassmorphic pero con tonos más profundos y autoritativos para largas sesiones de administración. El primario se vuelve más profundo (`#005d90`), y se añaden cian/azure para estados de selección.

### Tokens completos

#### Surface tokens
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `surface` | `#f7f9fb` | Fondo general |
| `surface-dim` | `#d8dadc` | Superficie atenuada |
| `surface-bright` | `#f7f9fb` | Superficie brillante |
| `surface-container-lowest` | `#ffffff` | Contenedor más bajo |
| `surface-container-low` | `#f2f4f6` | Contenedor bajo |
| `surface-container` | `#eceef0` | Contenedor estándar |
| `surface-container-high` | `#e6e8ea` | Contenedor elevado |
| `surface-container-highest` | `#e0e3e5` | Contenedor más elevado |
| `surface-variant` | `#e0e3e5` | Variante de superficie |
| `inverse-surface` | `#2d3133` | Superficie invertida (más oscura que público) |
| `inverse-on-surface` | `#eff1f3` | Texto sobre superficie invertida |

#### On-surface tokens
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `on-surface` | `#191c1e` | Texto principal (más contrastado) |
| `on-surface-variant` | `#404850` | Texto secundario |

#### Outline tokens
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `outline` | `#707881` | Bordes principales |
| `outline-variant` | `#bfc7d1` | Bordes sutiles |

#### Primary tokens (Deep Glacier Blue)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `primary` | `#005d90` | Acciones principales (más profundo) |
| `on-primary` | `#ffffff` | Texto sobre primary |
| `primary-container` | `#0077b6` | Contenedor primario |
| `on-primary-container` | `#f3f7ff` | Texto sobre contenedor primario (claro) |
| `inverse-primary` | `#94ccff` | Primario en contexto invertido |
| `primary-fixed` | `#cde5ff` | Primario fijo |
| `primary-fixed-dim` | `#94ccff` | Primario fijo atenuado |
| `on-primary-fixed` | `#001d32` | Texto sobre primario fijo |
| `on-primary-fixed-variant` | `#004b74` | Texto variante sobre primario fijo |
| `surface-tint` | `#006399` | Tinte de superficie |

#### Secondary tokens (Deep Teal)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `secondary` | `#2a6671` | Acentos secundarios |
| `on-secondary` | `#ffffff` | Texto sobre secundario |
| `secondary-container` | `#aee9f5` | Contenedor secundario (cyan claro) |
| `on-secondary-container` | `#2f6b75` | Texto sobre contenedor secundario |
| `secondary-fixed` | `#b1ecf8` | Secundario fijo |
| `secondary-fixed-dim` | `#95d0dc` | Secundario fijo atenuado |
| `on-secondary-fixed` | `#001f24` | Texto sobre secundario fijo |
| `on-secondary-fixed-variant` | `#054e58` | Texto variante sobre secundario fijo |

#### Tertiary tokens (Azure)
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `tertiary` | `#006272` | Elementos terciarios |
| `on-tertiary` | `#ffffff` | Texto sobre terciario |
| `tertiary-container` | `#007d90` | Contenedor terciario |
| `on-tertiary-container` | `#ebfaff` | Texto sobre contenedor terciario |
| `tertiary-fixed` | `#a7edff` | Terciario fijo |
| `tertiary-fixed-dim` | `#58d6f1` | Terciario fijo atenuado |
| `on-tertiary-fixed` | `#001f25` | Texto sobre terciario fijo |
| `on-tertiary-fixed-variant` | `#004e5b` | Texto variante sobre terciario fijo |

#### Error tokens (compartidos con público)
| Token | Valor HEX |
|-------|-----------|
| `error` | `#ba1a1a` |
| `on-error` | `#ffffff` |
| `error-container` | `#ffdad6` |
| `on-error-container` | `#93000a` |

#### Background
| Token | Valor HEX |
|-------|-----------|
| `background` | `#f7f9fb` |
| `on-background` | `#191c1e` |

### Colores semánticos (admin)
| Estado | Color | Uso |
|--------|-------|-----|
| Success | Emerald (alto contraste) | Éxito, completado |
| Warning | Amber (alto contraste) | Advertencia |
| Error | Rose (alto contraste) | Error, fallo |

---

## 4. TIPOGRAFÍA

### Glacier (Público)

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Uso |
|-------|-------------|------|--------|-------------|----------------|-----|
| `display-lg` | Manrope | 48px | 700 | 56px | -0.02em | Hero / títulos principales |
| `headline-lg` | Manrope | 32px | 600 | 40px | -0.01em | Encabezados de sección |
| `headline-lg-mobile` | Manrope | 24px | 600 | 32px | — | Encabezados en móvil |
| `body-md` | Manrope | 16px | 400 | 24px | — | Texto cuerpo |
| `label-sm` | JetBrains Mono | 12px | 500 | 16px | — | Labels técnicos, precios, timestamps |

**Fuentes:**
- **Manrope:** Principal — moderna, balanceada, geométrica. Para headings y body.
- **JetBrains Mono:** Técnica — precios, timestamps, labels de precisión.

### Glacier Admin (Backoffice)

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Uso |
|-------|-------------|------|--------|-------------|----------------|-----|
| `display-sm` | Hanken Grotesk | 30px | 700 | 38px | -0.02em | Títulos de dashboard |
| `headline-md` | Hanken Grotesk | 20px | 600 | 28px | -0.01em | Encabezados de panel |
| `body-md` | Inter | 14px | 400 | 20px | — | Texto cuerpo (14px para densidad) |
| `body-sm` | Inter | 12px | 400 | 18px | — | Texto pequeño, breadcrumbs |
| `label-md` | JetBrains Mono | 12px | 500 | 16px | — | IDs, badges, datos tabulares |
| `label-xs` | JetBrains Mono | 10px | 500 | 12px | — | Headers de tabla, badges compactos |

**Fuentes:**
- **Hanken Grotesk:** Headlines — sharp, contemporáneo, profesional.
- **Inter:** Body — legibilidad excepcional en entornos densos de datos.
- **JetBrains Mono:** Datos técnicos — IDs, estados, números tabulares.

### Estrategia tipográfica unificada
- **Público:** Manrope (headings + body) + JetBrains Mono (datos precisos). Tamaños más grandes, más aire.
- **Admin:** Hanken Grotesk (headings) + Inter (body) + JetBrains Mono (datos). Tamaños reducidos para densidad de información.
- Ambos sistemas usan letter-spacing negativo en headings para look editorial ajustado.

---

## 5. ESPACIADO (SPACING)

### Glacier (Público)

| Token | Valor | Uso |
|-------|-------|-----|
| `unit` | 8px | Escala lineal base para todo padding/margin |
| `container-padding-desktop` | 40px | Margen externo desktop |
| `container-padding-mobile` | 20px | Margen externo mobile |
| `gutter` | 24px | Espacio entre columnas |
| `surface-gap` | 16px | Separación entre glass cards y navegación |

**Grid:**
- Desktop: 12 columnas, márgenes externos 40px
- Mobile: 4 columnas, márgenes externos 20px
- Ritmo vertical: estrictamente 8px linear scale

### Glacier Admin (Backoffice)

| Token | Valor | Uso |
|-------|-------|-----|
| `sidebar-width` | 260px | Ancho fijo SideNavBar |
| `topbar-height` | 64px | Altura TopAppBar |
| `gutter` | 16px | Espacio entre columnas |
| `margin-page` | 24px | Margen de página |
| `stack-compact` | 8px | Stack compacto |
| `stack-dense` | 4px | Stack denso (baseline para dashboards) |

**Grid:**
- SideNavBar: 260px fijo (panel glass lateral)
- TopAppBar: 64px fijo (breadcrumbs, search, perfil)
- Main Content: fluido, 12 columnas
- Densidad: baseline 4px para maximizar información en pantalla

---

## 6. ELEVACIÓN (ELEVATION)

### Glacier (Público) — "Backdrop Blurs + Tonal Layering"

| Nivel | Descripción | Especificación |
|-------|-------------|----------------|
| **Level 0 (Base)** | Fondo gradiente suave | Ice Blue → White |
| **Level 1 (Cards)** | Glass translúcido | Blanco 60% opacidad, blur 16px, borde blanco sólido 1px (20% opacidad) |
| **Level 2 (Modals/Popovers)** | Glass elevado | Blanco 80% opacidad, blur 32px, "Ambient Glow" (sombra Ice Blue 10% opacidad) |
| **Interaction** | "Lift" al hover | Aumentar intensidad del blur + stroke blanco fino en borde superior (light catch) |

> Sin sombras negras tradicionales. La profundidad se logra con blurs y capas tonales.

### Glacier Admin (Backoffice) — "Refractive Layering"

| Nivel | Descripción | Especificación |
|-------|-------------|----------------|
| **Level 0 (Background)** | Gradiente lineal sutil | `neutral_color_hex` → blanco cálido |
| **Level 1 (Cards/Panels)** | Frosted glass | Borde blanco sólido 1px (40% opacidad, inner glow) |
| **Level 2 (Popovers/Modals)** | Mayor separación | Backdrop-blur aumentado + sombra ambiental blue-tinted (10% opacidad) |
| **Dividers** | `border_subtle` | Sin ruido visual |

> Profundidad por capas refractivas, no sombras. Mayor blur que el público para contexto administrativo.

---

## 7. FORMAS (SHAPES)

### Glacier (Público) — "Rounded (0.5rem base)"

| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 0.25rem (4px) | Indicadores de selección |
| `DEFAULT` | 0.5rem (8px) | **Botones e inputs estándar** |
| `md` | 0.75rem (12px) | — |
| `lg` | 1rem (16px) | **Cards y contenedores grandes** |
| `xl` | 1.5rem (24px) | — |
| `full` | 9999px | **Toasts de feedback, avatares** (pill-shape) |

### Glacier Admin (Backoffice) — "Soft-Geometric"

| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 0.125rem (2px) | — |
| `DEFAULT` | 0.25rem (4px) | **Componentes estándar** (crisp, profesional) |
| `md` | 0.375rem (6px) | — |
| `lg` | 0.5rem (8px) | **Botones e inputs interactivos** |
| `xl` | 0.75rem (12px) | — |
| `full` | 9999px | **Status badges** (pill-shape) |

### Comparativa
| Elemento | Público | Admin |
|----------|---------|-------|
| Botones/Inputs | 8px (0.5rem) | 8px (0.5rem) |
| Cards/Contenedores | 16px (1rem) | 4px (0.25rem) |
| Badges/Toasts | 24px+ (full pill) | full pill |
| Selección | 4px sutil | — |

> Admin es más angular y "crisp" para transmitir precisión profesional. Público es más suave y acogedor.

---

## 8. COMPONENTES

### 8.1 Botones

#### Público (Glacier)
| Variante | Estilo | Hover |
|----------|--------|-------|
| **Primary** | Sólido Ice Blue (#7dd3fc) + texto blanco. High-gloss (gradiente lineal top→bottom) | Aumenta saturación |
| **Ghost (Glass)** | Transparente + borde "Border Glass" 1px. Texto color Primary | Aumenta densidad del backdrop-blur |

#### Admin (Glacier Admin)
| Variante | Estilo |
|----------|--------|
| **Primary** | Sólido `primary_color_hex` (#005d90), destaca contra UI glass |
| **Secondary (Outline-Glass)** | Estilo "Outline-Glass" |

### 8.2 Inputs

#### Público
- **Estilo:** Glass fields understated. Blanco 40% opacidad.
- **Focus:** Borde sólido Ice Blue 2px + glow externo azul suave (spread 4px).
- **Tipografía:** Placeholder neutral-400, texto usuario neutral-900.

#### Admin
- **Estilo:** "Glass-Inlay" — sombras inset + fondos semi-transparentes.
- **Propósito:** Clarificar que el elemento es editable.

### 8.3 Navegación

#### Público — Role-Based
| Rol | Estilo |
|-----|--------|
| **Owner/Admin** | Side nav: panel glass alta densidad (blur 80%). Iconos outlined thin (1.5pt) |
| **Staff/Provider** | Bottom nav mobile-first. Touch targets grandes, labels simplificados |
| **Indicador activo** | "Ice-chip" vertical (barra 2px) a la izquierda del ítem activo |

#### Admin — SideNavBar Profesional
- **SideNavBar:** 260px fijo, glass panel.
- **TopAppBar:** 64px, breadcrumbs + search + perfil.
- **Active State:** "Active State Glow" — barra vertical `primary_color_hex` en borde leading + inner glow suave.

### 8.4 Cards

#### Público
- Borde semi-transparente blanco 1px (siempre).
- Headers separados por divider glass 1px.
- Padding interno mínimo 24px (premium feel).

#### Admin
- Frosted glass panels.
- Borde blanco sólido 1px (40% opacidad, inner glow).

### 8.5 Data Tables (Admin exclusivo)
- **Estilo:** "Zebra-Glass" — filas pares con 5% tint de primary.
- **Headers:** `label-xs` en bold.
- Componente central del sistema admin.

### 8.6 Status Badges (Admin)
- **Forma:** Pill-shape compacto.
- **Estilo:** Fondos tint claro de colores semánticos + texto alto contraste.
- **Colores:** Emerald (success), Amber (warning), Rose (error).

### 8.7 Breadcrumbs (Admin)
- **Estilo:** Text links minimalistas.
- **Tipografía:** `body-sm`.

### 8.8 Modals / Popovers

#### Público
- Glass 80% opacidad, blur 32px.
- "Ambient Glow" (sombra Ice Blue 10%).

#### Admin
- Backdrop-blur aumentado.
- Sombra ambiental blue-tinted 10%.

---

## 9. GLASSMORPHISM — ESPECIFICACIONES TÉCNICAS UNIFICADAS

### Principios generales
El sistema se basa en **translucidez** en lugar de opacidad sólida. Esto crea una sensación de "ligereza etérea" que reduce la carga cognitiva incluso en pantallas densas de datos.

### Valores de blur por contexto

| Contexto | Opacidad superficie | Blur | Borde |
|----------|---------------------|------|-------|
| Cards (público) | 60% white | 16px | 1px white 20% opacity |
| Modals (público) | 80% white | 32px | Ambient glow Ice Blue 10% |
| SideNav (admin) | Frosted | 20px+ | 1px white 40% opacity inner glow |
| Cards (admin) | Frosted | — | 1px white 40% opacity inner glow |
| Data tables (admin) | Zebra-Glass (5% primary tint even rows) | — | — |
| Inputs (admin) | Glass-Inlay (inset shadows) | — | — |

### CSS base para glass surfaces
```css
/* Card público */
.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 24px;
}

/* Card admin */
.glass-card-admin {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 0.25rem;
}

/* Modal público */
.glass-modal {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(32px);
  box-shadow: 0 0 40px rgba(125, 211, 252, 0.1); /* Ambient Glow */
  border-radius: 1rem;
}

/* Glass input */
.glass-input {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
}
.glass-input:focus {
  border: 2px solid #7dd3fc;
  box-shadow: 0 0 0 4px rgba(125, 211, 252, 0.2);
}
```

---

## 10. MAPEO DE PANTALLAS STITCH → RUTAS DEL PROYECTO

| # | Carpeta Stitch | Pantalla | Ruta proyecto | Layout | Tipo |
|---|---------------|----------|---------------|--------|------|
| 1 | `glacier/` | Landing principal | `/` | Público | Landing |
| 2 | `tienda_boutique_completa_glacier/` | Catálogo de servicios | `/catalogo` | Público | Catálogo |
| 3 | `reserva_de_cita_modal_glacier_1/` | Reserva paso 1 | `/reserva` | Público | Modal/Stepper |
| 4 | `reserva_de_cita_modal_glacier_2/` | Reserva paso 2 | `/reserva` | Público | Modal/Stepper |
| 5 | `nuestras_sucursales_glacier/` | Sucursales | `/ubicacion` | Público | Listado |
| 6 | `nuestro_equipo_elite_glacier/` | Nuestro equipo | `/equipo` | Público | Grid |
| 7 | `galer_a_de_transformaciones_glacier/` | Galería | `/galeria` | Público | Galería |
| 8 | `portal_h_brido_boutique_showcase/` | Portal híbrido boutique | (auxiliar) | Público | Showcase |
| 9 | `glacier_admin/` | Backoffice base | `/backoffice` | Admin | Shell |
| 10 | `glacier_management_dashboard_desktop/` | Dashboard admin | `/backoffice` | Admin | Dashboard |
| 11 | `agenda_operativa_de_citas_staff_view/` | Agenda de citas | `/backoffice/agenda` | Admin | Calendario |
| 12 | `gesti_n_de_clientes_glacier_admin/` | Gestión de clientes | `/backoffice/clientes` | Admin | Data Table |
| 13 | `control_de_inventario_glacier_admin/` | Inventario / Servicios | `/backoffice/servicios` | Admin | Data Table |
| 14 | `gesti_n_de_staff_glacier_admin/` | Gestión de staff | `/backoffice/staff` | Admin | Data Table |
| 15 | `nueva_cita_modal_administrativo/` | Modal nueva cita (admin) | `/backoffice/agenda` | Admin | Modal |

### Agrupación por layout

| Layout | Rutas | Design System |
|--------|-------|---------------|
| **Landing** | `/` | Glacier (público) |
| **Catálogo** | `/catalogo` | Glacier (público) |
| **Reserva** | `/reserva` | Glacier (público) |
| **Ubicación** | `/ubicacion` | Glacier (público) |
| **Equipo** | `/equipo` | Glacier (público) |
| **Galería** | `/galeria` | Glacier (público) |
| **Backoffice Shell** | `/backoffice` | Glacier Admin |
| **Dashboard** | `/backoffice` | Glacier Admin |
| **Agenda** | `/backoffice/agenda` | Glacier Admin |
| **Clientes** | `/backoffice/clientes` | Glacier Admin |
| **Servicios** | `/backoffice/servicios` | Glacier Admin |
| **Staff** | `/backoffice/staff` | Glacier Admin |

---

## 11. DESIGN SYSTEM UNIFICADO — RESUMEN

### 11.1 Diferencias clave Público vs Admin

| Aspecto | Glacier (Público) | Glacier Admin (Backoffice) |
|---------|-------------------|---------------------------|
| **Personalidad** | Ethereal precision — luxury boutique | Serene workspace — calm efficiency |
| **Color primario** | `#006686` / `#7dd3fc` (Ice Blue) | `#005d90` / `#0077b6` (Deep Glacier) |
| **Color secundario** | `#674bb5` (Lilac, VIP/premium) | `#2a6671` (Deep Teal) |
| **Fondo** | `#f8f9ff` (más azulado) | `#f7f9fb` (más neutro) |
| **Texto principal** | `#0b1c30` (más oscuro) | `#191c1e` (más contrastado) |
| **Heading font** | Manrope (moderno, balanceado) | Hanken Grotesk (sharp, profesional) |
| **Body font** | Manrope 16px | Inter 14px (densidad) |
| **Mono font** | JetBrains Mono | JetBrains Mono |
| **Base radius** | 0.5rem (8px) — suave | 0.25rem (4px) — crisp |
| **Card radius** | 1rem (16px) | 0.25rem (4px) |
| **Spacing baseline** | 8px | 4px |
| **Grid** | Fluid 12-col (40px desktop margin) | Rigid admin (260px sidebar + 64px topbar + fluid 12-col) |
| **Elevación** | Backdrop blurs + tonal layering | Refractive layering (más blur) |
| **Navegación** | Side nav (admin) / Bottom nav (staff) | SideNavBar 260px + TopAppBar 64px |
| **Componentes clave** | Cards, modals, inputs glass | Data tables (Zebra-Glass), SideNavBar, Status badges |

### 11.2 Lo que comparten ambos sistemas

- **Glassmorphism** como técnica base de profundidad
- **JetBrains Mono** para datos técnicos/tabulares
- **Sin sombras negras** — la profundidad viene de blurs y capas
- **Bordes glass** (1px white semi-transparente)
- **Tokens de error** idénticos (`#ba1a1a`, `#ffdad6`)
- **Escala de rounded** con `full: 9999px` para pills
- **Letter-spacing negativo** en headings
- **Filosofía "ethereal"** — ligereza, aire, calma visual

### 11.3 Jerarquía de tokens CSS personalizados recomendada

```css
:root {
  /* === GLACIER PÚBLICO === */
  /* Surface */
  --gl-surface: #f8f9ff;
  --gl-surface-glass: rgba(255, 255, 255, 0.6);
  --gl-surface-modal: rgba(255, 255, 255, 0.8);

  /* Primary */
  --gl-primary: #006686;
  --gl-primary-container: #7dd3fc;
  --gl-primary-bright: #7dd3fc;

  /* Secondary */
  --gl-secondary: #674bb5;
  --gl-secondary-container: #ab8ffe;

  /* Text */
  --gl-on-surface: #0b1c30;
  --gl-on-surface-variant: #3f484e;

  /* Glass */
  --gl-blur-card: 16px;
  --gl-blur-modal: 32px;
  --gl-border-glass: rgba(255, 255, 255, 0.2);
  --gl-border-glass-admin: rgba(255, 255, 255, 0.4);

  /* Radius */
  --gl-radius-btn: 0.5rem;
  --gl-radius-card: 1rem;
  --gl-radius-pill: 9999px;

  /* Spacing */
  --gl-unit: 8px;
  --gl-gap: 16px;

  /* === GLACIER ADMIN === */
  --gla-primary: #005d90;
  --gla-primary-container: #0077b6;
  --gla-secondary: #2a6671;
  --gla-surface: #f7f9fb;
  --gla-on-surface: #191c1e;
  --gla-radius-default: 0.25rem;
  --gla-radius-btn: 0.5rem;
  --gla-sidebar-width: 260px;
  --gla-topbar-height: 64px;
  --gla-stack-dense: 4px;
  --gla-stack-compact: 8px;

  /* Semantic */
  --gl-error: #ba1a1a;
  --gl-error-container: #ffdad6;
}
```

---

## 12. PLAN DE IMPLEMENTACIÓN

### 12.1 FASE 1 — Design Tokens (CSS Custom Properties)

**Archivo:** `src/styles/tokens.css`

- [ ] Crear `:root` con todos los tokens públicos (Glacier)
- [ ] Crear `[data-theme="admin"]` con tokens admin (Glacier Admin)
- [ ] Definir variables de glassmorphism (blurs, opacidades, bordes)
- [ ] Definir escala tipográfica completa (Manrope + Inter + JetBrains Mono + Hanken Grotesk)
- [ ] Definir escala de espaciado (4px y 8px baselines)
- [ ] Importar Google Fonts / self-host las 4 fuentes

### 12.2 FASE 2 — Layouts React

| Layout | Ruta | Componente | Design System |
|--------|------|------------|---------------|
| `PublicLayout` | `/`, `/catalogo`, `/reserva`, `/ubicacion`, `/equipo`, `/galeria` | `src/layouts/PublicLayout.tsx` | Glacier |
| `AdminLayout` | `/backoffice/*` | `src/layouts/AdminLayout.tsx` | Glacier Admin |

#### PublicLayout
- Fluid grid 12 columnas
- Container padding: 40px desktop / 20px mobile
- Nav: Side nav glass (80% blur) para admin o Bottom nav para staff
- Fondo gradiente Ice Blue → White

#### AdminLayout
- SideNavBar 260px fijo (glass panel, "Active State Glow")
- TopAppBar 64px fijo (breadcrumbs + search + perfil)
- Main content: fluido 12 columnas
- Spacing baseline 4px
- Fondo gradiente neutral → warm white

### 12.3 FASE 3 — Componentes Glass Base

| Componente | Archivo | Prioridad |
|------------|---------|-----------|
| `GlassCard` | `src/components/ui/GlassCard.tsx` | ALTA |
| `GlassModal` | `src/components/ui/GlassModal.tsx` | ALTA |
| `GlassInput` | `src/components/ui/GlassInput.tsx` | ALTA |
| `GlassButton` | `src/components/ui/GlassButton.tsx` | ALTA |
| `GlassDivider` | `src/components/ui/GlassDivider.tsx` | MEDIA |

#### GlassCard
```tsx
// Props: variant ('public' | 'admin'), blur, opacity, padding
// Public: bg rgba(255,255,255,0.6), blur 16px, border 1px white 20%, radius 1rem, padding 24px
// Admin: bg rgba(255,255,255,0.7), blur 20px, border 1px white 40%, radius 0.25rem
```

#### GlassModal
```tsx
// Props: isOpen, onClose, variant
// Public: bg rgba(255,255,255,0.8), blur 32px, ambient glow Ice Blue 10%
// Admin: bg rgba(255,255,255,0.85), blur 32px+, ambient glow blue-tinted 10%
```

#### GlassInput
```tsx
// Props: variant, placeholder
// Public: bg 40% white, focus: 2px Ice Blue + glow 4px
// Admin: Glass-Inlay con inset shadows
```

#### GlassButton
```tsx
// Props: variant ('primary' | 'ghost' | 'outline-glass'), size
// Public primary: sólido #7dd3fc + gradiente, texto blanco
// Public ghost: transparente + border glass, texto primary
// Admin primary: sólido #005d90
// Admin secondary: Outline-Glass
```

### 12.4 FASE 4 — Componentes Admin Específicos

| Componente | Archivo | Prioridad |
|------------|---------|-----------|
| `SideNavBar` | `src/components/admin/SideNavBar.tsx` | ALTA |
| `TopAppBar` | `src/components/admin/TopAppBar.tsx` | ALTA |
| `DataTable` | `src/components/admin/DataTable.tsx` | ALTA |
| `StatusBadge` | `src/components/admin/StatusBadge.tsx` | MEDIA |
| `Breadcrumbs` | `src/components/admin/Breadcrumbs.tsx` | MEDIA |
| `ActiveGlowIndicator` | `src/components/admin/ActiveGlowIndicator.tsx` | BAJA |

#### DataTable (crítico)
- Zebra-Glass: filas pares con 5% tint primary
- Headers: `label-xs` (JetBrains Mono 10px, bold)
- Bordes sutiles sin ruido visual
- Paginación glass

#### SideNavBar
- 260px ancho fijo
- Panel glass
- "Active State Glow": barra vertical primary en borde leading
- Iconos outlined thin (1.5pt)

#### StatusBadge
- Pill-shape (full radius)
- Fondos tint claro semánticos
- Colores: Emerald (success), Amber (warning), Rose (error)

### 12.5 FASE 5 — Páginas por ruta

| Ruta | Página | Componentes necesarios | Stitch ref |
|------|--------|----------------------|------------|
| `/` | `LandingPage` | GlassCard, GlassButton | glacier |
| `/catalogo` | `CatalogPage` | GlassCard, filtros glass | tienda_boutique_completa_glacier |
| `/reserva` | `ReservaPage` | GlassModal, stepper, GlassInput, GlassButton | reserva_de_cita_modal_glacier_1, _2 |
| `/ubicacion` | `UbicacionPage` | GlassCard, mapa | nuestras_sucursales_glacier |
| `/equipo` | `EquipoPage` | GlassCard, avatar pills | nuestro_equipo_elite_glacier |
| `/galeria` | `GaleriaPage` | GlassCard, grid, lightbox glass | galer_a_de_transformaciones_glacier |
| `/backoffice` | `DashboardPage` | AdminLayout, GlassCard, DataTable, StatusBadge | glacier_admin, glacier_management_dashboard_desktop |
| `/backoffice/agenda` | `AgendaPage` | Calendar glass, GlassModal (nueva cita) | agenda_operativa_de_citas_staff_view, nueva_cita_modal_administrativo |
| `/backoffice/clientes` | `ClientesPage` | DataTable, GlassInput (búsqueda), StatusBadge | gesti_n_de_clientes_glacier_admin |
| `/backoffice/servicios` | `ServiciosPage` | DataTable, GlassCard, GlassInput | control_de_inventario_glacier_admin |
| `/backoffice/staff` | `StaffPage` | DataTable, GlassCard | gesti_n_de_staff_glacier_admin |

### 12.6 FASE 6 — Reemplazo de componentes existentes

Para cada ruta del proyecto actual, identificar componentes que deban migrarse al design system Glacier:

1. **Mapear** componentes actuales → componentes Glass equivalentes
2. **Reemplazar** colores hardcodeados por tokens CSS
3. **Migrar** tipografía a Manrope/Inter/Hanken Grotesk + JetBrains Mono
4. **Aplicar** glassmorphism (backdrop-filter, bordes semi-transparentes)
5. **Ajustar** espaciado a 8px (público) o 4px (admin) baseline
6. **Unificar** radios: 8px botones, 16px cards (público) / 4px default, 8px botones (admin)

---

## 13. NOTAS Y OBSERVACIONES

1. **Sin dark mode definido:** Ambos DESIGN.md describen exclusivamente modos claros con glassmorphism. Si se requiere dark mode, habrá que diseñarlo desde cero manteniendo la filosofía glass.

2. **Glassmorphism y accesibilidad:** Las superficies translúcidas requieren cuidado con ratios de contraste. Se recomienda validar WCAG AA en todos los glass components, especialmente modales y cards con texto sobre fondos potencialmente complejos.

3. **Soporte de navegadores:** `backdrop-filter` tiene soporte amplio (95%+), pero en navegadores antiguos se debe proveer un fallback sólido (usar `@supports`).

4. **Fuentes:** Se requieren 4 familias tipográficas. Considerar self-hosting para performance o carga selectiva (Inter y Manrope siempre, Hanken Grotesk solo en admin, JetBrains Mono bajo demanda).

5. **Portal híbrido:** La carpeta `portal_h_brido_boutique_showcase` no tiene DESIGN.md propio ni code.html, solo una captura. Podría representar un showcase/marketing auxiliar.

6. **Reserva en dos pasos:** Las referencias `reserva_de_cita_modal_glacier_1` y `_2` sugieren un flow de booking en múltiples pasos (selección de servicio → confirmación de horario), implementable como stepper dentro de un GlassModal.

---

*Documento generado a partir de los DESIGN.md de Stitch Glacier y Glacier Admin. Última actualización: 2026-06-15.*

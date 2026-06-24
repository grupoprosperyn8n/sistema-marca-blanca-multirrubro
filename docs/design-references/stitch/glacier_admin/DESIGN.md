---
name: Glacier Admin
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#404850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707881'
  outline-variant: '#bfc7d1'
  surface-tint: '#006399'
  primary: '#005d90'
  on-primary: '#ffffff'
  primary-container: '#0077b6'
  on-primary-container: '#f3f7ff'
  inverse-primary: '#94ccff'
  secondary: '#2a6671'
  on-secondary: '#ffffff'
  secondary-container: '#aee9f5'
  on-secondary-container: '#2f6b75'
  tertiary: '#006272'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d90'
  on-tertiary-container: '#ebfaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#94ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004b74'
  secondary-fixed: '#b1ecf8'
  secondary-fixed-dim: '#95d0dc'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#054e58'
  tertiary-fixed: '#a7edff'
  tertiary-fixed-dim: '#58d6f1'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e5b'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-sm:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  topbar-height: 64px
  gutter: 16px
  margin-page: 24px
  stack-compact: 8px
  stack-dense: 4px
---

## Brand & Style
The design system is a productivity-focused extension of the core Glacier aesthetic. It translates the ethereal, glassmorphic qualities of the consumer brand into a professional, high-performance environment for administrators and staff. The objective is to provide a "serene workspace"—reducing cognitive load through visual clarity, airy spacing, and a disciplined application of translucent layers.

The style is **Professional Glassmorphism**. It utilizes frosted glass surfaces (back-drop blurs) to maintain a sense of depth and premium quality, but anchors them with crisp, high-contrast borders and structured layouts to ensure functional reliability. The emotional response is one of calm efficiency and absolute control.

## Colors
The palette is rooted in "Glacier Blue," optimized for long-term legibility. 
- **Primary:** A deep, authoritative ice-blue used for interactive elements and primary actions.
- **Secondary/Tertiary:** Lighter washes of cyan and azure used for selection states and subtle accents.
- **Neutral:** A range of cool grays starting from a near-white slate to ensure the interface feels expansive and clean.
- **Status Colors:** High-contrast emerald, amber, and rose are used strictly for semantic signaling (Success, Warning, Error), ensuring they pop against the cool-toned background without breaking the icy aesthetic.
- **Surfaces:** All containers utilize a semi-transparent white with a high saturation backdrop-blur (20px+) to emulate frosted ice.

## Typography
This design system prioritizes information density. 
- **Headlines:** Use **Hanken Grotesk** for a sharp, contemporary, and professional look. 
- **Body:** Use **Inter** for its exceptional readability in data-heavy environments. The base size is reduced to 14px to allow for more content on screen without sacrificing legibility.
- **Technical Data:** **JetBrains Mono** is employed for IDs, status badges, and tabular numerals, providing a precise, "developer-grade" feel to administrative tasks.

## Layout & Spacing
The layout follows a **Rigid Administrative Grid**. 
- **SideNavBar:** A fixed-width (260px) vertical navigation on the left, utilizing a frosted glass pane to separate system-wide navigation from content.
- **TopAppBar:** A 64px high utility bar for breadcrumbs, global search, and user profile, also semi-transparent.
- **Main Content:** A fluid area that reflows based on screen width, utilizing a 12-column grid. 
- **Density:** Spacing is tightened (using a 4px baseline) to ensure dashboard widgets and data tables display maximum information with minimal scrolling.

## Elevation & Depth
Depth is created through **Refractive Layering** rather than traditional shadows.
- **Level 0 (Background):** A subtle linear gradient of `neutral_color_hex` to a slightly warmer white.
- **Level 1 (Cards/Panels):** Frosted glass panels with a 1px solid white border at 40% opacity (inner glow effect).
- **Level 2 (Popovers/Modals):** Increased backdrop-blur and a subtle ambient shadow (Blue-tinted, 10% opacity) to provide separation during focus-heavy tasks.
- **Dividers:** Use `border_subtle` to define structure without creating visual noise.

## Shapes
The shape language is **Soft-Geometric**. 
- Standard components use a 0.25rem (4px) radius to maintain a crisp, professional edge that feels organized.
- Buttons and interactive inputs use a slightly more generous 0.5rem (8px) radius to differentiate them from static containers and improve touch/click targets.
- Status badges use a full pill-shape (circular ends) to distinguish them from functional buttons.

## Components
- **Data Tables:** The core of the system. Use a "Zebra-Glass" effect where even rows have a 5% primary color tint. Headers use `label-xs` in bold.
- **SideNavBar:** Features "Active State Glow"—a vertical bar of `primary_color_hex` on the leading edge with a soft inner glow for the active item.
- **Status Badges:** Compact pill shapes using light background tints of the semantic colors with high-contrast text.
- **Input Groups:** Fields utilize a "Glass-Inlay" style—inset shadows and semi-transparent backgrounds that clarify when an element is editable.
- **Action Buttons:** Primary buttons use a solid `primary_color_hex` to stand out against the glass UI. Secondary buttons use an "Outline-Glass" style.
- **Breadcrumbs:** Minimalist text links using `body-sm` to ensure the user always has a clear path back through deep hierarchies.
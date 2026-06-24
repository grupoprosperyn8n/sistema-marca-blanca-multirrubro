---
name: Glacier
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f484e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f787e'
  outline-variant: '#bec8ce'
  surface-tint: '#006686'
  primary: '#006686'
  on-primary: '#ffffff'
  primary-container: '#7dd3fc'
  on-primary-container: '#005b78'
  inverse-primary: '#7bd1fa'
  secondary: '#674bb5'
  on-secondary: '#ffffff'
  secondary-container: '#ab8ffe'
  on-secondary-container: '#3f1e8c'
  tertiary: '#576065'
  on-tertiary: '#ffffff'
  tertiary-container: '#c1cad0'
  on-tertiary-container: '#4c555a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c0e8ff'
  primary-fixed-dim: '#7bd1fa'
  on-primary-fixed: '#001e2b'
  on-primary-fixed-variant: '#004d66'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#21005e'
  on-secondary-fixed-variant: '#4f319c'
  tertiary-fixed: '#dbe4ea'
  tertiary-fixed-dim: '#bfc8ce'
  on-tertiary-fixed: '#141d21'
  on-tertiary-fixed-variant: '#3f484d'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-desktop: 40px
  container-padding-mobile: 20px
  gutter: 24px
  surface-gap: 16px
---

## Brand & Style
The design system is engineered for a premium white-label SaaS platform serving the beauty and wellness industry. It evokes a sense of "ethereal precision"—combining the sterile reliability of high-end medical spas with the soft, inviting luxury of a boutique salon.

The visual direction utilizes a sophisticated **Glassmorphism** style. By employing translucent layers, multi-layered background blurs, and subtle prismatic highlights, the UI feels lightweight and breathable. This "frozen" aesthetic ensures that even data-heavy scheduling and inventory screens feel calm and uncluttered. The primary goal is to provide a neutral yet high-end canvas that allows salon branding to coexist within a polished, professional environment.

## Colors
The palette is centered around **Ice Blue (#7dd3fc)**, symbolizing clarity and hygiene. A secondary **Lilac (#a78bfa)** is introduced to add warmth and a touch of modern luxury, particularly for "premium" features or conversion points.

Because the system relies on glassmorphism, the "Color Mode" is a specialized light mode where surfaces are not solid white but varying degrees of translucency. 
- **Primary:** Actionable items and brand identity.
- **Secondary:** Accentuation for VIP services or highlights.
- **Surface Glass:** The base for all containers, requiring a background blur of 12px to 20px.
- **Border Glass:** A soft, semi-transparent white stroke used to define edges without adding visual weight.

## Typography
We utilize **Manrope** for its modern, balanced, and professional characteristics. Its geometric influence fits the clean "Glacier" aesthetic while remaining highly readable for appointment booking and service menus.

To contrast the organic nature of the beauty industry with the precision of SaaS, **JetBrains Mono** is used sparingly for technical labels, timestamps, and price points. This adds a "pro-tool" feel to the interface, signaling accuracy in scheduling and billing. All headings should feature slight negative letter-spacing to maintain a tight, editorial look.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous safe areas to preserve the "ethereal" feel. Elements should never feel cramped; negative space is treated as a premium design asset.

- **Desktop:** 12-column grid with 40px external margins.
- **Mobile:** 4-column grid with 20px external margins.
- **Rhythm:** An 8px linear scale governs all padding and margins. Vertical rhythm is strictly enforced to ensure that complex booking calendars remain legible. 

Components should use "Surface Gap" tokens (16px) to maintain a consistent airiness between glass cards and navigation elements.

## Elevation & Depth
Depth in this design system is achieved through **Backdrop Blurs** and **Tonal Layering** rather than traditional black shadows.

1.  **Level 0 (Base):** A soft gradient background (Ice Blue to White).
2.  **Level 1 (Cards):** Translucent white surface (60% opacity) with a 16px blur and a 1px solid white inner border (20% opacity).
3.  **Level 2 (Modals/Popovers):** Translucent white surface (80% opacity) with a 32px blur and a subtle "Ambient Glow"—a soft shadow tinted with the primary Ice Blue color at 10% opacity.
4.  **Interaction:** Elements should appear to "lift" by increasing the backdrop blur intensity and adding a secondary, thin white stroke to the top edge (simulating a light catch).

## Shapes
The shape language is **Rounded (0.5rem base)**. This provides a soft, approachable feel that aligns with the "wellness" aspect of the brand while maintaining the structural integrity required for a professional SaaS tool.

- **Standard Buttons & Inputs:** 8px (0.5rem).
- **Cards & Large Containers:** 16px (1rem).
- **Feedback Toasts & Avatars:** 24px+ (Full pill-shape).
- **Selection Indicators:** Use a subtle 4px radius to distinguish them from primary containers.

## Components

### Buttons
- **Primary:** Solid Ice Blue (#7dd3fc) with white text. High-gloss finish (subtle top-to-bottom linear gradient).
- **Ghost (Glass):** Transparent background with a 1px "Border Glass" stroke. Text in Primary color.
- **Interaction:** On hover, primary buttons should increase in saturation; ghost buttons should increase backdrop blur density.

### Inputs
- **Style:** Understated glass fields. 40% white opacity.
- **Focus State:** 2px solid Ice Blue border with a soft blue outer glow (4px spread).
- **Typography:** Placeholder text in neutral-400, user-input text in neutral-900.

### Role-Based Navigation
- **Owner/Admin:** Side navigation using a high-density glass panel (80% blur). Icons are outlined and thin (1.5pt).
- **Staff/Service Provider:** Bottom-focused navigation for mobile-first usage during service. Larger touch targets and simplified labels.
- **Navigation Indicators:** A vertical "ice-chip" (2px wide bar) to the left of active menu items.

### Cards
- Always feature a 1px semi-transparent white border.
- Headers within cards should be separated by a 1px glass divider.
- Content should have a minimum of 24px internal padding to maintain the "premium" feel.
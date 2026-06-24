/**
 * applyCssVariables.js — Aplica el tema resuelto como CSS custom properties en :root.
 *
 * Toma un objeto `BrandTheme` (ya resuelto por `resolveBrandConfig.js`)
 * y establece las variables CSS necesarias en el elemento `:root` del DOM.
 * Esto permite que todo el CSS de la aplicación — incluido Tailwind —
 * pueda referenciar los colores y estilos de marca dinámicamente.
 *
 * Uso típico (entry point del frontend):
 *   import resolveBrandConfig from './theme/resolveBrandConfig.js';
 *   import applyCssVariables from './theme/applyCssVariables.js';
 *   const theme = await resolveBrandConfig();
 *   applyCssVariables(theme);
 *
 * @module theme/applyCssVariables
 */

/**
 * Mapa de propiedad del tema → nombre de CSS custom property.
 * @type {Record<string, string>}
 */
const PROP_TO_CSS_VAR = {
  brandPrimary:         "--brand-primary",
  brandSecondary:       "--brand-secondary",
  brandAccent:          "--brand-accent",
  brandText:            "--brand-text",
  brandSurface:         "--brand-surface",
  brandName:            "--brand-name",      // expuesto como string (poco útil en CSS, pero disponible)
  brandCtaLabel:        "--brand-cta-label", // idem
  brandContactPhone:    "--brand-contact-phone",
  brandContactEmail:    "--brand-contact-email",
  brandContactWhatsapp: "--brand-contact-whatsapp",
  glassBlur:            "--glass-blur",
  glassOpacity:         "--glass-opacity",
  glassBorderColor:     "--glass-border-color",
  fontHeading:          "--font-heading",
  fontBody:             "--font-body",
};

// ── Propiedades que requieren formato url(...) ────────────────

/** @type {Array<[string, string]>} */
const URL_PROPS = [
  ["brandHeroImage", "--brand-hero-image"],
  ["brandBackgroundImage", "--brand-background-image"],
  ["brandLogo", "--brand-logo"],
];

/**
 * Aplica un tema resuelto como CSS custom properties en el :root del documento.
 *
 * - Las propiedades de color se establecen directamente (ej. `--brand-primary: var(--brand-primary)`)
 * - Las propiedades de imagen se envuelven en `url(...)` (ej. `--brand-logo: url(https://...)`)
 * - Las propiedades con valor `null` se eliminan (no se establecen)
 *
 * @param {import('./brandTheme.js').BrandTheme} theme - Tema resuelto (con fallbacks ya aplicados)
 */
function applyCssVariables(theme) {
  const root = document.documentElement;
  if (!root) {
    console.warn("[applyCssVariables] document.documentElement no disponible.");
    return;
  }

  // ── Variables simples (colores, textos, glass, tipografía) ──
  for (const [prop, varName] of Object.entries(PROP_TO_CSS_VAR)) {
    const value = theme[prop];
    if (value !== null && value !== undefined) {
      root.style.setProperty(varName, String(value));
    } else {
      root.style.removeProperty(varName);
    }
  }

  // ── Variables de imagen (envueltas en url()) ────────────────
  for (const [prop, varName] of URL_PROPS) {
    const value = theme[prop];
    if (value) {
      root.style.setProperty(varName, `url(${value})`);
    } else {
      root.style.removeProperty(varName);
    }
  }

  // ── Derivadas: glass background compuesto ──────────────────
  const blur = theme.glassBlur || "16px";
  const opacity = theme.glassOpacity || "0.6";
  const borderColor = theme.glassBorderColor || "rgba(255,255,255,0.2)";
  const surface = theme.brandSurface || "#f8f9ff";

  root.style.setProperty("--glass-background", `rgba(255,255,255,${opacity})`);
  root.style.setProperty("--glass-blur", blur);
  root.style.setProperty("--glass-border-color", borderColor);

  // Generar un color surface con opacidad para overlays glass
  root.style.setProperty("--glass-surface", hexToRgba(surface, parseFloat(opacity)));

  console.log("[applyCssVariables] Tema aplicado:", {
    primary: theme.brandPrimary,
    secondary: theme.brandSecondary,
    accent: theme.brandAccent,
    surface: theme.brandSurface,
    text: theme.brandText,
  });
}

/**
 * Convierte un color hexadecimal (#RRGGBB o #RGB) a rgba(r, g, b, alpha).
 *
 * @param {string} hex - Color en formato hexadecimal
 * @param {number} alpha - Canal alfa (0-1)
 * @returns {string} Color en formato rgba()
 */
function hexToRgba(hex, alpha = 1) {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default applyCssVariables;

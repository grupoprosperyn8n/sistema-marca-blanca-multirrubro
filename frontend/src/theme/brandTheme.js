/**
 * brandTheme.js — Tema por defecto (fallback) del sistema marca blanca.
 *
 * Paleta Glaciar pura (sin lilac, sin copper):
 *   - Primario: Azul glaciar profundo var(--brand-primary)
 *   - Secundario: Azul glaciar claro var(--brand-secondary)
 *   - Acento: Azul glaciar brillante var(--brand-accent)
 *   - Texto: Navy oscuro var(--brand-text)
 *   - Fondo: Hielo blanco #F8F9FF
 */

const brandTheme = {
  // ── Identidad ────────────────────────────────────────────
  brandName: "BellezaPro Demo",

  // ── Paleta de colores (Glaciar puro) ────────────────────
  brandPrimary: "var(--brand-primary)",
  brandSecondary: "var(--brand-secondary)",
  brandAccent: "var(--brand-accent)",
  brandText: "var(--brand-text)",
  brandSurface: "#F8F9FF",

  // ── Imágenes ─────────────────────────────────────────────
  brandHeroImage: null,
  brandBackgroundImage: null,
  brandLogo: null,

  // ── Textos públicos ──────────────────────────────────────
  brandCtaLabel: "Reservar turno",

  // ── Contacto ─────────────────────────────────────────────
  brandContactPhone: null,
  brandContactEmail: null,
  brandContactWhatsapp: null,

  // ── Glassmorphism ────────────────────────────────────────
  glassBlur: "16px",
  glassOpacity: "0.6",
  glassBorderColor: "rgba(255,255,255,0.2)",

  // ── Tipografía ───────────────────────────────────────────
  fontHeading: "Manrope",
  fontBody: "Manrope",
};

export default brandTheme;

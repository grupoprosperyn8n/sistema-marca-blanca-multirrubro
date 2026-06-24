import React, { createContext, useContext, useEffect, useState } from 'react';

const FALLBACK = {
  brandName: "BellezaPro Demo",
  brandLegalName: "BellezaPro",
  rubro: "Salón de Belleza",
  marcaId: "bellezapro-demo",
  brandPrimary: "var(--brand-primary)",
  brandSecondary: "var(--brand-secondary)",
  brandAccent: "var(--brand-accent)",
  brandText: "var(--brand-text)",
  brandSurface: "#F8F9FF",
  brandTextSecondary: "var(--brand-text-secondary)",
  fontHeading: "Manrope",
  fontBody: "Manrope",
  glassBlur: "16px",
  glassOpacity: "0.6",
  glassBorderColor: "rgba(255,255,255,0.2)",
  heroBadge: "Nuevo",
  heroTitle: "Belleza, bienestar y reservas simples en un solo lugar.",
  heroSubtitle: "{marca} te conecta con servicios profesionales de salón.",
  heroCtaPrimary: "Reservar turno",
  heroCtaPrimaryUrl: "/reserva",
  heroCtaSecondary: "Ver servicios",
  heroCtaSecondaryUrl: "/catalogo",
  bannerActive: false,
  bannerTitle: "",
  bannerMessage: "",
  bannerCtaText: "",
  bannerCtaUrl: "/catalogo",
  reservaTitulo: "Reservá tu Turno",
  reservaSubtitulo: "Seleccioná servicio, sucursal y horario",
  reservaTitle: "Reservá tu Turno",
  reservaSubtitle: "Seleccioná servicio, sucursal y horario",
  reservaRequiereLogin: true,
  catalogTitle: "Catálogo de Servicios",
  catalogSubtitle: "Conocé nuestros tratamientos profesionales",
  productsTitle: "Productos",
  productsSubtitle: "Productos profesionales seleccionados para el cuidado de tu belleza",
  sucursalesTitle: "Nuestras Sucursales",
  sucursalesSubtitle: "Elegí la sucursal más cercana para tu próxima visita",
  reservaSinHorarios: "Próximamente publicaremos nuevos horarios.",
  reservaDemo: "Para confirmar tu turno necesitás ingresar o registrarte",
  reservaCtaText: "Ingresá para confirmar tu turno",
  phone: "",
  email: "",
  whatsapp: "",
  address: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  googleMaps: "",
  seccionesVisibles: {
    mostrar_servicios: true,
    mostrar_productos: true,
    mostrar_sucursales: true,
    mostrar_como_funciona: true,
  },
  seoTitle: "BellezaPro Demo",
  seoDescription: "Reservá turnos de belleza online.",
  legalAviso: "Sistema de demostración. No se realizan reservas reales.",
  privacyUrl: "/privacidad",
  termsUrl: "/terminos",
  versionConfig: "",
  registroActivo: true,
};

function normalizeHex(raw) {
  if (!raw) return null;
  const s = String(raw).trim().replace("#", "");
  if (/^[0-9a-fA-F]{3,8}$/.test(s)) return "#" + s;
  return null;
}

function normalizeText(raw) {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

function normalizeBool(raw) {
  if (raw === true || raw === "true" || raw === "True" || raw === 1) return true;
  if (raw === false || raw === "false" || raw === "False" || raw === 0) return false;
  return Boolean(raw);
}

function resolvePlaceholders(text, config) {
  if (!text) return "";
  let resolved = text;
  if (resolved.includes("{marca}") && config.brandName) {
    resolved = resolved.replace(/\{marca\}/g, config.brandName);
  }
  return resolved;
}

function hexToRgba(hex, alpha = 1) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyCssVariables(config) {
  const root = document.documentElement;
  if (!root) return;
  const colorVars = {
    "--brand-primary": config.brandPrimary,
    "--brand-secondary": config.brandSecondary,
    "--brand-accent": config.brandAccent,
    "--brand-text": config.brandText,
    "--brand-surface": config.brandSurface,
    "--brand-text-secondary": config.brandTextSecondary,
  };
  for (const [varName, value] of Object.entries(colorVars)) {
    if (value) root.style.setProperty(varName, value);
    else root.style.removeProperty(varName);
  }
  if (config.fontHeading) root.style.setProperty("--font-heading", config.fontHeading);
  if (config.fontBody) root.style.setProperty("--font-body", config.fontBody);
  root.style.setProperty("--glass-blur", config.glassBlur);
  root.style.setProperty("--glass-opacity", config.glassOpacity);
  root.style.setProperty("--glass-border-color", config.glassBorderColor);
  root.style.setProperty("--glass-background", `rgba(255,255,255,${config.glassOpacity})`);
  root.style.setProperty("--glass-surface", hexToRgba(config.brandSurface, parseFloat(config.glassOpacity) || 0.6));
  root.style.setProperty("--brand-name", `"${config.brandName}"`);
}

function transformMarcaBlanca(data, base = FALLBACK) {
  if (!data || typeof data !== "object" || data.error) return base;
  const colores = data.colores || {};
  const textos = data.textos_publicos || {};
  const secciones = data.secciones_visibles || {};
  const config = {
    brandName: normalizeText(data.nombre_sistema) || base.brandName,
    brandLegalName: normalizeText(data.nombre_negocio) || normalizeText(data.nombre_sistema) || base.brandLegalName,
    rubro: normalizeText(data.rubro) || base.rubro,
    marcaId: normalizeText(data.marca_id) || base.marcaId,
    brandPrimary: normalizeHex(colores.primario) || base.brandPrimary,
    brandSecondary: normalizeHex(colores.secundario) || base.brandSecondary,
    brandAccent: normalizeHex(colores.acento) || base.brandAccent,
    brandText: normalizeHex(colores.texto) || base.brandText,
    brandSurface: normalizeHex(colores.fondo) || base.brandSurface,
    brandTextSecondary: normalizeHex(colores.texto_secundario) || base.brandTextSecondary,
    fontHeading: normalizeText(colores.tipografia_titulos) || base.fontHeading,
    fontBody: normalizeText(colores.tipografia_cuerpo) || base.fontBody,
    glassBlur: normalizeText(data.glass_blur) || base.glassBlur,
    glassOpacity: normalizeText(data.glass_opacity) || base.glassOpacity,
    glassBorderColor: normalizeText(data.glass_border_color) || base.glassBorderColor,
    heroBadge: normalizeText(textos.hero_badge) || base.heroBadge,
    heroTitle: normalizeText(textos.hero_titulo) || base.heroTitle,
    heroSubtitle: normalizeText(textos.hero_subtitulo) || base.heroSubtitle,
    heroCtaPrimary: normalizeText(textos.hero_cta_primario) || base.heroCtaPrimary,
    heroCtaPrimaryUrl: normalizeText(textos.hero_cta_primario_url) || base.heroCtaPrimaryUrl,
    heroCtaSecondary: normalizeText(textos.hero_cta_secundario) || base.heroCtaSecondary,
    heroCtaSecondaryUrl: normalizeText(textos.hero_cta_secundario_url) || base.heroCtaSecondaryUrl,
    bannerActive: normalizeBool(textos.banner_activo),
    bannerTitle: normalizeText(textos.banner_titulo) || base.bannerTitle,
    bannerMessage: normalizeText(textos.banner_mensaje) || base.bannerMessage,
    bannerCtaText: normalizeText(textos.banner_cta_texto) || base.bannerCtaText,
    bannerCtaUrl: normalizeText(textos.banner_cta_url) || base.bannerCtaUrl,
    reservaTitulo: normalizeText(textos.reserva_titulo) || base.reservaTitulo,
    reservaSubtitulo: normalizeText(textos.reserva_subtitulo) || base.reservaSubtitulo,
    reservaTitle: normalizeText(textos.reserva_titulo) || base.reservaTitle,
    reservaSubtitle: normalizeText(textos.reserva_subtitulo) || base.reservaSubtitle,
    reservaRequiereLogin: normalizeBool(textos.reserva_requiere_login),
    catalogTitle: normalizeText(textos.catalogo_titulo) || base.catalogTitle,
    catalogSubtitle: normalizeText(textos.catalogo_subtitulo) || base.catalogSubtitle,
    productsTitle: normalizeText(textos.productos_titulo) || base.productsTitle,
    productsSubtitle: normalizeText(textos.productos_subtitulo) || base.productsSubtitle,
    sucursalesTitle: normalizeText(textos.sucursales_titulo) || base.sucursalesTitle,
    sucursalesSubtitle: normalizeText(textos.sucursales_subtitulo) || base.sucursalesSubtitle,
    reservaSinHorarios: normalizeText(textos.reserva_sin_horarios) || base.reservaSinHorarios,
    reservaDemo: normalizeText(textos.reserva_demo) || base.reservaDemo,
    reservaCtaText: normalizeText(textos.reserva_cta_texto) || base.reservaCtaText,
    phone: normalizeText(textos.contacto_telefono) || base.phone,
    email: normalizeText(textos.contacto_email) || base.email,
    whatsapp: normalizeText(textos.contacto_whatsapp) || base.whatsapp,
    address: normalizeText(textos.contacto_direccion) || base.address,
    instagram: normalizeText(textos.redes_instagram) || base.instagram,
    facebook: normalizeText(textos.redes_facebook) || base.facebook,
    tiktok: normalizeText(textos.redes_tiktok) || base.tiktok,
    googleMaps: normalizeText(textos.redes_maps) || base.googleMaps,
    seccionesVisibles: {
      mostrar_servicios: normalizeBool(secciones.mostrar_servicios),
      mostrar_productos: normalizeBool(secciones.mostrar_productos),
      mostrar_sucursales: normalizeBool(secciones.mostrar_sucursales),
      mostrar_como_funciona: normalizeBool(secciones.mostrar_como_funciona),
      orden_secciones: normalizeText(secciones.orden_secciones) || "hero,servicios,como_funciona,productos,visitanos,cta_final",
    },
    seoTitle: normalizeText(data.seo_title) || base.seoTitle,
    seoDescription: normalizeText(data.seo_description) || base.seoDescription,
    legalAviso: normalizeText(data.legal_aviso) || base.legalAviso,
    privacyUrl: normalizeText(data.privacy_url) || base.privacyUrl,
    termsUrl: normalizeText(data.terms_url) || base.termsUrl,
    versionConfig: normalizeText(data.version_config) || base.versionConfig,
    registroActivo: data.registro_activo !== undefined && data.registro_activo !== null ? normalizeBool(data.registro_activo) : base.registroActivo,
  };

  // Resolve {marca} placeholders in all text fields
  const textFields = ['heroTitle','heroSubtitle','heroCtaPrimary','heroCtaSecondary',
    'bannerTitle','bannerMessage','bannerCtaText',
    'reservaTitulo','reservaSubtitulo','reservaTitle','reservaSubtitle',
    'reservaDemo','reservaCtaText','reservaSinHorarios',
    'catalogTitle','catalogSubtitle','productsTitle','productsSubtitle',
    'sucursalesTitle','sucursalesSubtitle','legalAviso','seoTitle','seoDescription'];
  for (const f of textFields) {
    if (config[f]) config[f] = resolvePlaceholders(config[f], config);
  }
  return config;
}

const BrandConfigContext = createContext(null);

export function BrandConfigProvider({ children }) {
  const [config, setConfig] = useState(() => FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const API = import.meta.env.VITE_API_BASE_URL || "";
    async function fetchAndApply() {
      try {
        const res = await fetch(`${API}/api/marca-blanca`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const transformed = transformMarcaBlanca(data);
        applyCssVariables(transformed);
        setConfig(transformed);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.warn("[BrandConfig] Error cargando /api/marca-blanca:", err.message);
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAndApply();
    return () => { cancelled = true; };
  }, []);

  return React.createElement(
    BrandConfigContext.Provider,
    { value: { config, loading, error } },
    children
  );
}

export function useBrandConfig() {
  const ctx = useContext(BrandConfigContext);
  if (!ctx) {
    return { config: FALLBACK, loading: false, error: null };
  }
  return ctx;
}

export default BrandConfigContext;

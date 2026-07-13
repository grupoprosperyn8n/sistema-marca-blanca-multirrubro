import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  applyPreviewToMarcaData,
  isLandingPreviewRuntime,
  readLandingPreviewPayload,
  subscribeLandingPreviewPayload,
} from '../utils/landingPreview';

const DEFAULT_BUSINESS = {
  contractVersion: "P0.1",
  offerMode: "PRODUCTOS_SERVICIOS",
  usesProducts: true,
  usesServices: true,
  usesAppointments: true,
  usesBranches: true,
  usesMultiBranch: true,
  operationChannel: "MIXTO",
  showContactAddress: true,
  showMap: false,
  usesCart: false,
  usesCheckout: false,
  usesOnlinePayments: false,
  usesPhysicalPOS: false,
  paymentGatewayStatus: "PENDIENTE",
  backgroundType: "SOLIDO",
  backgroundUrl: "",
  contrastTheme: "AUTO",
  catalogLabel: "Catálogo",
  primaryFlow: "RESERVA",
};

const FALLBACK = {
  brandName: "BellezaPro Demo",
  brandLegalName: "BellezaPro",
  rubro: "Salón de Belleza",
  marcaId: "bellezapro-demo",
  brandPrimary: "#7C3AED",
  brandSecondary: "#F0ABFC",
  brandAccent: "#EC4899",
  brandText: "#1F1235",
  brandSurface: "#F8F9FF",
  brandTextSecondary: "#6B4A7A",
  logoUrl: "",
  fontHeading: "Manrope",
  fontBody: "Manrope",
  glassBlur: "16px",
  glassOpacity: "0.6",
  glassBorderColor: "rgba(255,255,255,0.2)",
  heroBadge: "Nuevo",
  heroTitle: "Belleza, bienestar y reservas simples en un solo lugar.",
  heroSubtitle: "BellezaPro Demo te conecta con servicios profesionales de salón.",
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
  business: DEFAULT_BUSINESS,
  seoTitle: "BellezaPro Demo",
  seoDescription: "Reservá turnos de belleza online.",
  canonicalDomain: "https://bellezapro-demo.surge.sh",
  commercialDomain: "https://bellezapro-demo.surge.sh",
  domainRole: "COMERCIAL_CANONICO",
  domainNotice: "Demo comercial principal",
  legalAviso: "Sistema de demostración. No se realizan reservas reales.",
  privacyUrl: "/privacidad",
  termsUrl: "/terminos",
  versionConfig: "",
  registroActivo: true,
};

const DOMAIN_VARIANTS = {
  "bellezapro-demo.surge.sh": {
    brandName: "BellezaPro",
    brandLegalName: "BellezaPro",
    rubro: "Beauty Pro",
    marcaId: "bellezapro-demo",
    brandPrimary: "#7C3AED",
    brandSecondary: "#F0ABFC",
    brandAccent: "#EC4899",
    brandText: "#1F1235",
    brandSurface: "#FDF4FF",
    brandTextSecondary: "#6B4A7A",
    heroBadge: "Variante Pro",
    heroTitle: "Una experiencia premium para salones modernos.",
    heroSubtitle: "Turnos online, portal cliente y operación diaria con estética de marca profesional.",
    heroCtaPrimary: "Agendar experiencia",
    heroCtaSecondary: "Explorar servicios",
    catalogTitle: "Servicios Pro",
    catalogSubtitle: "Tratamientos destacados para una experiencia premium.",
    productsTitle: "Productos Pro",
    productsSubtitle: "Selección profesional para cuidado y venta complementaria.",
    business: {
      offerMode: "PRODUCTOS_SERVICIOS",
      catalogLabel: "Servicios Pro",
      primaryFlow: "RESERVA",
    },
    seoTitle: "BellezaPro Demo",
    seoDescription: "Variante Pro de la demo de salones de belleza.",
    canonicalDomain: "https://bellezapro-demo.surge.sh",
    domainRole: "COMERCIAL_CANONICO",
    domainNotice: "Dominio comercial único de la demo BellezaPro.",
    legalAviso: "Demo comercial. No se procesan reservas reales.",
  },
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

function normalizeBool(raw, defaultValue = false) {
  if (raw === null || raw === undefined || raw === "") return defaultValue;
  if (raw === true || raw === "true" || raw === "True" || raw === 1) return true;
  if (raw === false || raw === "false" || raw === "False" || raw === 0) return false;
  const text = String(raw).trim().toLowerCase();
  if (["1", "si", "sí", "yes", "activo", "activa", "habilitado", "habilitada"].includes(text)) return true;
  if (["0", "no", "inactivo", "inactiva", "deshabilitado", "deshabilitada"].includes(text)) return false;
  return defaultValue;
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

function cssUrl(raw) {
  return String(raw || "").replace(/["\\\n\r]/g, "").trim();
}

function isVideoUrl(raw) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(raw || ""));
}

const loadedBrandFonts = new Set();

function loadBrandFont(raw) {
  if (typeof document === "undefined") return;
  const family = String(raw || "")
    .split(",")[0]
    .replace(/['"]/g, "")
    .trim();
  if (!family || loadedBrandFonts.has(family)) return;
  if (!/^[a-zA-Z0-9\s-]+$/.test(family)) return;
  const localFonts = new Set(["serif", "sans-serif", "monospace", "system-ui", "inherit", "initial"]);
  if (localFonts.has(family.toLowerCase())) return;
  const id = `brand-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) {
    loadedBrandFonts.add(family);
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
  loadedBrandFonts.add(family);
}

function getDomainVariant() {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.replace(/^www\./, "");
  return DOMAIN_VARIANTS[hostname] || null;
}

function applyDomainVariant(config) {
  const variant = getDomainVariant();
  if (!variant) return config;
  return {
    ...config,
    ...variant,
    seccionesVisibles: {
      ...(config.seccionesVisibles || {}),
      ...(variant.seccionesVisibles || {}),
    },
    business: {
      ...(config.business || DEFAULT_BUSINESS),
      ...(variant.business || {}),
    },
  };
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
  if (config.fontHeading) {
    loadBrandFont(config.fontHeading);
    root.style.setProperty("--font-heading", config.fontHeading);
  }
  if (config.fontBody) {
    loadBrandFont(config.fontBody);
    root.style.setProperty("--font-body", config.fontBody);
  }
  const backgroundUrl = cssUrl(config.business?.backgroundUrl || config.heroImageUrl);
  if (backgroundUrl && config.business?.backgroundType === "IMAGEN" && !isVideoUrl(backgroundUrl)) {
    root.style.setProperty(
      "--brand-page-background",
      `linear-gradient(135deg, rgba(248,249,255,0.84) 0%, rgba(255,255,255,0.72) 100%), url("${backgroundUrl}")`
    );
  } else {
    root.style.setProperty("--brand-page-background", `linear-gradient(135deg, ${config.brandSurface || "#eff4ff"} 0%, #ffffff 100%)`);
  }
  root.style.setProperty("--glass-blur", config.glassBlur);
  root.style.setProperty("--glass-opacity", config.glassOpacity);
  root.style.setProperty("--glass-border-color", config.glassBorderColor);
  root.style.setProperty("--glass-background", `rgba(255,255,255,${config.glassOpacity})`);
  root.style.setProperty("--glass-surface", hexToRgba(config.brandSurface, parseFloat(config.glassOpacity) || 0.6));
  root.style.setProperty("--brand-name", `"${config.brandName}"`);
  if (config.seoTitle) document.title = config.seoTitle;
  if (config.seoDescription) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", config.seoDescription);
  }
  if (config.brandSurface) {
    let theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement("meta");
      theme.setAttribute("name", "theme-color");
      document.head.appendChild(theme);
    }
    theme.setAttribute("content", config.brandSurface);
  }
  if (config.canonicalDomain) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const path = window.location.pathname === "/" ? "/" : window.location.pathname;
    canonical.setAttribute("href", `${String(config.canonicalDomain).replace(/\/$/, "")}${path}`);
  }
}

function deriveOfferMode(usesProducts, usesServices) {
  if (usesProducts && usesServices) return "PRODUCTOS_SERVICIOS";
  if (usesProducts) return "SOLO_PRODUCTOS";
  if (usesServices) return "SOLO_SERVICIOS";
  return "SIN_CATALOGO";
}

function normalizeMode(raw, fallback) {
  const value = normalizeText(raw);
  return value ? value.toUpperCase().replaceAll("-", "_").replaceAll(" ", "_") : fallback;
}

function normalizeBusiness(raw = {}, base = DEFAULT_BUSINESS, secciones = {}) {
  const usesProducts = normalizeBool(raw.usa_productos, normalizeBool(secciones.mostrar_productos, base.usesProducts));
  const usesServices = normalizeBool(raw.usa_servicios, normalizeBool(secciones.mostrar_servicios, base.usesServices));
  const usesAppointments = normalizeBool(raw.usa_turnos, base.usesAppointments);
  const usesBranches = normalizeBool(raw.usa_sucursales, normalizeBool(secciones.mostrar_sucursales, base.usesBranches));
  const offerMode = normalizeMode(raw.modo_oferta, deriveOfferMode(usesProducts, usesServices));
  const primaryFlow = normalizeMode(raw.primary_flow, usesAppointments ? "RESERVA" : "CATALOGO");
  const catalogLabel = normalizeText(raw.catalog_label) ||
    (offerMode === "SOLO_PRODUCTOS" ? "Productos" : offerMode === "SOLO_SERVICIOS" ? "Servicios" : base.catalogLabel);

  return {
    contractVersion: normalizeText(raw.contract_version) || base.contractVersion,
    offerMode,
    usesProducts,
    usesServices,
    usesAppointments,
    usesBranches,
    usesMultiBranch: normalizeBool(raw.usa_multi_sucursal, usesBranches),
    operationChannel: normalizeMode(raw.canal_operacion, base.operationChannel),
    showContactAddress: normalizeBool(raw.mostrar_direccion_contacto, base.showContactAddress),
    showMap: normalizeBool(raw.mostrar_mapa, base.showMap),
    usesCart: normalizeBool(raw.usa_carrito, base.usesCart),
    usesCheckout: normalizeBool(raw.usa_checkout, base.usesCheckout),
    usesOnlinePayments: normalizeBool(raw.usa_pago_online, base.usesOnlinePayments),
    usesPhysicalPOS: normalizeBool(raw.usa_caja_fisica, base.usesPhysicalPOS),
    paymentGatewayStatus: normalizeMode(raw.payment_gateway_status, base.paymentGatewayStatus),
    backgroundType: normalizeMode(raw.fondo_tipo, base.backgroundType),
    backgroundUrl: normalizeText(raw.fondo_url) || base.backgroundUrl,
    contrastTheme: normalizeMode(raw.contraste_tema, base.contrastTheme),
    catalogLabel,
    primaryFlow,
  };
}

function transformMarcaBlanca(data, base = FALLBACK) {
  if (!data || typeof data !== "object" || data.error) return base;
  const colores = data.colores || {};
  const textos = data.textos_publicos || {};
  const heroImageUrl = normalizeText(textos.hero_imagen_url) || normalizeText(data.business_config?.fondo_url) || base.heroImageUrl || "";
  const secciones = data.secciones_visibles || {};
  const seccionesVisibles = {
    mostrar_servicios: normalizeBool(secciones.mostrar_servicios, base.seccionesVisibles?.mostrar_servicios ?? true),
    mostrar_productos: normalizeBool(secciones.mostrar_productos, base.seccionesVisibles?.mostrar_productos ?? true),
    mostrar_sucursales: normalizeBool(secciones.mostrar_sucursales, base.seccionesVisibles?.mostrar_sucursales ?? true),
    mostrar_como_funciona: normalizeBool(secciones.mostrar_como_funciona, base.seccionesVisibles?.mostrar_como_funciona ?? true),
    orden_secciones: normalizeText(secciones.orden_secciones) || base.seccionesVisibles?.orden_secciones || "hero,servicios,como_funciona,productos,visitanos,cta_final",
  };
  const config = {
    brandName: normalizeText(data.nombre_sistema) || base.brandName,
    brandLegalName: normalizeText(data.nombre_negocio) || normalizeText(data.nombre_sistema) || base.brandLegalName,
    rubro: normalizeText(data.rubro) || base.rubro,
    marcaId: normalizeText(data.marca_id) || base.marcaId,
    logoUrl: normalizeText(data.logo) || base.logoUrl || "",
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
    heroImageUrl,
    bannerActive: normalizeBool(textos.banner_activo, base.bannerActive),
    bannerTitle: normalizeText(textos.banner_titulo) || base.bannerTitle,
    bannerMessage: normalizeText(textos.banner_mensaje) || base.bannerMessage,
    bannerCtaText: normalizeText(textos.banner_cta_texto) || base.bannerCtaText,
    bannerCtaUrl: normalizeText(textos.banner_cta_url) || base.bannerCtaUrl,
    reservaTitulo: normalizeText(textos.reserva_titulo) || base.reservaTitulo,
    reservaSubtitulo: normalizeText(textos.reserva_subtitulo) || base.reservaSubtitulo,
    reservaTitle: normalizeText(textos.reserva_titulo) || base.reservaTitle,
    reservaSubtitle: normalizeText(textos.reserva_subtitulo) || base.reservaSubtitle,
    reservaRequiereLogin: normalizeBool(textos.reserva_requiere_login, base.reservaRequiereLogin),
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
    seccionesVisibles,
    business: normalizeBusiness(data.business_config || {}, base.business || DEFAULT_BUSINESS, seccionesVisibles),
    seoTitle: normalizeText(data.seo_title) || base.seoTitle,
    seoDescription: normalizeText(data.seo_description) || base.seoDescription,
    canonicalDomain: base.canonicalDomain,
    technicalDomain: base.technicalDomain,
    commercialDomain: base.commercialDomain,
    domainRole: base.domainRole,
    domainNotice: base.domainNotice,
    legalAviso: normalizeText(data.legal_aviso) || base.legalAviso,
    privacyUrl: normalizeText(data.privacy_url) || base.privacyUrl,
    termsUrl: normalizeText(data.terms_url) || base.termsUrl,
    versionConfig: normalizeText(data.version_config) || base.versionConfig,
    registroActivo: data.registro_activo !== undefined && data.registro_activo !== null ? normalizeBool(data.registro_activo) : base.registroActivo,
  };

  if (heroImageUrl && config.business) {
    config.business = {
      ...config.business,
      backgroundUrl: config.business.backgroundUrl || heroImageUrl,
      backgroundType: config.business.backgroundType === "SOLIDO" ? "IMAGEN" : config.business.backgroundType,
    };
  }

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
  const [config, setConfig] = useState(() => applyDomainVariant(FALLBACK));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const rawMarcaRef = useRef(null);
  const location = useLocation();
  const API = import.meta.env.VITE_API_BASE_URL || "";

  function buildConfig(data, payload = readLandingPreviewPayload()) {
    const previewData = isLandingPreviewRuntime() ? applyPreviewToMarcaData(data, payload) : data;
    return applyDomainVariant(transformMarcaBlanca(previewData));
  }

  async function fetchBrandConfig() {
    const res = await fetch(`${API}/api/marca-blanca`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rawMarcaRef.current = data;
    return buildConfig(data);
  }

  async function refresh() {
    const transformed = await fetchBrandConfig();
    applyCssVariables(transformed);
    setConfig(transformed);
    setError(null);
    return transformed;
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchAndApply() {
      try {
        const transformed = await fetchBrandConfig();
        if (cancelled) return;
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

  useEffect(() => {
    if (!isLandingPreviewRuntime()) return undefined;
    return subscribeLandingPreviewPayload((payload) => {
      if (!rawMarcaRef.current) return;
      const transformed = buildConfig(rawMarcaRef.current, payload);
      applyCssVariables(transformed);
      setConfig(transformed);
      setError(null);
    });
  }, []);

  useEffect(() => {
    applyCssVariables(config);
  }, [config, location.pathname]);

  return React.createElement(
    BrandConfigContext.Provider,
    { value: { config, loading, error, refresh } },
    children
  );
}

export function useBrandConfig() {
  const ctx = useContext(BrandConfigContext);
  if (!ctx) {
    return { config: FALLBACK, loading: false, error: null, refresh: async () => FALLBACK };
  }
  return ctx;
}

export function getPublicNavigation(config = FALLBACK) {
  const business = config.business || DEFAULT_BUSINESS;
  const links = [{ to: '/', label: 'Inicio' }];

  if (business.usesServices && business.usesProducts) {
    links.push({ to: '/catalogo', label: business.catalogLabel || 'Catálogo' });
    links.push({ to: '/productos', label: 'Productos' });
  } else if (business.usesServices) {
    links.push({ to: '/catalogo', label: business.catalogLabel || 'Servicios' });
  } else if (business.usesProducts) {
    links.push({ to: '/productos', label: business.catalogLabel || 'Productos' });
  }

  if (business.usesServices) {
    links.push({ to: '/personal', label: 'Equipo' });
  }

  if (business.usesBranches || business.showContactAddress) {
    links.push({ to: '/sucursales', label: business.usesMultiBranch ? 'Sucursales' : 'Ubicación' });
  }

  if (business.usesAppointments) {
    links.push({ to: '/reserva', label: 'Reservar' });
  }

  return links;
}

export default BrandConfigContext;

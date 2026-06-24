/**
 * resolveBrandConfig.js — Resolución dinámica del tema de marca blanca.
 *
 * Realiza fetch al backend:
 *   1. GET /api/configuracion-publica  → tabla clave-valor (Airtable)
 *   2. GET /api/marca-blanca           → endpoint unificado de marca
 *
 * VALIDACIÓN DE COLORES: Solo se aceptan colores de la paleta glaciar
 * (azules, blancos, navy). Colores como dorado/marrón/púrpura se rechazan
 * y se usa el fallback hardcodeado.
 */

import brandTheme from "./brandTheme.js";

const FIELD_MAP = [
  [["NOMBRE_SISTEMA", "NOMBRE_NEGOCIO", "Nombre_Sistema", "Nombre_Negocio", "Name"], "brandName", "text"],
  [["COLOR_PRIMARIO", "Color_Primario", "COLOR_PRIMARY"], "brandPrimary", "color"],
  [["COLOR_SECUNDARIO", "Color_Secundario", "COLOR_SECONDARY"], "brandSecondary", "color"],
  [["COLOR_ACCENTO", "Color_Acento", "COLOR_ACCENT"], "brandAccent", "color"],
  [["COLOR_TEXTO", "Color_Texto", "COLOR_TEXT"], "brandText", "color"],
  [["COLOR_FONDO", "Color_Fondo", "COLOR_SURFACE"], "brandSurface", "color"],
  [["IMAGEN_HERO", "Imagen_Hero", "HERO_IMAGE"], "brandHeroImage", "image"],
  [["IMAGEN_FONDO", "Imagen_Fondo", "BACKGROUND_IMAGE"], "brandBackgroundImage", "image"],
  [["LOGO", "Logo"], "brandLogo", "image"],
  [["TEXTO_CTA", "Texto_CTA", "CTA_LABEL"], "brandCtaLabel", "text"],
  [["TELEFONO", "Telefono", "PHONE"], "brandContactPhone", "text"],
  [["EMAIL", "Email", "CORREO"], "brandContactEmail", "text"],
  [["WHATSAPP", "Whatsapp", "WhatsApp"], "brandContactWhatsapp", "text"],
  [["GLASS_BLUR", "Glass_Blur"], "glassBlur", "text"],
  [["GLASS_OPACITY", "Glass_Opacity"], "glassOpacity", "text"],
  [["GLASS_BORDER_COLOR", "Glass_Border_Color"], "glassBorderColor", "color"],
  [["FUENTE_HEADING", "Fuente_Heading", "FONT_HEADING"], "fontHeading", "text"],
  [["FUENTE_BODY", "Fuente_Body", "FONT_BODY"], "fontBody", "text"],
];

function normalizeText(raw) {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

function normalizeColor(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^[0-9a-fA-F]{3,8}$/.test(s)) return "#" + s;
  return null;
}

/**
 * Determina si un color hexadecimal pertenece a la paleta glaciar.
 * Glaciar = azules (var(--brand-primary), var(--brand-secondary), etc.), navy (var(--brand-text)), blancos/hielo (#F8F9FF, #FFFFFF).
 * Rechaza: dorados, marrones, púrpuras, rojos, verdes.
 */
function isGlacierHex(hex) {
  if (!hex || !hex.startsWith("#")) return false;
  const clean = hex.replace("#", "");
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  // Blancos / grises muy claros (surface)
  if (r >= 230 && g >= 230 && b >= 230) return true;

  // Navy / textos oscuros (var(--brand-text), #111827, #1E293B)
  if (r < 40 && g < 50 && b < 70) return true;

  // Azul glaciar: el azul debe ser el canal dominante
  // Aceptamos: b > r + 30 y b > g (azul domina sobre rojo y verde)
  // y g > r (verde > rojo = tonos cyan/teal/glaciar, no púrpuras)
  if (b > r + 30 && b >= g && g >= r) return true;

  // Cyan claro: b ≈ g > r
  if (Math.abs(b - g) < 40 && b > r + 50 && g > r + 50) return true;

  return false;
}

/**
 * Valida un color para uso como primario/secundario/accento.
 * Solo acepta colores glaciar.
 */
function validateGlacierColor(hex) {
  if (!hex) return null;
  // Must pass both format and palette validation
  const normalized = normalizeColor(hex);
  if (!normalized) return null;
  if (!isGlacierHex(normalized)) {
    console.warn("[resolveBrandConfig] Color rechazado (no glaciar):", normalized);
    return null;
  }
  return normalized;
}

function normalizeImage(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  try {
    new URL(s);
    return s;
  } catch {
    if (Array.isArray(raw) && raw.length > 0 && raw[0]?.url) return raw[0].url;
    if (typeof raw === "object" && raw !== null && raw.url) return raw.url;
    return s;
  }
}

const NORMALIZERS = {
  text: normalizeText,
  color: normalizeColor,
  image: normalizeImage,
};

function findFieldValue(records, keys) {
  for (const record of records) {
    const fields = record.fields || record;
    const clave = fields.CLAVE_CONFIGURACION || fields.Clave_Configuracion || fields.KEY;
    if (clave) {
      const claveUpper = String(clave).toUpperCase().replace(/\s+/g, "_");
      for (const k of keys) {
        if (claveUpper === k.toUpperCase().replace(/\s+/g, "_")) {
          return (
            fields.TEXTO_CONFIGURACION ??
            fields.COLOR_HEX_CONFIGURACION ??
            fields.VALOR_CONFIGURACION ??
            fields.VALUE ??
            fields.IMAGEN_CONFIGURACION ??
            fields[Object.keys(fields).find(f => f !== "CLAVE_CONFIGURACION" && f !== "KEY" && f !== "id" && f !== "createdTime")]
          );
        }
      }
    }
    for (const k of keys) {
      if (k in fields && fields[k] !== undefined && fields[k] !== null) {
        return fields[k];
      }
    }
  }
  return undefined;
}

function extractFromMarcaBlanca(marcaBlancaData) {
  const result = {};
  if (!marcaBlancaData || typeof marcaBlancaData !== "object") return result;

  result._brandName = marcaBlancaData.nombre_sistema || marcaBlancaData.nombre_negocio || null;

  const colores = marcaBlancaData.colores;
  if (colores) {
    let colorObj = colores;
    if (typeof colores === "string") {
      try { colorObj = JSON.parse(colores); } catch { colorObj = null; }
    }
    if (colorObj && typeof colorObj === "object") {
      result._brandPrimary = colorObj.primary || colorObj.primario || colorObj.brandPrimary || null;
      result._brandSecondary = colorObj.secondary || colorObj.secundario || colorObj.brandSecondary || null;
      result._brandAccent = colorObj.accent || colorObj.acento || colorObj.brandAccent || null;
      result._brandText = colorObj.text || colorObj.texto || colorObj.brandText || null;
      result._brandSurface = colorObj.surface || colorObj.fondo || colorObj.brandSurface || null;
    }
  }

  result._brandLogo = marcaBlancaData.logo || null;

  const textos = marcaBlancaData.textos_publicos;
  if (textos) {
    let textoObj = textos;
    if (typeof textos === "string") {
      try { textoObj = JSON.parse(textos); } catch { textoObj = null; }
    }
    if (textoObj && typeof textoObj === "object") {
      result._brandCtaLabel = textoObj.cta || textoObj.cta_label || textoObj.brandCtaLabel || null;
      result._brandContactPhone = textoObj.phone || textoObj.telefono || textoObj.brandContactPhone || null;
      result._brandContactEmail = textoObj.email || textoObj.correo || textoObj.brandContactEmail || null;
      result._brandContactWhatsapp = textoObj.whatsapp || textoObj.brandContactWhatsapp || null;
    }
  }

  return result;
}

async function resolveBrandConfig() {
  const resolved = { ...brandTheme };

  let configRecords = [];
  let marcaBlancaData = null;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const [configRes, marcaRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/configuracion-publica`),
    fetch(`${API_BASE}/api/marca-blanca`),
  ]);

  if (configRes.status === "fulfilled" && configRes.value.ok) {
    try {
      const json = await configRes.value.json();
      configRecords = json.configuracion || json.records || json.data || [];
      if (!Array.isArray(configRecords)) configRecords = [configRecords];
    } catch (e) {
      console.warn("[resolveBrandConfig] Error parseando /api/configuracion-publica:", e);
    }
  }

  if (marcaRes.status === "fulfilled" && marcaRes.value.ok) {
    try {
      marcaBlancaData = await marcaRes.value.json();
    } catch (e) {
      console.warn("[resolveBrandConfig] Error parseando /api/marca-blanca:", e);
    }
  }

  const mbExtracted = extractFromMarcaBlanca(marcaBlancaData);

  for (const [airtableKeys, themeProp, dataType] of FIELD_MAP) {
    const rawValue = findFieldValue(configRecords, airtableKeys);
    const mbKey = "_" + themeProp;
    const mbValue = mbExtracted[mbKey];

    if (rawValue !== undefined) {
      // Para colores primario/secundario/accento, validar paleta glaciar
      if (dataType === "color" && ["brandPrimary", "brandSecondary", "brandAccent"].includes(themeProp)) {
        const validated = validateGlacierColor(rawValue);
        if (validated) {
          resolved[themeProp] = validated;
        }
        // Si no pasa validación, mantener fallback glaciar
      } else {
        const normalizer = NORMALIZERS[dataType] || NORMALIZERS.text;
        const normalized = normalizer(rawValue);
        if (normalized !== undefined && normalized !== null && normalized !== "") {
          resolved[themeProp] = normalized;
        }
      }
    } else if (mbValue !== undefined && mbValue !== null && mbValue !== "") {
      const normalizer = NORMALIZERS[dataType] || NORMALIZERS.text;
      const mbNormalized = normalizer(mbValue);
      if (mbNormalized !== undefined && mbNormalized !== null && mbNormalized !== "") {
        if (dataType === "color" && ["brandPrimary", "brandSecondary", "brandAccent"].includes(themeProp)) {
          const validated = validateGlacierColor(mbNormalized);
          if (validated) resolved[themeProp] = validated;
        } else {
          resolved[themeProp] = mbNormalized;
        }
      }
    }
  }

  return resolved;
}

export default resolveBrandConfig;

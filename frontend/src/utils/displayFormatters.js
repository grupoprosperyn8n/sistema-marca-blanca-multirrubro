/**
 * displayFormatters.js — Normalización de nombres para frontend público
 *
 * Reglas:
 * - NO copiar nombres tal cual de Airtable si están en ALL CAPS, con _ o claves técnicas
 * - NO mostrar iconos Material como texto (se renderizan con fuente)
 * - TODO nombre visible DEBE pasar por toPublicTitle()
 *
 * Ejemplo:
 *   "COLORACION GLOBAL" → "Coloración Global"
 *   "CORTE_DE_CABELLO"  → "Corte de Cabello"
 *   "SERVICIO_TECNICO"  → "" (oculto)
 */

const FORCE_UPPER = new Set(["SPA", "VIP"]);

const LOWERCASE_WORDS = new Set([
  "de", "del", "la", "las", "los", "el", "en", "con", "sin", "por",
  "para", "y", "e", "o", "u", "a", "al"
]);

function toTitleCase(str) {
  return str
    .split(" ")
    .map((word, i) => {
      if (FORCE_UPPER.has(word.toUpperCase())) return word.toUpperCase();
      if (i > 0 && LOWERCASE_WORDS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function toPublicTitle(raw) {
  if (!raw) return "";
  const str = String(raw).trim();

  // Rechazar nombres técnicos
  if (/^(SERVICIO|PRODUCTO|ITEM|TEST|PRUEBA|DUMMY|CLAVE_CONFIGURACION|TEXTO_CONFIGURACION)$/i.test(str)) return "";

  // Guiones bajos → espacios
  if (str.includes("_")) {
    return toTitleCase(str.replace(/_/g, " "));
  }

  // ALL CAPS → Title Case
  if (str === str.toUpperCase() && str.length > 3) {
    return toTitleCase(str.toLowerCase());
  }

  // Si ya está mezclado pero tiene palabras en ALL CAPS específicas
  return str;
}

/**
 * Formatea un precio para display público.
 * Si viene como número (ej: 3500) lo formatea como "$3.500,00" (LATAM)
 */
export function formatPrice(price) {
  if (price === null || price === undefined || price === "") return null;
  const num = typeof price === "string" ? parseFloat(price.replace(/[^0-9.,\-]/g, "").replace(",", ".")) : Number(price);
  if (isNaN(num)) return null;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(num);
}

/**
 * Convierte categorías técnicas (ej: "CUIDADO_CAPILAR") a nombres humanos
 * ("Cuidado Capilar") para el frontend público.
 * Si no hay match en el mapa, aplica toPublicTitle como fallback.
 */
const CATEGORIA_MAP = {
  CUIDADO_CAPILAR: "Cuidado Capilar",
  KIT_PRODUCTOS: "Kits de Productos",
  MANOS_Y_PIES: "Manos y Pies",
  TRATAMIENTOS_FACIALES: "Tratamientos Faciales",
  MAQUILLAJE: "Maquillaje",
  SPA_BIENESTAR: "Spa y Bienestar",
  HERRAMIENTAS: "Herramientas",
  ACCESORIOS: "Accesorios",
  SIN_CATEGORIA: "",
};

export function formatCategoria(raw) {
  if (!raw) return "";
  const str = String(raw).trim();
  // Buscar en el mapa (case-insensitive)
  const key = str.toUpperCase().replace(/ /g, "_");
  if (CATEGORIA_MAP[key]) return CATEGORIA_MAP[key];
  if (CATEGORIA_MAP[str]) return CATEGORIA_MAP[str];
  // Fallback: limpiar underscores y capitalizar
  return toPublicTitle(str);
}

export { toTitleCase, LOWERCASE_WORDS, FORCE_UPPER };

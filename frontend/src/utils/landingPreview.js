export const LANDING_PREVIEW_STORAGE_KEY = "bellezapro:landing-builder-preview";
export const LANDING_PREVIEW_MESSAGE = "landing-preview:update";

export function canUseLandingPreviewStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function isLandingPreviewRuntime() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search || "");
  const hasPreviewParam = params.get("preview") === "landing-builder";
  const isEmbedded = window.self !== window.top;
  return hasPreviewParam || isEmbedded;
}

export function readLandingPreviewPayload() {
  if (!canUseLandingPreviewStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(LANDING_PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLandingPreviewPayload(payload) {
  if (!canUseLandingPreviewStorage()) return;
  window.sessionStorage.setItem(LANDING_PREVIEW_STORAGE_KEY, JSON.stringify(payload || {}));
}

export function clearLandingPreviewPayload() {
  if (!canUseLandingPreviewStorage()) return;
  window.sessionStorage.removeItem(LANDING_PREVIEW_STORAGE_KEY);
}

export function applyPreviewToMarcaData(data = {}, payload = readLandingPreviewPayload()) {
  if (!payload?.form) return data;
  const form = payload.form || {};
  return {
    ...data,
    nombre_sistema: form.nombre_sistema ?? data.nombre_sistema,
    nombre_negocio: form.nombre_negocio ?? data.nombre_negocio,
    rubro: form.rubro ?? data.rubro,
    logo: form.logo ?? data.logo,
    seo_title: form.seo_title ?? data.seo_title,
    seo_description: form.seo_description ?? data.seo_description,
    legal_aviso: form.legal_aviso ?? data.legal_aviso,
    colores: {
      ...(data.colores || {}),
      ...(form.colores || {}),
    },
    textos_publicos: {
      ...(data.textos_publicos || {}),
      ...(form.textos_publicos || {}),
    },
    secciones_visibles: {
      ...(data.secciones_visibles || {}),
      ...(form.secciones_visibles || {}),
    },
  };
}

export function mergePreviewLandingSections(rows = [], payload = readLandingPreviewPayload()) {
  if (!payload?.landingDrafts) return rows;
  const drafts = payload.landingDrafts || {};
  return rows.map((row) => ({
    ...row,
    ...draftToLandingSection(drafts[row.id] || {}),
  }));
}

function urlsToAttachments(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/\n|,/);
  return raw
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .map((url, index) => ({ id: `preview-${index}-${url}`, url }));
}

function draftToLandingSection(draft) {
  const next = { ...draft };
  if ("IMAGEN_PRINCIPAL_URL" in next) {
    const attachments = urlsToAttachments(next.IMAGEN_PRINCIPAL_URL);
    if (attachments.length) next.IMAGEN_PRINCIPAL = attachments;
    delete next.IMAGEN_PRINCIPAL_URL;
  }
  if ("IMAGENES_CARRUSEL_URLS" in next) {
    const attachments = urlsToAttachments(next.IMAGENES_CARRUSEL_URLS);
    if (attachments.length) next.IMAGENES_CARRUSEL = attachments;
    delete next.IMAGENES_CARRUSEL_URLS;
  }
  return next;
}

export function subscribeLandingPreviewPayload(callback) {
  if (typeof window === "undefined") return () => {};
  const onMessage = (event) => {
    if (event?.data?.type !== LANDING_PREVIEW_MESSAGE) return;
    const payload = event.data.payload || null;
    if (payload) writeLandingPreviewPayload(payload);
    callback(payload || readLandingPreviewPayload());
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

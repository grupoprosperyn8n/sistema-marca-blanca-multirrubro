import { useEffect, useState } from "react";
import LandingPreviewModal from "../components/backoffice/LandingPreviewModal";
import { canAccess, canEditField, useAuth } from "../context/AuthContext";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

async function fetchJson(path) {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

function buildConfigDraft(row = {}) {
  return {
    NOMBRE_CONFIGURACION: row.NOMBRE_CONFIGURACION || "",
    TEXTO_CONFIGURACION: row.TEXTO_CONFIGURACION || "",
    SI_NO_CONFIGURACION: !!row.SI_NO_CONFIGURACION,
    COLOR_HEX_CONFIGURACION: row.COLOR_HEX_CONFIGURACION || "",
    URL_CONFIGURACION: row.URL_CONFIGURACION || "",
    VISIBLE_EN_FRONTEND_PUBLICO: row.VISIBLE_EN_FRONTEND_PUBLICO !== false,
    REGISTRO_ACTIVO: row.REGISTRO_ACTIVO !== false,
    ORDEN_VISUAL: row.ORDEN_VISUAL ?? "",
  };
}

function buildLandingDraft(row = {}) {
  return {
    NOMBRE_SECCION: row.NOMBRE_SECCION || "",
    TITULO_PUBLICO: row.TITULO_PUBLICO || "",
    SUBTITULO_PUBLICO: row.SUBTITULO_PUBLICO || "",
    CONTENIDO_PUBLICO: row.CONTENIDO_PUBLICO || "",
    TEXTO_BOTON_CTA: row.TEXTO_BOTON_CTA || "",
    URL_BOTON_CTA: row.URL_BOTON_CTA || "",
    IMAGEN_PRINCIPAL_URL: "",
    IMAGENES_CARRUSEL_URLS: "",
    COLOR_FONDO_HEX: row.COLOR_FONDO_HEX || "",
    COLOR_TEXTO_HEX: row.COLOR_TEXTO_HEX || "",
    VISIBLE_MOBILE: row.VISIBLE_MOBILE !== false,
    VISIBLE_TABLET: row.VISIBLE_TABLET !== false,
    VISIBLE_DESKTOP: row.VISIBLE_DESKTOP !== false,
    VISIBLE_EN_FRONTEND_PUBLICO: row.VISIBLE_EN_FRONTEND_PUBLICO !== false,
    REGISTRO_ACTIVO: row.REGISTRO_ACTIVO !== false,
    ORDEN_VISUAL: row.ORDEN_VISUAL ?? "",
  };
}

function buildForm(marca = {}) {
  const colores = marca.colores || {};
  const textos = marca.textos_publicos || {};
  const secciones = marca.secciones_visibles || {};
  return {
    nombre_sistema: marca.nombre_sistema || "",
    nombre_negocio: marca.nombre_negocio || "",
    rubro: marca.rubro || "",
    seo_title: marca.seo_title || "",
    seo_description: marca.seo_description || "",
    legal_aviso: marca.legal_aviso || "",
    logo: marca.logo || "",
    colores: {
      primario: colores.primario || "",
      secundario: colores.secundario || "",
      acento: colores.acento || "",
      fondo: colores.fondo || "",
      texto: colores.texto || "",
      texto_secundario: colores.texto_secundario || "",
      tipografia_titulos: colores.tipografia_titulos || "",
      tipografia_cuerpo: colores.tipografia_cuerpo || "",
    },
    textos_publicos: {
      hero_badge: textos.hero_badge || "",
      hero_titulo: textos.hero_titulo || "",
      hero_subtitulo: textos.hero_subtitulo || "",
      hero_cta_primario: textos.hero_cta_primario || "",
      hero_cta_primario_url: textos.hero_cta_primario_url || "",
      hero_cta_secundario: textos.hero_cta_secundario || "",
      hero_cta_secundario_url: textos.hero_cta_secundario_url || "",
      hero_imagen_url: textos.hero_imagen_url || "",
      banner_activo: !!textos.banner_activo,
      banner_titulo: textos.banner_titulo || "",
      banner_mensaje: textos.banner_mensaje || "",
      banner_cta_texto: textos.banner_cta_texto || "",
      banner_cta_url: textos.banner_cta_url || "",
      contacto_telefono: textos.contacto_telefono || "",
      contacto_whatsapp: textos.contacto_whatsapp || "",
      contacto_email: textos.contacto_email || "",
      contacto_direccion: textos.contacto_direccion || "",
      redes_instagram: textos.redes_instagram || "",
      redes_facebook: textos.redes_facebook || "",
      redes_maps: textos.redes_maps || "",
    },
    secciones_visibles: {
      mostrar_servicios: secciones.mostrar_servicios !== false,
      mostrar_productos: secciones.mostrar_productos !== false,
      mostrar_sucursales: secciones.mostrar_sucursales !== false,
      mostrar_como_funciona: secciones.mostrar_como_funciona !== false,
      mostrar_ofertas: !!secciones.mostrar_ofertas,
      mostrar_testimonios: !!secciones.mostrar_testimonios,
    },
  };
}

const labelClass = "text-xs font-bold uppercase tracking-wide text-slate-600";
const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-sky-400";
const landingFontOptions = [
  "Manrope",
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lato",
  "Open Sans",
  "Playfair Display",
  "Merriweather",
  "Nunito",
];
const landingKeys = [
  "HOME_HERO_PRINCIPAL",
  "HOME_SERVICIOS_DESTACADOS",
  "HOME_PRODUCTOS_DESTACADOS",
  "HOME_BLOQUE_RESERVAS",
  "HOME_SUCURSALES_CONTACTO",
  "HOME_CONTACTO_RAPIDO",
  "HOME_PORTAL_CLIENTES",
  "HOME_FOOTER",
];
const orderableLandingKeys = new Set([
  "HOME_SERVICIOS_DESTACADOS",
  "HOME_PRODUCTOS_DESTACADOS",
  "HOME_BLOQUE_RESERVAS",
  "HOME_SUCURSALES_CONTACTO",
]);
const baseLandingOrder = Object.fromEntries(landingKeys.map((key, index) => [key, (index + 1) * 10]));
const configCategories = new Set(["BRANDING", "CTA", "CONTACTO", "SEO", "COLORES", "MODULO_VISIBLE", "LANDING", "GENERAL"]);
const configScopes = new Set(["LANDING_PUBLICA", "GLOBAL", "CONTACTO", "SEO", "PUBLICO", "PUBLICA"]);

const sectionTemplates = [
  { key: "CTA", label: "CTA", icon: "campaign", tipo: "CTA", componente: "CTA_PROMOCIONAL", title: "Nueva llamada a la acción", content: "Contá qué tiene que hacer la persona ahora y por qué le conviene.", cta: "Quiero avanzar" },
  { key: "FAQ", label: "FAQ", icon: "quiz", tipo: "FAQ", componente: "FAQ", title: "Preguntas frecuentes", content: "Pregunta 1|Respuesta breve y clara\nPregunta 2|Otra respuesta útil" },
  { key: "TESTIMONIOS", label: "Testimonios", icon: "reviews", tipo: "TESTIMONIOS", componente: "TESTIMONIOS", title: "Lo que dicen nuestros clientes", content: "Nombre|Comentario o resultado logrado" },
  { key: "GALERIA", label: "Galería", icon: "photo_library", tipo: "GALERIA", componente: "GALERIA_RESULTADOS", title: "Galería", content: "Sumá URLs de imágenes luego desde Media; este bloque no sube archivos automáticamente." },
  { key: "PROMOCIONES", label: "Promoción", icon: "local_offer", tipo: "PROMOCIONES", componente: "CTA_PROMOCIONAL", title: "Promoción destacada", content: "Explicá la promo, vigencia y condición principal.", cta: "Ver promoción" },
  { key: "PROFESIONALES", label: "Equipo/Profesionales", icon: "groups", tipo: "PROFESIONALES", componente: "PROFESIONALES_DESTACADOS", title: "Equipo profesional", content: "Nombre|Rol o especialidad" },
  { key: "SERVICIOS", label: "Servicios", icon: "design_services", tipo: "SERVICIOS", componente: "SERVICIOS_DESTACADOS", title: "Servicios recomendados", content: "Servicio|Beneficio principal" },
  { key: "PRODUCTOS", label: "Productos", icon: "inventory_2", tipo: "PRODUCTOS", componente: "PRODUCTOS_DESTACADOS", title: "Productos destacados", content: "Producto|Detalle o beneficio" },
  { key: "SUCURSALES", label: "Sucursales/Contacto", icon: "location_on", tipo: "SUCURSALES", componente: "SUCURSALES_CONTACTO", title: "Dónde encontrarnos", content: "Dirección, horarios o canales de contacto." },
  { key: "RESERVAS", label: "Agenda/Reservas", icon: "calendar_month", tipo: "AGENDA_PUBLICA", componente: "AGENDA_PUBLICA", title: "Agenda abierta", content: "Indicá cuándo y cómo reservar.", cta: "Reservar" },
  { key: "BENTO", label: "Texto/Bento", icon: "view_quilt", tipo: "CTA", componente: "BENTO_GRID", title: "Bloque informativo", content: "Punto uno|Detalle breve\nPunto dos|Detalle breve" },
];

function buildSectionConstructorDraft(template = sectionTemplates[0]) {
  return {
    templateKey: template.key,
    NOMBRE_SECCION: template.title,
    TIPO_SECCION: template.tipo,
    COMPONENTE_VISUAL: template.componente,
    TITULO_PUBLICO: template.title,
    SUBTITULO_PUBLICO: "",
    CONTENIDO_PUBLICO: template.content || "",
    TEXTO_BOTON_CTA: template.cta || "",
    URL_BOTON_CTA: "",
    COLOR_FONDO_HEX: "",
    COLOR_TEXTO_HEX: "",
    VISIBLE_EN_FRONTEND_PUBLICO: true,
    REGISTRO_ACTIVO: true,
    VISIBLE_MOBILE: true,
    VISIBLE_TABLET: true,
    VISIBLE_DESKTOP: true,
  };
}

function visualOrderValue(value, fallback = 999) {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function sortByOrder(a, b) {
  return visualOrderValue(a.ORDEN_VISUAL) - visualOrderValue(b.ORDEN_VISUAL) || String(a.CLAVE_SECCION || a.CLAVE_CONFIGURACION || "").localeCompare(String(b.CLAVE_SECCION || b.CLAVE_CONFIGURACION || ""));
}

function isFixedHeroSection(row = {}) {
  return row.CLAVE_SECCION === "HOME_HERO_PRINCIPAL";
}

function isOrderableLandingSection(row = {}) {
  return orderableLandingKeys.has(row.CLAVE_SECCION) || String(row.CLAVE_SECCION || "").startsWith("CUSTOM_");
}

function urlsToAttachments(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/\n|,/);
  return raw
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

function attachmentPatchPayload(attachment) {
  const url = String(attachment?.url || attachment?.download_url || "").trim();
  return url ? { url } : null;
}

function hasDraftAttachmentUrls(value) {
  return urlsToAttachments(value).length > 0;
}

function mergeAttachmentPayload(existing = [], draftUrls = "", { replace = false } = {}) {
  const kept = replace ? [] : (Array.isArray(existing) ? existing : []).map(attachmentPatchPayload).filter(Boolean);
  const added = urlsToAttachments(draftUrls);
  return [...kept, ...added];
}

function buildLandingPayload(draft = {}, currentRow = {}) {
  const {
    IMAGEN_PRINCIPAL_URL,
    IMAGENES_CARRUSEL_URLS,
    ...payload
  } = draft;
  if (hasDraftAttachmentUrls(IMAGEN_PRINCIPAL_URL)) {
    payload.IMAGEN_PRINCIPAL = mergeAttachmentPayload(currentRow.IMAGEN_PRINCIPAL, IMAGEN_PRINCIPAL_URL);
  }
  if (hasDraftAttachmentUrls(IMAGENES_CARRUSEL_URLS)) {
    payload.IMAGENES_CARRUSEL = mergeAttachmentPayload(currentRow.IMAGENES_CARRUSEL, IMAGENES_CARRUSEL_URLS);
  }
  return payload;
}

function attachmentPreviewItems(existing = [], draftUrlValue = "") {
  const liveItems = (Array.isArray(existing) ? existing : [])
    .map((item, index) => ({
      id: item?.id || `existing-${index}-${item?.url || item?.download_url || ""}`,
      url: item?.url || item?.download_url || "",
      filename: item?.filename || "",
      type: item?.type || "",
      source: "existing",
    }))
    .filter((item) => item.url);
  const draftItems = urlsToAttachments(draftUrlValue).map((item, index) => ({
    id: `draft-${index}-${item.url}`,
    url: item.url,
    filename: item.filename || "URL nueva",
    type: "",
    source: "draft",
  }));
  return [...liveItems, ...draftItems];
}

function lastAttachmentUrl(value) {
  if (!Array.isArray(value) || !value.length) return "";
  const item = value[value.length - 1];
  return String(item?.url || item?.download_url || "").trim();
}

function landingMediaHelperText(claveSeccion) {
  switch (claveSeccion) {
    case "HOME_HERO_PRINCIPAL":
      return "Hero: imagen ideal 1920x1080 o 1600x900; video MP4/WebM 16:9, liviano y sin audio crítico.";
    case "HOME_SERVICIOS_DESTACADOS":
      return "Servicios destacados: fotos 1200x900; video corto MP4/WebM, 4:3 o 16:9, para mostrar el resultado.";
    case "HOME_PRODUCTOS_DESTACADOS":
      return "Productos destacados: fotos limpias 1200x1200 o 1200x900; video corto MP4/WebM de producto.";
    case "HOME_SUCURSALES_CONTACTO":
    case "HOME_CONTACTO_RAPIDO":
      return "Sucursales/contacto: local, fachada o mapa en 1200x800; video MP4/WebM breve de ubicación.";
    case "HOME_FOOTER":
      return "Footer: media opcional; imagen 1600x600 o pieza simple, video MP4/WebM liviano.";
    default:
      return "Media de sección: imagen 1200px+; video MP4/WebM liviano. Al subir, queda guardado inmediatamente.";
  }
}

function isVideoAttachment(item = {}) {
  const type = String(item.type || "").toLowerCase();
  const url = String(item.url || "").toLowerCase();
  return type.startsWith("video/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(url);
}

function removeUrlLine(value, urlToRemove) {
  const target = String(urlToRemove || "").trim();
  return String(value || "")
    .split(/\n|,/)
    .map((url) => url.trim())
    .filter((url) => url && url !== target)
    .join("\n");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",", 2)[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function normalizeHexInput(value) {
  const clean = String(value || "").trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(clean) || /^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  return "";
}

function toColorInputValue(value) {
  const normalized = normalizeHexInput(value);
  if (/^#[0-9A-F]{6}$/.test(normalized)) return normalized;
  if (/^#[0-9A-F]{3}$/.test(normalized)) {
    const [, r, g, b] = normalized;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

function Field({ label, value, onChange, disabled, type = "text", placeholder = "" }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${disabled ? "opacity-60" : ""}`}
      />
    </label>
  );
}

function ColorField({ label, value, onChange, disabled, placeholder = "#7C3AED" }) {
  const normalized = normalizeHexInput(value);
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <div className={`mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 p-1.5 ${disabled ? "opacity-60" : ""}`}>
        <input
          type="color"
          value={toColorInputValue(value || placeholder)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0 disabled:cursor-not-allowed"
          aria-label={`Elegir color para ${label}`}
        />
        <input
          type="text"
          value={value || ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => {
            const next = normalizeHexInput(event.target.value);
            if (next) onChange(next);
          }}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-sm outline-none"
        />
        <span
          className="hidden rounded-lg px-2 py-1 text-[11px] font-semibold sm:inline-flex"
          style={{ background: normalized || toColorInputValue(value || placeholder), color: "#fff" }}
        >
          HEX
        </span>
      </div>
    </label>
  );
}

function TextAreaField({ label, value, onChange, disabled, placeholder = "", rows = 3 }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <textarea
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} min-h-20 ${disabled ? "opacity-60" : ""}`}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, disabled, options = [], placeholder = "Seleccionar" }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <select
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${disabled ? "opacity-60" : ""}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function MediaAttachmentManager({
  row,
  field,
  label,
  draftValue,
  onDraftChange,
  disabled,
  uploading,
  onUpload,
  onDelete,
  multiple = false,
  textarea = false,
  helperText = "",
}) {
  const items = attachmentPreviewItems(row?.[field], draftValue);

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || disabled || uploading) return;
    for (const file of files) {
      await onUpload(row, field, file);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={labelClass}>{label}</p>
          <p className="text-xs text-slate-500">URL pública o archivo adjunto. Soporta imagen y video.</p>
          {helperText && <p className="mt-1 text-xs text-sky-700">{helperText}</p>}
        </div>
        <label className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ${disabled || uploading ? "pointer-events-none opacity-50" : ""}`}>
          {uploading ? "Subiendo…" : "Subir archivo"}
          <input
            type="file"
            accept="image/*,image/gif,video/*"
            multiple={multiple}
            disabled={disabled || uploading}
            onChange={handleFiles}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-3">
        {textarea ? (
          <textarea
            value={draftValue || ""}
            placeholder={"Agregar URLs nuevas, una por línea\nhttps://imagen.jpg\nhttps://video.mp4"}
            disabled={disabled}
            rows={3}
            onChange={(event) => onDraftChange(event.target.value)}
            className={`${inputClass} min-h-20 ${disabled ? "opacity-60" : ""}`}
          />
        ) : (
          <input
            type="text"
            value={draftValue || ""}
            placeholder="Agregar URL nueva https://…"
            disabled={disabled}
            onChange={(event) => onDraftChange(event.target.value)}
            className={`${inputClass} ${disabled ? "opacity-60" : ""}`}
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={`${item.source}:${item.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="relative aspect-[4/3] bg-slate-100">
              {isVideoAttachment(item) ? (
                <video src={item.url} controls muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <img src={item.url} alt={item.filename || label} className="h-full w-full object-cover" loading="lazy" />
              )}
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {item.source === "draft" ? "URL" : "ATT"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
              <p className="min-w-0 truncate text-[11px] text-slate-500">{item.filename || item.url}</p>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => {
                  if (item.source === "draft") {
                    onDraftChange(removeUrlLine(draftValue, item.url));
                    return;
                  }
                  onDelete(row, field, item.id, item.url);
                }}
                className="shrink-0 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-500">
            Sin media cargada todavía.
          </div>
        )}
      </div>
    </div>
  );
}

function BackgroundLandingPanel({ form, canEdit, updateNested, uploading, onUploadFile }) {
  const imageUrl = form?.textos_publicos?.hero_imagen_url || "";
  const isImageMode = !!imageUrl;
  const backgroundMedia = { url: imageUrl, type: "" };
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.5fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>
            Fondo de landing
          </p>
          <h4 className="mt-1 text-lg font-bold" style={{ color: "var(--brand-text)" }}>
            Fondo público de la página
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Usá color sólido para una marca limpia o imagen de fondo si querés una landing más visual.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["SOLIDO", "Color sólido"],
              ["IMAGEN", "Imagen/video"],
            ].map(([value, label]) => {
              const active = value === "IMAGEN" ? isImageMode : !isImageMode;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    if (value === "SOLIDO") updateNested("textos_publicos", "hero_imagen_url", "");
                    if (value === "IMAGEN" && !imageUrl) updateNested("textos_publicos", "hero_imagen_url", "https://");
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-60 ${active ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="space-y-3">
            <ColorField
              label="Color sólido de fondo"
              value={form.colores.fondo}
              disabled={!canEdit}
              placeholder="#F8F9FF"
              onChange={(value) => updateNested("colores", "fondo", value)}
            />
            <Field
              label="URL imagen/video de fondo"
              value={imageUrl}
              disabled={!canEdit || !isImageMode}
              placeholder="https://…"
              onChange={(value) => updateNested("textos_publicos", "hero_imagen_url", value)}
            />
            <label className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 ${!canEdit || uploading ? "pointer-events-none opacity-50" : ""}`}>
              <span className="material-symbols-outlined text-base" aria-hidden="true">upload</span>
              {uploading ? "Subiendo fondo…" : "Subir archivo de fondo"}
              <input
                type="file"
                accept="image/*,image/gif,video/*"
                disabled={!canEdit || uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onUploadFile?.(file);
                }}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-500">
              El archivo se guarda como attachment en el módulo Hero y se usa su URL como fondo público. Después guardá la configuración.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="relative aspect-[4/3]">
              {imageUrl && imageUrl !== "https://" ? (
                isVideoAttachment(backgroundMedia) ? (
                  <video src={imageUrl} controls muted preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img src={imageUrl} alt="Vista previa fondo landing" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500" style={{ background: form.colores.fondo || "#F8F9FF" }}>
                  Color sólido
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="truncate text-[11px] text-slate-500">{imageUrl && imageUrl !== "https://" ? "Imagen de fondo" : form.colores.fondo || "Sin color"}</span>
              {imageUrl && (
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => updateNested("textos_publicos", "hero_imagen_url", "")}
                  className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 disabled:opacity-50"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm" style={{ color: "var(--brand-text)" }}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function Badge({ active, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "✓" : "—"} {children}
    </span>
  );
}

function InfoCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: "var(--brand-text)" }}>
        {label}
      </p>
      <p className="mt-2 text-lg font-bold" style={{ color: "var(--brand-text)" }}>
        {value || "—"}
      </p>
      {hint && (
        <p className="mt-1 text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function Configuracion() {
  const { role, access } = useAuth();
  const { config: liveConfig, refresh } = useBrandConfig();
  const [state, setState] = useState({
    loading: true,
    error: null,
    marca: null,
    configuracion: [],
    landing: [],
    modulos: [],
  });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [configDrafts, setConfigDrafts] = useState({});
  const [landingDrafts, setLandingDrafts] = useState({});
  const [rowSaving, setRowSaving] = useState({});
  const [rowMessages, setRowMessages] = useState({});
  const [mediaUploading, setMediaUploading] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [activeSectionTab, setActiveSectionTab] = useState("contenido");
  const [constructorDraft, setConstructorDraft] = useState(() => buildSectionConstructorDraft());

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      try {
        const [marca, conf, modulos, landing] = await Promise.all([
          fetchJson("/api/marca-blanca"),
          fetchJson("/api/configuracion-publica"),
          fetchJson("/api/modulos"),
          fetchJson("/api/landing-secciones"),
        ]);

        if (cancelled) return;
        const configRows = conf.configuracion || [];
        const landingRows = landing.landing_secciones || [];
        setState({
          loading: false,
          error: null,
          marca,
          configuracion: configRows,
          landing: landingRows,
          modulos: modulos.modulos || [],
        });
        setForm(buildForm(marca));
        setConfigDrafts(Object.fromEntries(configRows.map((row) => [row.id, buildConfigDraft(row)])));
        setLandingDrafts(Object.fromEntries(landingRows.map((row) => [row.id, buildLandingDraft(row)])));
      } catch (error) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    }

    cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="py-12 text-center" style={{ color: "var(--brand-text)" }}>
        Cargando configuración de marca blanca…
      </div>
    );
  }

  if (state.error) {
    return <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Error: {state.error}</div>;
  }

  const marca = state.marca || {};
  const business = liveConfig.business || {};
  const rawBusiness = marca.business_config || {};
  const faltantes = marca.faltantes || [];
  const canEdit = canAccess(role, "configuracion", access, "edit");

  function updateRoot(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateNested(group, key, value) {
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...(prev?.[group] || {}),
        [key]: value,
      },
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit || !form) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch(`${API}/api/marca-blanca`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
        throw new Error(typeof detail === "string" ? detail : "No se pudo guardar la configuración.");
      }
      setState((prev) => ({ ...prev, marca: data }));
      setForm(buildForm(data));
      await refresh?.();
      setSaveMessage(`Guardado. Campos actualizados: ${(data.updated_fields || []).length}`);
    } catch (error) {
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function updateConfigDraft(id, field, value) {
    setConfigDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  }

  function updateLandingDraft(id, field, value) {
    setLandingDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  }

  function normalizeLandingOrder(rows, startIndex = 1) {
    return rows.map((row, index) => ({
      row,
      order: (index + startIndex) * 10,
    }));
  }

  function moveLandingRow(rowId, direction) {
    if (!fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")) return;
    const movableRows = landingRows.filter(isOrderableLandingSection);
    const currentIndex = movableRows.findIndex((row) => row.id === rowId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= movableRows.length) return;

    const reordered = [...movableRows];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);

    setLandingDrafts((prev) => {
      const next = { ...prev };
      normalizeLandingOrder(reordered, 2).forEach(({ row, order }) => {
        next[row.id] = {
          ...(next[row.id] || buildLandingDraft(row)),
          ORDEN_VISUAL: order,
        };
      });
      return next;
    });
  }

  function undoLandingOrderChanges() {
    if (!fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")) return;
    setLandingDrafts((prev) => {
      const next = { ...prev };
      landingRows.filter(isOrderableLandingSection).forEach((row) => {
        next[row.id] = {
          ...(next[row.id] || buildLandingDraft(row)),
          ORDEN_VISUAL: row.ORDEN_VISUAL ?? "",
        };
      });
      return next;
    });
    setSaveMessage("Orden deshecho. Volviste al orden guardado actual.");
  }

  function resetLandingOrderToBase() {
    if (!fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")) return;
    setLandingDrafts((prev) => {
      const next = { ...prev };
      landingRows.filter(isOrderableLandingSection).forEach((row) => {
        next[row.id] = {
          ...(next[row.id] || buildLandingDraft(row)),
          ORDEN_VISUAL: baseLandingOrder[row.CLAVE_SECCION] ?? visualOrderValue(row.ORDEN_VISUAL),
        };
      });
      return next;
    });
    setSaveMessage("Estructura base aplicada en borrador. Previsualizá y guardá el orden para publicarla.");
  }


  function updateConstructorDraft(field, value) {
    setConstructorDraft((prev) => ({ ...prev, [field]: value }));
  }

  function selectSectionTemplate(template) {
    setConstructorDraft((prev) => ({
      ...buildSectionConstructorDraft(template),
      COLOR_FONDO_HEX: prev.COLOR_FONDO_HEX,
      COLOR_TEXTO_HEX: prev.COLOR_TEXTO_HEX,
      VISIBLE_EN_FRONTEND_PUBLICO: prev.VISIBLE_EN_FRONTEND_PUBLICO,
      REGISTRO_ACTIVO: prev.REGISTRO_ACTIVO,
      VISIBLE_MOBILE: prev.VISIBLE_MOBILE,
      VISIBLE_TABLET: prev.VISIBLE_TABLET,
      VISIBLE_DESKTOP: prev.VISIBLE_DESKTOP,
    }));
  }

  async function createLandingSection() {
    if (!canEdit) return;
    const key = "landing:create";
    setRowSaving((prev) => ({ ...prev, [key]: true }));
    setRowMessages((prev) => ({ ...prev, [key]: "" }));
    try {
      const payload = {
        ...constructorDraft,
        FUENTE_CONTENIDO: "MANUAL",
        AMBITO_SECCION: "LANDING_PUBLICA",
      };
      delete payload.templateKey;
      const res = await fetch(`${API}/api/backoffice/landing-secciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
        throw new Error(typeof detail === "string" ? detail : "No se pudo crear la sección.");
      }
      setState((prev) => ({ ...prev, landing: [...prev.landing, data] }));
      setLandingDrafts((prev) => ({ ...prev, [data.id]: buildLandingDraft(data) }));
      setConstructorDraft(buildSectionConstructorDraft(sectionTemplates[0]));
      setRowMessages((prev) => ({ ...prev, [key]: "Sección creada y agregada al builder." }));
      setPreviewOpen(true);
    } catch (error) {
      setRowMessages((prev) => ({ ...prev, [key]: `Error: ${error.message}` }));
    } finally {
      setRowSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  function fieldEditable(table, field) {
    return canEdit && canEditField(access, table, field);
  }

  async function patchConfigRow(row) {
    if (!canEdit || !row?.id) return;
    const key = `config:${row.id}`;
    setRowSaving((prev) => ({ ...prev, [key]: true }));
    setRowMessages((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch(`${API}/api/backoffice/configuracion-publica/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(configDrafts[row.id] || buildConfigDraft(row)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
        throw new Error(typeof detail === "string" ? detail : "No se pudo guardar la configuración.");
      }
      setState((prev) => ({
        ...prev,
        configuracion: prev.configuracion.map((item) => (item.id === row.id ? { ...item, ...data } : item)),
      }));
      setConfigDrafts((prev) => ({ ...prev, [row.id]: buildConfigDraft(data) }));
      await refresh?.();
      setRowMessages((prev) => ({ ...prev, [key]: "Guardado" }));
    } catch (error) {
      setRowMessages((prev) => ({ ...prev, [key]: `Error: ${error.message}` }));
    } finally {
      setRowSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function patchLandingRow(row) {
    if (!canEdit || !row?.id) return;
    const key = `landing:${row.id}`;
    setRowSaving((prev) => ({ ...prev, [key]: true }));
    setRowMessages((prev) => ({ ...prev, [key]: "" }));
    try {
      const payload = buildLandingPayload(landingDrafts[row.id] || buildLandingDraft(row), row);
      delete payload.ORDEN_VISUAL;
      const res = await fetch(`${API}/api/backoffice/landing-secciones/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
        throw new Error(typeof detail === "string" ? detail : "No se pudo guardar la sección.");
      }
      setState((prev) => ({
        ...prev,
        landing: prev.landing.map((item) => (item.id === row.id ? { ...item, ...data } : item)),
      }));
      setLandingDrafts((prev) => ({ ...prev, [row.id]: buildLandingDraft(data) }));
      setRowMessages((prev) => ({ ...prev, [key]: "Guardado" }));
    } catch (error) {
      setRowMessages((prev) => ({ ...prev, [key]: `Error: ${error.message}` }));
    } finally {
      setRowSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function patchLandingOrder() {
    if (!canEdit || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")) return;
    const key = "landing:order";
    const changedRows = landingRows.filter(isOrderableLandingSection).filter((row) => {
      const draft = landingDrafts[row.id] || buildLandingDraft(row);
      return String(draft.ORDEN_VISUAL ?? "") !== String(row.ORDEN_VISUAL ?? "");
    });
    if (!changedRows.length) {
      setSaveMessage("El orden no tiene cambios pendientes.");
      return;
    }

    setRowSaving((prev) => ({ ...prev, [key]: true }));
    setSaveMessage("");
    try {
      const updatedRows = [];
      for (const row of changedRows) {
        const draft = landingDrafts[row.id] || buildLandingDraft(row);
        const res = await fetch(`${API}/api/backoffice/landing-secciones/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ORDEN_VISUAL: visualOrderValue(draft.ORDEN_VISUAL, row.ORDEN_VISUAL ?? 999) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
          throw new Error(typeof detail === "string" ? detail : "No se pudo guardar el orden.");
        }
        updatedRows.push(data);
      }
      setState((prev) => ({
        ...prev,
        landing: prev.landing.map((item) => {
          const updated = updatedRows.find((row) => row.id === item.id);
          return updated ? { ...item, ...updated } : item;
        }),
      }));
      setLandingDrafts((prev) => {
        const next = { ...prev };
        updatedRows.forEach((row) => {
          next[row.id] = buildLandingDraft(row);
        });
        return next;
      });
      setSaveMessage(`Orden guardado. Secciones actualizadas: ${updatedRows.length}`);
    } catch (error) {
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setRowSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function uploadLandingAttachment(row, field, file) {
    if (!canEdit || !row?.id || !file) return;
    const key = `media:${row.id}:${field}`;
    const messageKey = `landing:${row.id}`;
    setMediaUploading((prev) => ({ ...prev, [key]: true }));
    setRowMessages((prev) => ({ ...prev, [messageKey]: "" }));
    try {
      const fileBase64 = await fileToBase64(file);
      const res = await fetch(`${API}/api/backoffice/landing-secciones/${row.id}/attachments/${field}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          file_base64: fileBase64,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
        throw new Error(typeof detail === "string" ? detail : "No se pudo subir el archivo.");
      }
      const updated = data.record || data;
      setState((prev) => ({
        ...prev,
        landing: prev.landing.map((item) => (item.id === row.id ? { ...item, ...updated } : item)),
      }));
      setLandingDrafts((prev) => ({ ...prev, [row.id]: buildLandingDraft(updated) }));
      setRowMessages((prev) => ({ ...prev, [messageKey]: "Archivo cargado" }));
      return updated;
    } catch (error) {
      setRowMessages((prev) => ({ ...prev, [messageKey]: `Error: ${error.message}` }));
      return null;
    } finally {
      setMediaUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function uploadBackgroundAttachment(file) {
    const heroRow = landingRows.find((row) => row.CLAVE_SECCION === "HOME_HERO_PRINCIPAL") || landingRows[0];
    if (!heroRow) {
      setSaveMessage("Error: no hay módulo Hero disponible para guardar el archivo de fondo.");
      return;
    }
    const updated = await uploadLandingAttachment(heroRow, "IMAGEN_PRINCIPAL", file);
    const nextUrl = lastAttachmentUrl(updated?.IMAGEN_PRINCIPAL);
    if (!nextUrl) return;
    updateNested("textos_publicos", "hero_imagen_url", nextUrl);
    setSaveMessage("Archivo de fondo cargado como attachment. Guardá configuración para publicarlo como fondo.");
  }

  async function uploadLogoAttachment(file) {
    if (!canEdit || !file) return;
    const key = "media:marca:logo";
    setMediaUploading((prev) => ({ ...prev, [key]: true }));
    setSaveMessage("");
    try {
      const fileBase64 = await fileToBase64(file);
      const payload = {
        filename: file.name,
        content_type: file.type || "image/gif",
        file_base64: fileBase64,
      };
      const res = await fetch(`${API}/api/backoffice/marca-blanca/logo/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const updated = data.marca || data;
        setState((prev) => ({ ...prev, marca: updated }));
        setForm(buildForm(updated));
        await refresh?.();
        setSaveMessage("Logo cargado y publicado desde MARCAS.");
        return;
      }
      const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
      throw new Error(typeof detail === "string" ? detail : "No se pudo subir el logo.");
    } catch (error) {
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setMediaUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function deleteLogoAttachment() {
    if (!canEdit) return;
    const key = "media:marca:logo";
    setMediaUploading((prev) => ({ ...prev, [key]: true }));
    setSaveMessage("");
    try {
      const res = await fetch(`${API}/api/backoffice/marca-blanca/logo`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const updated = data.marca || data;
        setState((prev) => ({ ...prev, marca: updated }));
        setForm(buildForm(updated));
        await refresh?.();
        const cleanupErrors = data.attachment_cleanup_errors || [];
        setSaveMessage(cleanupErrors.length ? "Logo eliminado de la marca. Revisar limpieza de attachment." : "Logo eliminado de la marca y del storage.");
        return;
      }
      const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
      throw new Error(typeof detail === "string" ? detail : "No se pudo eliminar el logo.");
    } catch (error) {
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setMediaUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function deleteLandingAttachment(row, field, attachmentId, attachmentUrl) {
    if (!canEdit || !row?.id) return;
    const key = `media:${row.id}:${field}`;
    const messageKey = `landing:${row.id}`;
    const currentRow = state.landing.find((item) => item.id === row.id) || row;
    const remaining = (Array.isArray(currentRow[field]) ? currentRow[field] : [])
      .filter((item) => {
        const itemId = String(item?.id || "");
        const itemUrl = String(item?.url || item?.download_url || "");
        return itemId !== String(attachmentId || "") && itemUrl !== String(attachmentUrl || "");
      })
      .map(attachmentPatchPayload)
      .filter(Boolean);

    setMediaUploading((prev) => ({ ...prev, [key]: true }));
    setRowMessages((prev) => ({ ...prev, [messageKey]: "" }));
    try {
      const res = await fetch(`${API}/api/backoffice/landing-secciones/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: remaining }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail?.message || data?.detail || `HTTP ${res.status}`;
        throw new Error(typeof detail === "string" ? detail : "No se pudo eliminar el archivo.");
      }
      setState((prev) => ({
        ...prev,
        landing: prev.landing.map((item) => (item.id === row.id ? { ...item, ...data } : item)),
      }));
      setLandingDrafts((prev) => ({ ...prev, [row.id]: buildLandingDraft(data) }));
      setRowMessages((prev) => ({ ...prev, [messageKey]: "Archivo eliminado" }));
    } catch (error) {
      setRowMessages((prev) => ({ ...prev, [messageKey]: `Error: ${error.message}` }));
    } finally {
      setMediaUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  const landingRows = [...state.landing]
    .filter((row) => String(row.AMBITO_SECCION || "LANDING_PUBLICA").toUpperCase() === "LANDING_PUBLICA" || landingKeys.includes(row.CLAVE_SECCION))
    .sort((a, b) => {
      if (isFixedHeroSection(a) !== isFixedHeroSection(b)) return isFixedHeroSection(a) ? -1 : 1;
      const draftA = landingDrafts[a.id] || buildLandingDraft(a);
      const draftB = landingDrafts[b.id] || buildLandingDraft(b);
      return visualOrderValue(draftA.ORDEN_VISUAL) - visualOrderValue(draftB.ORDEN_VISUAL) || String(a.CLAVE_SECCION || "").localeCompare(String(b.CLAVE_SECCION || ""));
    });
  const orderHasDraftChanges = landingRows.filter(isOrderableLandingSection).some((row) => {
    const draft = landingDrafts[row.id] || buildLandingDraft(row);
    return String(draft.ORDEN_VISUAL ?? "") !== String(row.ORDEN_VISUAL ?? "");
  });
  const backgroundMediaRow = landingRows.find((row) => row.CLAVE_SECCION === "HOME_HERO_PRINCIPAL") || landingRows[0];
  const backgroundMediaKey = backgroundMediaRow ? `media:${backgroundMediaRow.id}:IMAGEN_PRINCIPAL` : "media:background:hero";
  const configRows = [...state.configuracion]
    .filter((row) => {
      const category = String(row.CATEGORIA_CONFIGURACION || "").trim().toUpperCase();
      const scope = String(row.AMBITO_APLICACION || "").trim().toUpperCase();
      return configCategories.has(category) || configScopes.has(scope);
    })
    .sort(sortByOrder);

  const tabs = [
    ["resumen", "Resumen", "dashboard"],
    ["marca", "Marca", "storefront"],
    ["diseno", "Diseño", "palette"],
    ["secciones", "Secciones", "view_quilt"],
    ["seo", "SEO", "travel_explore"],
    ["avanzado", "Avanzado", "tune"],
  ];
  const isBrandFormTab = ["marca", "diseno", "seo"].includes(activeTab);
  const visibleLandingRows = landingRows.filter((row) => {
    const draft = landingDrafts[row.id] || buildLandingDraft(row);
    return draft.VISIBLE_EN_FRONTEND_PUBLICO && draft.REGISTRO_ACTIVO;
  }).length;
  const rowsWithMedia = landingRows.filter((row) => {
    const draft = landingDrafts[row.id] || buildLandingDraft(row);
    return attachmentPreviewItems(row.IMAGEN_PRINCIPAL, draft.IMAGEN_PRINCIPAL_URL).length > 0 || attachmentPreviewItems(row.IMAGENES_CARRUSEL, draft.IMAGENES_CARRUSEL_URLS).length > 0;
  }).length;
  const seoReady = !!(form?.seo_title && form?.seo_description);
  const brandReady = !!(form?.nombre_sistema && form?.rubro && form?.logo);

  function handleTabKeyDown(event, ids, setter, prefix = "tab") {
    const index = ids.indexOf(event.currentTarget.dataset.tabId);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = ids[(index + 1) % ids.length];
      setter(next);
      document.getElementById(`${prefix}-${next}`)?.focus();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = ids[(index - 1 + ids.length) % ids.length];
      setter(next);
      document.getElementById(`${prefix}-${next}`)?.focus();
    }
  }

  function renderSectionEditor(row, { mode = "content" } = {}) {
    const draft = landingDrafts[row.id] || buildLandingDraft(row);
    const key = `landing:${row.id}`;
    const disabled = !canEdit || !!rowSaving[key];
    const fixedHero = isFixedHeroSection(row);
    const orderableSection = isOrderableLandingSection(row);
    const draftBase = buildLandingDraft(row);
    const hasDraftChanges = Object.keys(draft).some((field) => field !== "templateKey" && String(draft[field] ?? "") !== String(draftBase[field] ?? ""));
    const movableRows = landingRows.filter(isOrderableLandingSection);
    const movableIndex = movableRows.findIndex((item) => item.id === row.id);
    const movableTotal = movableRows.length;
    return (
      <section key={row.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="md:sticky md:top-24 md:z-10 -mx-1 mb-4 flex flex-col gap-2 rounded-xl bg-white/90 px-1 py-2 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: "var(--brand-text)" }}>
              {row.CLAVE_SECCION}
            </p>
            <h4 className="font-bold" style={{ color: "var(--brand-text)" }}>
              {draft.NOMBRE_SECCION || row.NOMBRE_SECCION || "Sección"}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge active={draft.VISIBLE_EN_FRONTEND_PUBLICO}>Pública</Badge>
            {fixedHero && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Hero fijo</span>}
            {!fixedHero && !orderableSection && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Agrupada</span>}
            <span aria-live="polite" className={`rounded-full px-3 py-1 text-xs font-bold ${hasDraftChanges ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{hasDraftChanges ? "Cambios sin guardar" : "Guardado"}</span>
            {mode === "order" && (
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Reordenar sección">
                <button
                  type="button"
                  disabled={disabled || !orderableSection || movableIndex <= 0 || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")}
                  onClick={() => moveLandingRow(row.id, -1)}
                  className="inline-flex items-center gap-1 px-3 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Subir sección"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">keyboard_arrow_up</span>
                  Subir
                </button>
                <button
                  type="button"
                  disabled={disabled || !orderableSection || movableIndex >= movableTotal - 1 || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")}
                  onClick={() => moveLandingRow(row.id, 1)}
                  className="inline-flex items-center gap-1 border-l border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Bajar sección"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">keyboard_arrow_down</span>
                  Bajar
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">visibility</span>
              Previsualizar
            </button>
            {mode !== "order" && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => patchLandingRow(row)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
            >
              {rowSaving[key] ? "Guardando…" : canEdit ? "Guardar sección" : "Solo lectura"}
            </button>
            )}
          </div>
        </div>

        {rowMessages[key] && (
          <div role="status" aria-live={rowMessages[key].startsWith("Error") ? "assertive" : "polite"} className={`mb-4 rounded-xl border p-3 text-sm ${rowMessages[key].startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
            {rowMessages[key]}
          </div>
        )}

        {mode === "content" && (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Field label="Nombre interno visible" value={draft.NOMBRE_SECCION} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "NOMBRE_SECCION")} onChange={(value) => updateLandingDraft(row.id, "NOMBRE_SECCION", value)} />
              <Field label="Título público" value={draft.TITULO_PUBLICO} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "TITULO_PUBLICO")} onChange={(value) => updateLandingDraft(row.id, "TITULO_PUBLICO", value)} />
              <Field label="Subtítulo público" value={draft.SUBTITULO_PUBLICO} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "SUBTITULO_PUBLICO")} onChange={(value) => updateLandingDraft(row.id, "SUBTITULO_PUBLICO", value)} />
              <TextAreaField label="Contenido público" value={draft.CONTENIDO_PUBLICO} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "CONTENIDO_PUBLICO")} onChange={(value) => updateLandingDraft(row.id, "CONTENIDO_PUBLICO", value)} />
              <div className="grid grid-cols-1 gap-3">
                <Field label="Texto CTA" value={draft.TEXTO_BOTON_CTA} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "TEXTO_BOTON_CTA")} onChange={(value) => updateLandingDraft(row.id, "TEXTO_BOTON_CTA", value)} />
                <Field label="URL CTA" value={draft.URL_BOTON_CTA} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "URL_BOTON_CTA")} onChange={(value) => updateLandingDraft(row.id, "URL_BOTON_CTA", value)} />
              </div>
              <ColorField label="Color fondo" value={draft.COLOR_FONDO_HEX} placeholder="#FDF4FF" disabled={disabled || !fieldEditable("LANDING_SECCIONES", "COLOR_FONDO_HEX")} onChange={(value) => updateLandingDraft(row.id, "COLOR_FONDO_HEX", value)} />
              <ColorField label="Color texto" value={draft.COLOR_TEXTO_HEX} placeholder="#1F1235" disabled={disabled || !fieldEditable("LANDING_SECCIONES", "COLOR_TEXTO_HEX")} onChange={(value) => updateLandingDraft(row.id, "COLOR_TEXTO_HEX", value)} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
              <Toggle label="Pública" checked={draft.VISIBLE_EN_FRONTEND_PUBLICO} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_EN_FRONTEND_PUBLICO")} onChange={(value) => updateLandingDraft(row.id, "VISIBLE_EN_FRONTEND_PUBLICO", value)} />
              <Toggle label="Activa" checked={draft.REGISTRO_ACTIVO} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "REGISTRO_ACTIVO")} onChange={(value) => updateLandingDraft(row.id, "REGISTRO_ACTIVO", value)} />
              <Toggle label="Mobile" checked={draft.VISIBLE_MOBILE} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_MOBILE")} onChange={(value) => updateLandingDraft(row.id, "VISIBLE_MOBILE", value)} />
              <Toggle label="Tablet" checked={draft.VISIBLE_TABLET} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_TABLET")} onChange={(value) => updateLandingDraft(row.id, "VISIBLE_TABLET", value)} />
              <Toggle label="Desktop" checked={draft.VISIBLE_DESKTOP} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_DESKTOP")} onChange={(value) => updateLandingDraft(row.id, "VISIBLE_DESKTOP", value)} />
            </div>
          </>
        )}

        {mode === "order" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Orden visual" type="number" value={draft.ORDEN_VISUAL} disabled={disabled || !orderableSection || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")} onChange={(value) => updateLandingDraft(row.id, "ORDEN_VISUAL", value)} />
          </div>
        )}

        {mode === "media" && <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <MediaAttachmentManager row={row} field="IMAGEN_PRINCIPAL" label="Imagen/video principal" draftValue={draft.IMAGEN_PRINCIPAL_URL} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "IMAGEN_PRINCIPAL")} uploading={mediaUploading[`media:${row.id}:IMAGEN_PRINCIPAL`]} onDraftChange={(value) => updateLandingDraft(row.id, "IMAGEN_PRINCIPAL_URL", value)} onUpload={uploadLandingAttachment} onDelete={deleteLandingAttachment} helperText={landingMediaHelperText(row.CLAVE_SECCION)} />
          <MediaAttachmentManager row={row} field="IMAGENES_CARRUSEL" label="Carrusel imagen/video" draftValue={draft.IMAGENES_CARRUSEL_URLS} disabled={disabled || !fieldEditable("LANDING_SECCIONES", "IMAGENES_CARRUSEL")} uploading={mediaUploading[`media:${row.id}:IMAGENES_CARRUSEL`]} onDraftChange={(value) => updateLandingDraft(row.id, "IMAGENES_CARRUSEL_URLS", value)} onUpload={uploadLandingAttachment} onDelete={deleteLandingAttachment} helperText={landingMediaHelperText(row.CLAVE_SECCION)} multiple textarea />
        </div>}
      </section>
    );
  }

  function renderConfigEditor() {
    if (configRows.length === 0) {
      return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No hay registros de CONFIGURACION_PUBLICA filtrados para esta landing.</div>;
    }
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {configRows.map((row) => {
          const draft = configDrafts[row.id] || buildConfigDraft(row);
          const key = `config:${row.id}`;
          const disabled = !canEdit || !!rowSaving[key];
          return (
            <section key={row.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: "var(--brand-text)" }}>{row.CLAVE_CONFIGURACION || row.CATEGORIA_CONFIGURACION || "CONFIG"}</p>
                  <h4 className="font-bold" style={{ color: "var(--brand-text)" }}>{draft.NOMBRE_CONFIGURACION || row.NOMBRE_CONFIGURACION || "Configuración"}</h4>
                </div>
                <Badge active={draft.VISIBLE_EN_FRONTEND_PUBLICO}>Visible</Badge>
              </div>

              {rowMessages[key] && <div role="status" aria-live={rowMessages[key].startsWith("Error") ? "assertive" : "polite"} className={`mb-4 rounded-xl border p-3 text-sm ${rowMessages[key].startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{rowMessages[key]}</div>}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Nombre" value={draft.NOMBRE_CONFIGURACION} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "NOMBRE_CONFIGURACION")} onChange={(value) => updateConfigDraft(row.id, "NOMBRE_CONFIGURACION", value)} />
                <Field label="Orden" type="number" value={draft.ORDEN_VISUAL} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "ORDEN_VISUAL")} onChange={(value) => updateConfigDraft(row.id, "ORDEN_VISUAL", value)} />
                <TextAreaField label="Texto" value={draft.TEXTO_CONFIGURACION} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "TEXTO_CONFIGURACION")} onChange={(value) => updateConfigDraft(row.id, "TEXTO_CONFIGURACION", value)} />
                <div className="grid grid-cols-1 gap-3">
                  <Field label="URL" value={draft.URL_CONFIGURACION} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "URL_CONFIGURACION")} onChange={(value) => updateConfigDraft(row.id, "URL_CONFIGURACION", value)} />
                  <ColorField label="Color" value={draft.COLOR_HEX_CONFIGURACION} placeholder="#7C3AED" disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "COLOR_HEX_CONFIGURACION")} onChange={(value) => updateConfigDraft(row.id, "COLOR_HEX_CONFIGURACION", value)} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                <Toggle label="Sí/No" checked={draft.SI_NO_CONFIGURACION} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "SI_NO_CONFIGURACION")} onChange={(value) => updateConfigDraft(row.id, "SI_NO_CONFIGURACION", value)} />
                <Toggle label="Visible frontend" checked={draft.VISIBLE_EN_FRONTEND_PUBLICO} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "VISIBLE_EN_FRONTEND_PUBLICO")} onChange={(value) => updateConfigDraft(row.id, "VISIBLE_EN_FRONTEND_PUBLICO", value)} />
                <Toggle label="Activa" checked={draft.REGISTRO_ACTIVO} disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "REGISTRO_ACTIVO")} onChange={(value) => updateConfigDraft(row.id, "REGISTRO_ACTIVO", value)} />
              </div>

              <button type="button" disabled={disabled} onClick={() => patchConfigRow(row)} className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                {rowSaving[key] ? "Guardando…" : canEdit ? "Guardar flag" : "Solo lectura"}
              </button>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-2 rounded-b-3xl border-b border-white/50 bg-slate-50/90 px-2 py-3 backdrop-blur md:top-2 md:rounded-3xl md:border md:shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Constructor público · LANDING_BUILDER_ADMIN_UX_P5</p>
            <h2 className="text-2xl font-bold" style={{ color: "var(--brand-text)" }}>Configuración de landing</h2>
            <p className="mt-1 max-w-3xl text-sm opacity-70" style={{ color: "var(--brand-text)" }}>Organizá marca, diseño, secciones, media y SEO sin perder control de permisos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold" style={{ color: "var(--brand-text)" }}>Rol: {role}</span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold" style={{ color: "var(--brand-text)" }}>{canEdit ? "Edición habilitada" : "Solo lectura"}</span>
            <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="material-symbols-outlined text-base" aria-hidden="true">preview</span>
              Preview
            </button>
            {form && isBrandFormTab && (
              <button type="submit" form="brand-config-form" disabled={!canEdit || saving} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                {saving ? "Guardando…" : canEdit ? "Guardar config" : "Solo lectura"}
              </button>
            )}
          </div>
        </div>
        <div role="tablist" aria-label="Secciones de configuración" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(([id, label, icon]) => (
            <button key={id} id={`tab-${id}`} data-tab-id={id} role="tab" aria-selected={activeTab === id} aria-controls={`panel-${id}`} tabIndex={activeTab === id ? 0 : -1} type="button" onKeyDown={(event) => handleTabKeyDown(event, tabs.map(([tabId]) => tabId), setActiveTab)} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${activeTab === id ? "border-sky-300 bg-sky-50 text-sky-700" : "border-white/60 bg-white/70 text-slate-600 hover:bg-white"}`}>
              <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {saveMessage && (
        <div role="status" aria-live={saveMessage.startsWith("Error") ? "assertive" : "polite"} className={`rounded-xl border p-3 text-sm ${saveMessage.startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
          {saveMessage}
        </div>
      )}

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
      {form && (
        <form id="brand-config-form" onSubmit={handleSave} className="contents">
          {activeTab === "resumen" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard label="Marca" value={marca.nombre_sistema || liveConfig.brandName} hint={marca.rubro || liveConfig.rubro} />
                <InfoCard label="Secciones públicas" value={`${visibleLandingRows}/${landingRows.length}`} hint="Activas y visibles" />
                <InfoCard label="Media cargada" value={`${rowsWithMedia}/${landingRows.length}`} hint="Secciones con imagen o video" />
                <InfoCard label="SEO" value={seoReady ? "Completo" : "Pendiente"} hint="Title + description" />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
                <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
                  <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>Checklist de publicación</h3>
                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Badge active={brandReady}>Marca, rubro y logo</Badge>
                    <Badge active={visibleLandingRows > 0}>Secciones visibles</Badge>
                    <Badge active={rowsWithMedia > 0}>Media por sección</Badge>
                    <Badge active={seoReady}>SEO básico</Badge>
                    <Badge active={form.textos_publicos.contacto_whatsapp || form.textos_publicos.contacto_email}>Contacto público</Badge>
                    <Badge active={configRows.length > 0}>Flags públicos filtrados</Badge>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
                  <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>Vista rápida</h3>
                  <p className="mt-2 text-sm text-slate-500">Abrí la previsualización antes de guardar cambios grandes. Esto evita publicar a ciegas, que es donde nacen los dolores caros.</p>
                  <button type="button" onClick={() => setPreviewOpen(true)} className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Previsualizar landing</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "marca" && (
            <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
              <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>Marca e identidad básica</h3>
              <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>Campos seguros de MARCAS. Guardá desde la barra superior.</p>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <Field label="Nombre público" value={form.nombre_sistema} disabled={!canEdit} onChange={(value) => updateRoot("nombre_sistema", value)} />
                  <Field label="Nombre legal/comercial" value={form.nombre_negocio} disabled={!canEdit} onChange={(value) => updateRoot("nombre_negocio", value)} />
                  <Field label="Rubro" value={form.rubro} disabled={!canEdit} onChange={(value) => updateRoot("rubro", value)} />
                  <Field label="Logo URL" value={form.logo} disabled={!canEdit} onChange={(value) => updateRoot("logo", value)} />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                    <label className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 ${!canEdit || mediaUploading["media:marca:logo"] ? "pointer-events-none opacity-50" : ""}`}>
                      <span className="material-symbols-outlined text-base" aria-hidden="true">upload</span>
                      {mediaUploading["media:marca:logo"] ? "Procesando…" : "Subir logo (PNG/JPG/GIF)"}
                      <input
                        type="file"
                        accept="image/*,image/gif"
                        disabled={!canEdit || mediaUploading["media:marca:logo"]}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) uploadLogoAttachment(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!canEdit || !form.logo || mediaUploading["media:marca:logo"]}
                      onClick={deleteLogoAttachment}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white/70 p-4">
                  <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Preview de marca</p>
                  <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                    {form.logo ? <img src={form.logo} alt="Logo" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xs text-slate-400">Logo</div>}
                    <div>
                      <p className="text-lg font-bold" style={{ color: form.colores.texto || "var(--brand-text)" }}>{form.nombre_sistema || "Nombre público"}</p>
                      <p className="text-sm text-slate-500">{form.rubro || "Rubro"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "diseno" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
                <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>Diseño visual</h3>
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ColorField label="Primario" value={form.colores.primario} disabled={!canEdit} placeholder="#006686" onChange={(value) => updateNested("colores", "primario", value)} />
                    <ColorField label="Secundario" value={form.colores.secundario} disabled={!canEdit} placeholder="#7DD3FC" onChange={(value) => updateNested("colores", "secundario", value)} />
                    <ColorField label="Acento" value={form.colores.acento} disabled={!canEdit} placeholder="#38BDF8" onChange={(value) => updateNested("colores", "acento", value)} />
                    <ColorField label="Fondo" value={form.colores.fondo} disabled={!canEdit} placeholder="#F8F9FF" onChange={(value) => updateNested("colores", "fondo", value)} />
                    <ColorField label="Texto" value={form.colores.texto} disabled={!canEdit} placeholder="#1F1235" onChange={(value) => updateNested("colores", "texto", value)} />
                    <ColorField label="Texto secundario" value={form.colores.texto_secundario} disabled={!canEdit} placeholder="#64748B" onChange={(value) => updateNested("colores", "texto_secundario", value)} />
                    <SelectField label="Fuente títulos" value={form.colores.tipografia_titulos} disabled={!canEdit} options={landingFontOptions} onChange={(value) => updateNested("colores", "tipografia_titulos", value)} />
                    <Field label="Fuente títulos personalizada" value={form.colores.tipografia_titulos} disabled={!canEdit} placeholder="Ej: Playfair Display, serif" onChange={(value) => updateNested("colores", "tipografia_titulos", value)} />
                    <SelectField label="Fuente cuerpo" value={form.colores.tipografia_cuerpo} disabled={!canEdit} options={landingFontOptions} onChange={(value) => updateNested("colores", "tipografia_cuerpo", value)} />
                    <Field label="Fuente cuerpo personalizada" value={form.colores.tipografia_cuerpo} disabled={!canEdit} placeholder="Ej: Inter, sans-serif" onChange={(value) => updateNested("colores", "tipografia_cuerpo", value)} />
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white/70 p-4">
                    <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Identidad visual</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      {[["Primario", form.colores.primario || liveConfig.brandPrimary], ["Secundario", form.colores.secundario || liveConfig.brandSecondary], ["Acento", form.colores.acento || liveConfig.brandAccent], ["Fondo", form.colores.fondo || liveConfig.brandSurface]].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-50 p-3">
                          <div className="mb-2 h-8 rounded-lg border" style={{ background: value }} />
                          <p className="text-xs opacity-60">{label}</p>
                          <p className="font-mono text-xs">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <BackgroundLandingPanel form={form} canEdit={canEdit} updateNested={updateNested} uploading={mediaUploading[backgroundMediaKey]} onUploadFile={uploadBackgroundAttachment} />
                <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Toggle label="Mostrar servicios" checked={form.secciones_visibles.mostrar_servicios} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_servicios", value)} />
                  <Toggle label="Mostrar productos" checked={form.secciones_visibles.mostrar_productos} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_productos", value)} />
                  <Toggle label="Mostrar sucursales/contacto físico" checked={form.secciones_visibles.mostrar_sucursales} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_sucursales", value)} />
                  <Toggle label="Mostrar cómo funciona" checked={form.secciones_visibles.mostrar_como_funciona} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_como_funciona", value)} />
                  <Toggle label="Mostrar ofertas" checked={form.secciones_visibles.mostrar_ofertas} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_ofertas", value)} />
                  <Toggle label="Mostrar testimonios" checked={form.secciones_visibles.mostrar_testimonios} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_testimonios", value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "secciones" && (
            <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>Secciones de landing</h3>
                  <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>Separá contenido, orden y media para editar cada módulo con menos ruido.</p>
                </div>
                <Badge active={landingRows.length > 0}>{landingRows.length} secciones mapeadas</Badge>
              </div>
              <div role="tablist" aria-label="Editor de secciones" className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
                {[ ["contenido", "Contenido", "edit_note"], ["orden", "Orden", "swap_vert"], ["media", "Media", "perm_media"] ].map(([id, label, icon]) => (
                  <button key={id} id={`section-tab-${id}`} data-tab-id={id} role="tab" aria-selected={activeSectionTab === id} aria-controls={`section-panel-${id}`} tabIndex={activeSectionTab === id ? 0 : -1} type="button" onKeyDown={(event) => handleTabKeyDown(event, ["contenido", "orden", "media"], setActiveSectionTab, "section-tab")} onClick={() => setActiveSectionTab(id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${activeSectionTab === id ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>{label}
                  </button>
                ))}
              </div>

              {activeSectionTab === "contenido" && (
                <div id="section-panel-contenido" role="tabpanel" aria-labelledby="section-tab-contenido" tabIndex={0}>
              <div className="mb-5 rounded-3xl border border-sky-100 bg-sky-50/70 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Constructor de sección</p>
                    <h4 className="text-lg font-black text-slate-900">Creá un bloque público nuevo</h4>
                    <p className="text-sm text-slate-600">Elegí una plantilla, completá contenido mínimo y publicala como sección manual. Las imágenes y videos se agregan después: nada se sube automáticamente.</p>
                  </div>
                  <Badge active={!!constructorDraft.VISIBLE_EN_FRONTEND_PUBLICO}>Borrador visible</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {sectionTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => selectSectionTemplate(template)}
                      className={`min-h-20 rounded-2xl border p-3 text-left text-sm font-bold transition ${constructorDraft.templateKey === template.key ? "border-sky-400 bg-white text-sky-800 shadow-sm" : "border-white/70 bg-white/60 text-slate-700 hover:bg-white"}`}
                    >
                      <span className="material-symbols-outlined mb-1 block text-xl" aria-hidden="true">{template.icon}</span>
                      {template.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Field label="Título" value={constructorDraft.TITULO_PUBLICO} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("TITULO_PUBLICO", value)} />
                  <Field label="Subtítulo" value={constructorDraft.SUBTITULO_PUBLICO} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("SUBTITULO_PUBLICO", value)} />
                  <TextAreaField label="Contenido" value={constructorDraft.CONTENIDO_PUBLICO} rows={4} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("CONTENIDO_PUBLICO", value)} />
                  <div className="grid grid-cols-1 gap-3">
                    <Field label="Texto CTA" value={constructorDraft.TEXTO_BOTON_CTA} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("TEXTO_BOTON_CTA", value)} />
                    <Field label="URL CTA" value={constructorDraft.URL_BOTON_CTA} placeholder="/reserva o https://…" disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("URL_BOTON_CTA", value)} />
                  </div>
                  <ColorField label="Color fondo" value={constructorDraft.COLOR_FONDO_HEX} placeholder="#EFF6FF" disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("COLOR_FONDO_HEX", value)} />
                  <ColorField label="Color texto" value={constructorDraft.COLOR_TEXTO_HEX} placeholder="#0F172A" disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("COLOR_TEXTO_HEX", value)} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <Toggle label="Pública" checked={constructorDraft.VISIBLE_EN_FRONTEND_PUBLICO} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("VISIBLE_EN_FRONTEND_PUBLICO", value)} />
                  <Toggle label="Activa" checked={constructorDraft.REGISTRO_ACTIVO} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("REGISTRO_ACTIVO", value)} />
                  <Toggle label="Mobile" checked={constructorDraft.VISIBLE_MOBILE} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("VISIBLE_MOBILE", value)} />
                  <Toggle label="Tablet" checked={constructorDraft.VISIBLE_TABLET} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("VISIBLE_TABLET", value)} />
                  <Toggle label="Desktop" checked={constructorDraft.VISIBLE_DESKTOP} disabled={!canEdit || !!rowSaving["landing:create"]} onChange={(value) => updateConstructorDraft("VISIBLE_DESKTOP", value)} />
                </div>
                {rowMessages["landing:create"] && (
                  <div role="status" aria-live={rowMessages["landing:create"].startsWith("Error") ? "assertive" : "polite"} className={`mt-4 rounded-xl border p-3 text-sm ${rowMessages["landing:create"].startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                    {rowMessages["landing:create"]}
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-slate-500">Se crea con CLAVE_SECCION CUSTOM_*, orden automático y fuente MANUAL.</p>
                  <button
                    type="button"
                    disabled={!canEdit || !!rowSaving["landing:create"] || !constructorDraft.TITULO_PUBLICO}
                    onClick={createLandingSection}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">add_circle</span>
                    {rowSaving["landing:create"] ? "Creando…" : "Crear sección"}
                  </button>
                </div>
              </div>

                  {orderHasDraftChanges && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800" aria-live="polite">
                      Orden en borrador: previsualizá antes de guardar para confirmar el recorrido público.
                    </div>
                  )}
                  {landingRows.length === 0 ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No hay secciones LANDING_SECCIONES compatibles para editar.</div> : <div className="space-y-4">{landingRows.map((row) => renderSectionEditor(row, { mode: "content" }))}</div>}
                </div>
              )}

              {activeSectionTab === "orden" && (
                <div id="section-panel-orden" role="tabpanel" aria-labelledby="section-tab-orden" tabIndex={0}>
                  <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Orden de los bloques públicos</h4>
                      <p className="text-sm text-slate-600">Ajustá el recorrido sin abrir los campos de contenido. Los cambios quedan en borrador hasta guardarlos.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={!canEdit || !orderHasDraftChanges || !!rowSaving["landing:order"] || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")} onClick={undoLandingOrderChanges} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"><span className="material-symbols-outlined text-base" aria-hidden="true">undo</span>Deshacer</button>
                      <button type="button" disabled={!canEdit || !!rowSaving["landing:order"] || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")} onClick={resetLandingOrderToBase} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"><span className="material-symbols-outlined text-base" aria-hidden="true">restart_alt</span>Restablecer base</button>
                      <button type="button" disabled={!canEdit || !orderHasDraftChanges || !!rowSaving["landing:order"] || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")} onClick={patchLandingOrder} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50"><span className="material-symbols-outlined text-base" aria-hidden="true">swap_vert</span>{rowSaving["landing:order"] ? "Guardando orden…" : "Guardar orden"}</button>
                    </div>
                  </div>
                  {landingRows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No hay secciones para ordenar.</div> : <div className="space-y-4">{landingRows.map((row) => renderSectionEditor(row, { mode: "order" }))}</div>}
                  {saveMessage && <p aria-live="polite" className="mt-4 text-sm font-semibold text-slate-600">{saveMessage}</p>}
                </div>
              )}

              {activeSectionTab === "media" && (
                <div id="section-panel-media" role="tabpanel" aria-labelledby="section-tab-media" tabIndex={0}>
                  <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <h4 className="font-bold text-slate-900">Media por sección</h4>
                    <p className="text-sm text-slate-600">Subí archivos o agregá URLs sin mezclar estos controles con el contenido. Las cargas existentes se mantienen y usan los mismos handlers.</p>
                  </div>
                  {landingRows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No hay secciones para administrar media.</div> : <div className="space-y-4">{landingRows.map((row) => renderSectionEditor(row, { mode: "media" }))}</div>}
                </div>
              )}
              {["contenido", "orden", "media"].filter((id) => id !== activeSectionTab).map((id) => (
                <div key={id} id={`section-panel-${id}`} role="tabpanel" aria-labelledby={`section-tab-${id}`} hidden />
              ))}
            </div>
          )}

          {activeTab === "seo" && (
            <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
              <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>SEO, contenido público y contacto</h3>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>Hero y CTAs</h4>
                  <Field label="Badge" value={form.textos_publicos.hero_badge} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_badge", value)} />
                  <Field label="Título hero" value={form.textos_publicos.hero_titulo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_titulo", value)} />
                  <Field label="Subtítulo hero" value={form.textos_publicos.hero_subtitulo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_subtitulo", value)} />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="CTA primario" value={form.textos_publicos.hero_cta_primario} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_primario", value)} />
                    <Field label="URL CTA primario" value={form.textos_publicos.hero_cta_primario_url} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_primario_url", value)} />
                    <Field label="CTA secundario" value={form.textos_publicos.hero_cta_secundario} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_secundario", value)} />
                    <Field label="URL CTA secundario" value={form.textos_publicos.hero_cta_secundario_url} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_secundario_url", value)} />
                  </div>
                  <Toggle label="Banner activo" checked={form.textos_publicos.banner_activo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_activo", value)} />
                  <Field label="Título banner" value={form.textos_publicos.banner_titulo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_titulo", value)} />
                  <TextAreaField label="Mensaje banner" value={form.textos_publicos.banner_mensaje} disabled={!canEdit} rows={2} onChange={(value) => updateNested("textos_publicos", "banner_mensaje", value)} />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="CTA banner" value={form.textos_publicos.banner_cta_texto} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_cta_texto", value)} />
                    <Field label="URL CTA banner" value={form.textos_publicos.banner_cta_url} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_cta_url", value)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>SEO, contacto y redes</h4>
                  <Field label="SEO title" value={form.seo_title} disabled={!canEdit} onChange={(value) => updateRoot("seo_title", value)} />
                  <TextAreaField label="SEO description" value={form.seo_description} disabled={!canEdit} rows={2} onChange={(value) => updateRoot("seo_description", value)} />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Teléfono" value={form.textos_publicos.contacto_telefono} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_telefono", value)} />
                    <Field label="WhatsApp" value={form.textos_publicos.contacto_whatsapp} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_whatsapp", value)} />
                  </div>
                  <Field label="Email" value={form.textos_publicos.contacto_email} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_email", value)} />
                  <Field label="Dirección pública" value={form.textos_publicos.contacto_direccion} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_direccion", value)} />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Instagram" value={form.textos_publicos.redes_instagram} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "redes_instagram", value)} />
                    <Field label="Facebook" value={form.textos_publicos.redes_facebook} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "redes_facebook", value)} />
                  </div>
                  <Field label="Google Maps" value={form.textos_publicos.redes_maps} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "redes_maps", value)} />
                  <TextAreaField label="Aviso legal" value={form.legal_aviso} disabled={!canEdit} rows={2} onChange={(value) => updateRoot("legal_aviso", value)} />
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {activeTab === "avanzado" && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>Configuración pública avanzada</h3>
                <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>Editor controlado de CONFIGURACION_PUBLICA filtrado para landing y público.</p>
              </div>
              <Badge active={configRows.length > 0}>{configRows.length} flags editables</Badge>
            </div>
            {renderConfigEditor()}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-text)" }}>Comportamiento público</h3>
              <div className="flex flex-wrap gap-2">
                <Badge active={business.usesProducts}>Productos</Badge>
                <Badge active={business.usesServices}>Servicios</Badge>
                <Badge active={business.usesAppointments}>Turnos</Badge>
                <Badge active={business.usesBranches}>Sucursales</Badge>
                <Badge active={business.usesMultiBranch}>Multi-sucursal</Badge>
                <Badge active={business.showContactAddress}>Dirección pública</Badge>
                <Badge active={business.showMap}>Mapa</Badge>
                <Badge active={business.usesCart}>Carrito</Badge>
                <Badge active={business.usesCheckout}>Checkout</Badge>
                <Badge active={business.usesOnlinePayments}>Pago online</Badge>
                <Badge active={business.usesPhysicalPOS}>Caja física</Badge>
              </div>
            </div>
            <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-text)" }}>Estado del contrato</h3>
              <div className="space-y-3 text-sm" style={{ color: "var(--brand-text)" }}>
                <p><strong>Versión:</strong> {rawBusiness.contract_version || business.contractVersion || "P0.1"}</p>
                <p><strong>Pasarela de pago:</strong> {rawBusiness.payment_gateway_status || business.paymentGatewayStatus || "PENDIENTE"}</p>
                <p><strong>Flujo principal:</strong> {rawBusiness.primary_flow || business.primaryFlow || "—"}</p>
                <p><strong>Flags CONFIGURACION_PUBLICA:</strong> {state.configuracion.length}</p>
                {faltantes.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><strong>Campos faltantes:</strong> {faltantes.join(", ")}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tabs.filter(([id]) => id !== activeTab).map(([id]) => (
        <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden />
      ))}
      </div>
      <LandingPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} form={form} liveConfig={liveConfig} landingRows={landingRows} landingDrafts={landingDrafts} configRows={configRows} configDrafts={configDrafts} />
    </div>
  );
}

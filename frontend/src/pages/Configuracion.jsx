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

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-sky-400";
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
const configCategories = new Set(["BRANDING", "CTA", "CONTACTO", "SEO", "COLORES", "MODULO_VISIBLE", "LANDING", "GENERAL"]);
const configScopes = new Set(["LANDING_PUBLICA", "GLOBAL", "CONTACTO", "SEO", "PUBLICO", "PUBLICA"]);

function sortByOrder(a, b) {
  return (a.ORDEN_VISUAL ?? 999) - (b.ORDEN_VISUAL ?? 999) || String(a.CLAVE_SECCION || a.CLAVE_CONFIGURACION || "").localeCompare(String(b.CLAVE_SECCION || b.CLAVE_CONFIGURACION || ""));
}

function urlsToAttachments(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/\n|,/);
  return raw
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

function attachmentKeepPayload(attachment) {
  const id = String(attachment?.id || "").trim();
  const url = String(attachment?.url || attachment?.download_url || "").trim();
  const filename = String(attachment?.filename || "").trim();
  if (id) return { id };
  if (!url) return null;
  return {
    url,
    ...(filename ? { filename } : {}),
  };
}

function mergeAttachmentPayload(existing = [], draftUrls = "", { replace = false } = {}) {
  const kept = replace ? [] : (Array.isArray(existing) ? existing : []).map(attachmentKeepPayload).filter(Boolean);
  const added = urlsToAttachments(draftUrls);
  return [...kept, ...added];
}

function buildLandingPayload(draft = {}, currentRow = {}) {
  const {
    IMAGEN_PRINCIPAL_URL,
    IMAGENES_CARRUSEL_URLS,
    ...payload
  } = draft;
  payload.IMAGEN_PRINCIPAL = mergeAttachmentPayload(currentRow.IMAGEN_PRINCIPAL, IMAGEN_PRINCIPAL_URL);
  payload.IMAGENES_CARRUSEL = mergeAttachmentPayload(currentRow.IMAGENES_CARRUSEL, IMAGENES_CARRUSEL_URLS);
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
    <label className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
      {label}
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
    <label className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
      {label}
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
    <label className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
      {label}
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
          <p className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>{label}</p>
          <p className="text-xs text-slate-500">URL pública o archivo adjunto. Soporta imagen y video.</p>
        </div>
        <label className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ${disabled || uploading ? "pointer-events-none opacity-50" : ""}`}>
          {uploading ? "Subiendo..." : "Subir archivo"}
          <input
            type="file"
            accept="image/*,video/*"
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
            placeholder="Agregar URL nueva https://..."
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
              placeholder="https://..."
              onChange={(value) => updateNested("textos_publicos", "hero_imagen_url", value)}
            />
            <label className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 ${!canEdit || uploading ? "pointer-events-none opacity-50" : ""}`}>
              <span className="material-symbols-outlined text-base" aria-hidden="true">upload</span>
              {uploading ? "Subiendo fondo..." : "Subir archivo de fondo"}
              <input
                type="file"
                accept="image/*,video/*"
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
        Cargando configuración de marca blanca...
      </div>
    );
  }

  if (state.error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Error: {state.error}</div>;
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
      const res = await fetch(`${API}/api/backoffice/landing-secciones/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildLandingPayload(landingDrafts[row.id] || buildLandingDraft(row), row)),
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
      .map(attachmentKeepPayload)
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
    .filter((row) => landingKeys.includes(row.CLAVE_SECCION))
    .sort(sortByOrder);
  const backgroundMediaRow = landingRows.find((row) => row.CLAVE_SECCION === "HOME_HERO_PRINCIPAL") || landingRows[0];
  const backgroundMediaKey = backgroundMediaRow ? `media:${backgroundMediaRow.id}:IMAGEN_PRINCIPAL` : "media:background:hero";
  const configRows = [...state.configuracion]
    .filter((row) => {
      const category = String(row.CATEGORIA_CONFIGURACION || "").trim().toUpperCase();
      const scope = String(row.AMBITO_APLICACION || "").trim().toUpperCase();
      return configCategories.has(category) || configScopes.has(scope);
    })
    .sort(sortByOrder);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>
            Contrato P0 marca blanca
          </p>
          <h2 className="text-2xl font-bold" style={{ color: "var(--brand-text)" }}>
            Configuración del negocio
          </h2>
          <p className="mt-1 max-w-3xl text-sm opacity-70" style={{ color: "var(--brand-text)" }}>
            Esta pantalla traduce MARCAS, CONFIGURACION_PUBLICA y MODULOS en comportamiento real del frontend y backoffice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold" style={{ color: "var(--brand-text)" }}>
            Rol: {role}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold" style={{ color: "var(--brand-text)" }}>
            {canEdit ? "Edición habilitada por permisos" : "Solo lectura"}
          </span>
        </div>
      </div>

      {form && (
        <form onSubmit={handleSave} className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>
                Editor de marca blanca
              </h3>
              <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>
                Edita campos seguros de MARCAS. Los cambios impactan en frontend después de guardar.
              </p>
            </div>
            <button
              type="submit"
              disabled={!canEdit || saving}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
            >
              {saving ? "Guardando..." : canEdit ? "Guardar configuración" : "Solo lectura"}
            </button>
          </div>

          {saveMessage && (
            <div className={`mb-4 rounded-xl border p-3 text-sm ${saveMessage.startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>
                Identidad
              </h4>
              <Field label="Nombre público" value={form.nombre_sistema} disabled={!canEdit} onChange={(value) => updateRoot("nombre_sistema", value)} />
              <Field label="Nombre legal/comercial" value={form.nombre_negocio} disabled={!canEdit} onChange={(value) => updateRoot("nombre_negocio", value)} />
              <Field label="Rubro" value={form.rubro} disabled={!canEdit} onChange={(value) => updateRoot("rubro", value)} />
              <Field label="Logo URL" value={form.logo} disabled={!canEdit} onChange={(value) => updateRoot("logo", value)} />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>
                Colores
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <ColorField label="Primario" value={form.colores.primario} disabled={!canEdit} placeholder="#006686" onChange={(value) => updateNested("colores", "primario", value)} />
                <ColorField label="Secundario" value={form.colores.secundario} disabled={!canEdit} placeholder="#7DD3FC" onChange={(value) => updateNested("colores", "secundario", value)} />
                <ColorField label="Acento" value={form.colores.acento} disabled={!canEdit} placeholder="#38BDF8" onChange={(value) => updateNested("colores", "acento", value)} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>
                Modelo visible
              </h4>
              <Toggle label="Mostrar servicios" checked={form.secciones_visibles.mostrar_servicios} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_servicios", value)} />
              <Toggle label="Mostrar productos" checked={form.secciones_visibles.mostrar_productos} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_productos", value)} />
              <Toggle label="Mostrar sucursales/contacto físico" checked={form.secciones_visibles.mostrar_sucursales} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_sucursales", value)} />
              <Toggle label="Mostrar cómo funciona" checked={form.secciones_visibles.mostrar_como_funciona} disabled={!canEdit} onChange={(value) => updateNested("secciones_visibles", "mostrar_como_funciona", value)} />
              <Toggle label="Banner activo" checked={form.textos_publicos.banner_activo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_activo", value)} />
            </div>
          </div>

          <BackgroundLandingPanel
            form={form}
            canEdit={canEdit}
            updateNested={updateNested}
            uploading={mediaUploading[backgroundMediaKey]}
            onUploadFile={uploadBackgroundAttachment}
          />

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>
                Hero y CTAs
              </h4>
              <Field label="Badge" value={form.textos_publicos.hero_badge} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_badge", value)} />
              <Field label="Título hero" value={form.textos_publicos.hero_titulo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_titulo", value)} />
              <Field label="Subtítulo hero" value={form.textos_publicos.hero_subtitulo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_subtitulo", value)} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="CTA primario" value={form.textos_publicos.hero_cta_primario} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_primario", value)} />
                <Field label="URL CTA primario" value={form.textos_publicos.hero_cta_primario_url} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_primario_url", value)} />
                <Field label="CTA secundario" value={form.textos_publicos.hero_cta_secundario} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_secundario", value)} />
                <Field label="URL CTA secundario" value={form.textos_publicos.hero_cta_secundario_url} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "hero_cta_secundario_url", value)} />
                <Field label="CTA banner" value={form.textos_publicos.banner_cta_texto} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_cta_texto", value)} />
                <Field label="URL CTA banner" value={form.textos_publicos.banner_cta_url} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_cta_url", value)} />
              </div>
              <Field label="Título banner" value={form.textos_publicos.banner_titulo} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "banner_titulo", value)} />
              <TextAreaField label="Mensaje banner" value={form.textos_publicos.banner_mensaje} disabled={!canEdit} rows={2} onChange={(value) => updateNested("textos_publicos", "banner_mensaje", value)} />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wide opacity-60" style={{ color: "var(--brand-text)" }}>
                Contacto y SEO
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Teléfono" value={form.textos_publicos.contacto_telefono} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_telefono", value)} />
                <Field label="WhatsApp" value={form.textos_publicos.contacto_whatsapp} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_whatsapp", value)} />
              </div>
              <Field label="Email" value={form.textos_publicos.contacto_email} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_email", value)} />
              <Field label="Dirección pública" value={form.textos_publicos.contacto_direccion} disabled={!canEdit} onChange={(value) => updateNested("textos_publicos", "contacto_direccion", value)} />
              <Field label="SEO title" value={form.seo_title} disabled={!canEdit} onChange={(value) => updateRoot("seo_title", value)} />
              <Field label="SEO description" value={form.seo_description} disabled={!canEdit} onChange={(value) => updateRoot("seo_description", value)} />
            </div>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>
              Constructor de landing
            </h3>
            <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>
              Edita LANDING_SECCIONES sin tocar código. El frontend público lee estas secciones con cache deshabilitado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge active={landingRows.length > 0}>{landingRows.length} secciones mapeadas</Badge>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">preview</span>
              Previsualizar landing
            </button>
          </div>
        </div>

        {landingRows.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No hay secciones LANDING_SECCIONES compatibles para editar.
          </div>
        ) : (
          <div className="space-y-4">
            {landingRows.map((row) => {
              const draft = landingDrafts[row.id] || buildLandingDraft(row);
              const key = `landing:${row.id}`;
              const disabled = !canEdit || !!rowSaving[key];
              return (
                <section key={row.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-base" aria-hidden="true">visibility</span>
                        Previsualizar
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => patchLandingRow(row)}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                      >
                        {rowSaving[key] ? "Guardando..." : canEdit ? "Guardar sección" : "Solo lectura"}
                      </button>
                    </div>
                  </div>

                  {rowMessages[key] && (
                    <div className={`mb-4 rounded-xl border p-3 text-sm ${rowMessages[key].startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                      {rowMessages[key]}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Field
                      label="Nombre interno visible"
                      value={draft.NOMBRE_SECCION}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "NOMBRE_SECCION")}
                      onChange={(value) => updateLandingDraft(row.id, "NOMBRE_SECCION", value)}
                    />
                    <Field
                      label="Orden"
                      type="number"
                      value={draft.ORDEN_VISUAL}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "ORDEN_VISUAL")}
                      onChange={(value) => updateLandingDraft(row.id, "ORDEN_VISUAL", value)}
                    />
                    <Field
                      label="Título público"
                      value={draft.TITULO_PUBLICO}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "TITULO_PUBLICO")}
                      onChange={(value) => updateLandingDraft(row.id, "TITULO_PUBLICO", value)}
                    />
                    <Field
                      label="Subtítulo público"
                      value={draft.SUBTITULO_PUBLICO}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "SUBTITULO_PUBLICO")}
                      onChange={(value) => updateLandingDraft(row.id, "SUBTITULO_PUBLICO", value)}
                    />
                    <TextAreaField
                      label="Contenido público"
                      value={draft.CONTENIDO_PUBLICO}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "CONTENIDO_PUBLICO")}
                      onChange={(value) => updateLandingDraft(row.id, "CONTENIDO_PUBLICO", value)}
                    />
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="Texto CTA"
                        value={draft.TEXTO_BOTON_CTA}
                        disabled={disabled || !fieldEditable("LANDING_SECCIONES", "TEXTO_BOTON_CTA")}
                        onChange={(value) => updateLandingDraft(row.id, "TEXTO_BOTON_CTA", value)}
                      />
                      <Field
                        label="URL CTA"
                        value={draft.URL_BOTON_CTA}
                        disabled={disabled || !fieldEditable("LANDING_SECCIONES", "URL_BOTON_CTA")}
                        onChange={(value) => updateLandingDraft(row.id, "URL_BOTON_CTA", value)}
                      />
                    </div>
                    <MediaAttachmentManager
                      row={row}
                      field="IMAGEN_PRINCIPAL"
                      label="Imagen/video principal"
                      draftValue={draft.IMAGEN_PRINCIPAL_URL}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "IMAGEN_PRINCIPAL")}
                      uploading={mediaUploading[`media:${row.id}:IMAGEN_PRINCIPAL`]}
                      onDraftChange={(value) => updateLandingDraft(row.id, "IMAGEN_PRINCIPAL_URL", value)}
                      onUpload={uploadLandingAttachment}
                      onDelete={deleteLandingAttachment}
                    />
                    <MediaAttachmentManager
                      row={row}
                      field="IMAGENES_CARRUSEL"
                      label="Carrusel imagen/video"
                      draftValue={draft.IMAGENES_CARRUSEL_URLS}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "IMAGENES_CARRUSEL")}
                      uploading={mediaUploading[`media:${row.id}:IMAGENES_CARRUSEL`]}
                      onDraftChange={(value) => updateLandingDraft(row.id, "IMAGENES_CARRUSEL_URLS", value)}
                      onUpload={uploadLandingAttachment}
                      onDelete={deleteLandingAttachment}
                      multiple
                      textarea
                    />
                    <ColorField
                      label="Color fondo"
                      value={draft.COLOR_FONDO_HEX}
                      placeholder="#FDF4FF"
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "COLOR_FONDO_HEX")}
                      onChange={(value) => updateLandingDraft(row.id, "COLOR_FONDO_HEX", value)}
                    />
                    <ColorField
                      label="Color texto"
                      value={draft.COLOR_TEXTO_HEX}
                      placeholder="#1F1235"
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "COLOR_TEXTO_HEX")}
                      onChange={(value) => updateLandingDraft(row.id, "COLOR_TEXTO_HEX", value)}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
                    <Toggle
                      label="Pública"
                      checked={draft.VISIBLE_EN_FRONTEND_PUBLICO}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_EN_FRONTEND_PUBLICO")}
                      onChange={(value) => updateLandingDraft(row.id, "VISIBLE_EN_FRONTEND_PUBLICO", value)}
                    />
                    <Toggle
                      label="Activa"
                      checked={draft.REGISTRO_ACTIVO}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "REGISTRO_ACTIVO")}
                      onChange={(value) => updateLandingDraft(row.id, "REGISTRO_ACTIVO", value)}
                    />
                    <Toggle
                      label="Mobile"
                      checked={draft.VISIBLE_MOBILE}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_MOBILE")}
                      onChange={(value) => updateLandingDraft(row.id, "VISIBLE_MOBILE", value)}
                    />
                    <Toggle
                      label="Tablet"
                      checked={draft.VISIBLE_TABLET}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_TABLET")}
                      onChange={(value) => updateLandingDraft(row.id, "VISIBLE_TABLET", value)}
                    />
                    <Toggle
                      label="Desktop"
                      checked={draft.VISIBLE_DESKTOP}
                      disabled={disabled || !fieldEditable("LANDING_SECCIONES", "VISIBLE_DESKTOP")}
                      onChange={(value) => updateLandingDraft(row.id, "VISIBLE_DESKTOP", value)}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <LandingPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={form}
        liveConfig={liveConfig}
        landingRows={landingRows}
        landingDrafts={landingDrafts}
        configRows={configRows}
        configDrafts={configDrafts}
      />

      <div className="rounded-3xl border border-white/40 bg-white/75 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>
              Configuración pública rápida
            </h3>
            <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>
              Edita claves seguras de CONFIGURACION_PUBLICA. No se exponen notas internas ni campos sensibles.
            </p>
          </div>
          <Badge active={configRows.length > 0}>{configRows.length} flags editables</Badge>
        </div>

        {configRows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No hay registros de CONFIGURACION_PUBLICA filtrados para esta landing.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {configRows.map((row) => {
              const draft = configDrafts[row.id] || buildConfigDraft(row);
              const key = `config:${row.id}`;
              const disabled = !canEdit || !!rowSaving[key];
              return (
                <section key={row.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: "var(--brand-text)" }}>
                        {row.CLAVE_CONFIGURACION || row.CATEGORIA_CONFIGURACION || "CONFIG"}
                      </p>
                      <h4 className="font-bold" style={{ color: "var(--brand-text)" }}>
                        {draft.NOMBRE_CONFIGURACION || row.NOMBRE_CONFIGURACION || "Configuración"}
                      </h4>
                    </div>
                    <Badge active={draft.VISIBLE_EN_FRONTEND_PUBLICO}>Visible</Badge>
                  </div>

                  {rowMessages[key] && (
                    <div className={`mb-4 rounded-xl border p-3 text-sm ${rowMessages[key].startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                      {rowMessages[key]}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field
                      label="Nombre"
                      value={draft.NOMBRE_CONFIGURACION}
                      disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "NOMBRE_CONFIGURACION")}
                      onChange={(value) => updateConfigDraft(row.id, "NOMBRE_CONFIGURACION", value)}
                    />
                    <Field
                      label="Orden"
                      type="number"
                      value={draft.ORDEN_VISUAL}
                      disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "ORDEN_VISUAL")}
                      onChange={(value) => updateConfigDraft(row.id, "ORDEN_VISUAL", value)}
                    />
                    <TextAreaField
                      label="Texto"
                      value={draft.TEXTO_CONFIGURACION}
                      disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "TEXTO_CONFIGURACION")}
                      onChange={(value) => updateConfigDraft(row.id, "TEXTO_CONFIGURACION", value)}
                    />
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="URL"
                        value={draft.URL_CONFIGURACION}
                        disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "URL_CONFIGURACION")}
                        onChange={(value) => updateConfigDraft(row.id, "URL_CONFIGURACION", value)}
                      />
                      <ColorField
                        label="Color"
                        value={draft.COLOR_HEX_CONFIGURACION}
                        placeholder="#7C3AED"
                        disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "COLOR_HEX_CONFIGURACION")}
                        onChange={(value) => updateConfigDraft(row.id, "COLOR_HEX_CONFIGURACION", value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <Toggle
                      label="Sí/No"
                      checked={draft.SI_NO_CONFIGURACION}
                      disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "SI_NO_CONFIGURACION")}
                      onChange={(value) => updateConfigDraft(row.id, "SI_NO_CONFIGURACION", value)}
                    />
                    <Toggle
                      label="Visible frontend"
                      checked={draft.VISIBLE_EN_FRONTEND_PUBLICO}
                      disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "VISIBLE_EN_FRONTEND_PUBLICO")}
                      onChange={(value) => updateConfigDraft(row.id, "VISIBLE_EN_FRONTEND_PUBLICO", value)}
                    />
                    <Toggle
                      label="Activa"
                      checked={draft.REGISTRO_ACTIVO}
                      disabled={disabled || !fieldEditable("CONFIGURACION_PUBLICA", "REGISTRO_ACTIVO")}
                      onChange={(value) => updateConfigDraft(row.id, "REGISTRO_ACTIVO", value)}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => patchConfigRow(row)}
                    className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}
                  >
                    {rowSaving[key] ? "Guardando..." : canEdit ? "Guardar flag" : "Solo lectura"}
                  </button>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Marca" value={marca.nombre_sistema || liveConfig.brandName} hint={marca.rubro || liveConfig.rubro} />
        <InfoCard label="Modo de oferta" value={rawBusiness.modo_oferta || business.offerMode} hint={business.catalogLabel} />
        <InfoCard label="Canal" value={rawBusiness.canal_operacion || business.operationChannel} hint="Online, físico o mixto" />
        <InfoCard label="Landing config" value={state.landing.length} hint={`${state.configuracion.length} flags públicos`} />
      </div>

      <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-text)" }}>
          Comportamiento público
        </h3>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-text)" }}>
            Identidad visual
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Primario", liveConfig.brandPrimary],
              ["Secundario", liveConfig.brandSecondary],
              ["Acento", liveConfig.brandAccent],
              ["Fondo", liveConfig.brandSurface],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <div className="mb-2 h-8 rounded-lg border" style={{ background: value }} />
                <p className="text-xs opacity-60">{label}</p>
                <p className="font-mono text-xs">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-text)" }}>
            Estado del contrato
          </h3>
          <div className="space-y-3 text-sm" style={{ color: "var(--brand-text)" }}>
            <p>
              <strong>Versión:</strong> {rawBusiness.contract_version || business.contractVersion || "P0.1"}
            </p>
            <p>
              <strong>Pasarela de pago:</strong> {rawBusiness.payment_gateway_status || business.paymentGatewayStatus || "PENDIENTE"}
            </p>
            <p>
              <strong>Flujo principal:</strong> {rawBusiness.primary_flow || business.primaryFlow || "—"}
            </p>
            <p>
              <strong>Flags CONFIGURACION_PUBLICA:</strong> {state.configuracion.length}
            </p>
            {faltantes.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Campos faltantes:</strong> {faltantes.join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

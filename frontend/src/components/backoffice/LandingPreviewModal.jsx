import { useEffect, useMemo, useState } from "react";
import { formatPublicName, getPublicServiceImage } from "../../utils/publicDataFilters";
import { formatCategoria } from "../../utils/displayFormatters";

const API = import.meta.env.VITE_API_BASE_URL || "";

const DEVICES = {
  mobile: { label: "Celular", icon: "smartphone", width: 390, hint: "Mobile first · 390px" },
  tablet: { label: "Tablet", icon: "tablet_mac", width: 760, hint: "Tablet · 760px" },
  desktop: { label: "Web", icon: "desktop_windows", width: 1120, hint: "Desktop · 1120px" },
};

function normalizeHex(value, fallback) {
  if (!value) return fallback;
  const raw = String(value).trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw}`;
  }
  return fallback;
}

function normalizeBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  return value !== false;
}

function mergeRows(rows = [], drafts = {}) {
  return rows.map((row) => ({ ...row, ...(drafts[row.id] || {}) }));
}

function sectionMap(rows = [], device = "mobile") {
  const visibilityField = {
    mobile: "VISIBLE_MOBILE",
    tablet: "VISIBLE_TABLET",
    desktop: "VISIBLE_DESKTOP",
  }[device];

  return rows.reduce((acc, row) => {
    const active = normalizeBool(row.REGISTRO_ACTIVO, true);
    const publicVisible = normalizeBool(row.VISIBLE_EN_FRONTEND_PUBLICO, true);
    const deviceVisible = normalizeBool(row[visibilityField], true);
    if (row.CLAVE_SECCION && active && publicVisible && deviceVisible) {
      acc[row.CLAVE_SECCION] = row;
    }
    return acc;
  }, {});
}

function getSection(sections, ...keys) {
  return keys.map((key) => sections[key]).find(Boolean) || null;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  return `$${parsed.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function useCatalogSamples(open) {
  const [state, setState] = useState({ services: [], products: [] });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      const [servicesResult, productsResult] = await Promise.allSettled([
        fetch(`${API}/api/servicios-web`, { cache: "no-store" }).then((response) => (response.ok ? response.json() : null)),
        fetch(`${API}/api/productos-web`, { cache: "no-store" }).then((response) => (response.ok ? response.json() : null)),
      ]);

      if (cancelled) return;
      const servicePayload = servicesResult.status === "fulfilled" ? servicesResult.value : null;
      const productPayload = productsResult.status === "fulfilled" ? productsResult.value : null;
      const services = (Array.isArray(servicePayload) ? servicePayload : servicePayload?.servicios_web || [])
        .filter((item) => item?.NOMBRE_PUBLICO_SERVICIO || item?.NOMBRE_SERVICIO)
        .slice(0, 3);
      const products = (productPayload?.productos || [])
        .filter((item) => item?.nombre_visible)
        .slice(0, 3);

      setState({ services, products });
    }

    load().catch(() => setState({ services: [], products: [] }));
    return () => {
      cancelled = true;
    };
  }, [open]);

  return state;
}

function DeviceChrome({ device, children }) {
  const meta = DEVICES[device] || DEVICES.mobile;
  const isMobile = device === "mobile";

  return (
    <div className="flex justify-center overflow-auto rounded-3xl bg-slate-100/80 p-3 sm:p-5">
      <div
        className={`overflow-hidden border bg-white shadow-2xl ${isMobile ? "rounded-[2.25rem] border-slate-300" : "rounded-3xl border-slate-200"}`}
        style={{ width: meta.width, maxWidth: "100%" }}
      >
        {isMobile && (
          <div className="flex h-7 items-center justify-center bg-slate-950">
            <div className="h-1.5 w-20 rounded-full bg-white/25" />
          </div>
        )}
        <div className="max-h-[68vh] overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  );
}

function PreviewCard({ title, subtitle, price, image, icon = "auto_awesome" }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm">
      <div className="aspect-[4/3] bg-slate-100">
        {image?.url ? (
          <img src={image.url} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--preview-secondary)] to-[var(--preview-primary)] text-white">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">{icon}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h4 className="line-clamp-2 text-sm font-bold" style={{ color: "var(--preview-text)" }}>{title}</h4>
        {subtitle && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--preview-muted)" }}>{subtitle}</p>}
        <div className="mt-auto pt-3 text-sm font-bold" style={{ color: "var(--preview-primary)" }}>{price || "Ver detalle"}</div>
      </div>
    </article>
  );
}

function LandingPreview({ device, form, liveConfig, rows, drafts, samples }) {
  const mergedRows = useMemo(() => mergeRows(rows, drafts), [rows, drafts]);
  const sections = useMemo(() => sectionMap(mergedRows, device), [mergedRows, device]);
  const hero = getSection(sections, "HOME_HERO_PRINCIPAL");
  const services = getSection(sections, "HOME_SERVICIOS_DESTACADOS");
  const products = getSection(sections, "HOME_PRODUCTOS_DESTACADOS");
  const how = getSection(sections, "HOME_BLOQUE_RESERVAS", "HOME_AGENDA_PUBLICA");
  const contact = getSection(sections, "HOME_SUCURSALES_CONTACTO", "HOME_CONTACTO_RAPIDO");
  const final = getSection(sections, "HOME_FOOTER", "HOME_PORTAL_CLIENTES");

  const colors = form?.colores || {};
  const textos = form?.textos_publicos || {};
  const visible = form?.secciones_visibles || {};
  const business = liveConfig?.business || {};
  const brandName = form?.nombre_sistema || liveConfig?.brandName || "Tu marca";
  const showServices = visible.mostrar_servicios !== false && business.usesServices !== false && !!services;
  const showProducts = visible.mostrar_productos !== false && business.usesProducts !== false && !!products;
  const showBranches = visible.mostrar_sucursales !== false && business.usesBranches !== false;
  const showHow = visible.mostrar_como_funciona !== false && !!how;

  const style = {
    "--preview-primary": normalizeHex(colors.primario, liveConfig?.brandPrimary || "#7C3AED"),
    "--preview-secondary": normalizeHex(colors.secundario, liveConfig?.brandSecondary || "#F0ABFC"),
    "--preview-accent": normalizeHex(colors.acento, liveConfig?.brandAccent || "#EC4899"),
    "--preview-surface": normalizeHex(colors.fondo, liveConfig?.brandSurface || "#FDF4FF"),
    "--preview-text": normalizeHex(colors.texto, liveConfig?.brandText || "#1F1235"),
    "--preview-muted": normalizeHex(colors.texto_secundario, liveConfig?.brandTextSecondary || "#6B4A7A"),
  };

  const heroTitle = hero?.TITULO_PUBLICO || textos.hero_titulo || liveConfig?.heroTitle || `${brandName}: experiencia digital para tu negocio`;
  const heroSubtitle = hero?.SUBTITULO_PUBLICO || textos.hero_subtitulo || liveConfig?.heroSubtitle || "Catálogo, reservas y portal cliente configurables desde backoffice.";
  const primaryCta = hero?.TEXTO_BOTON_CTA || textos.hero_cta_primario || liveConfig?.heroCtaPrimary || "Reservar";
  const serviceItems = samples.services.length ? samples.services : [];
  const productItems = samples.products.length ? samples.products : [];

  return (
    <div style={style} className="min-h-full bg-[var(--preview-surface)] font-sans">
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, var(--preview-secondary), var(--preview-primary))" }}>
              <span className="material-symbols-outlined text-base">auto_awesome</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black" style={{ color: "var(--preview-text)" }}>{brandName}</p>
              <p className="truncate text-[11px]" style={{ color: "var(--preview-muted)" }}>{form?.rubro || liveConfig?.rubro || "Marca blanca"}</p>
            </div>
          </div>
          <button className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: "var(--preview-primary)" }}>{primaryCta}</button>
        </div>
      </header>

      <main className="space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid gap-5 md:grid-cols-[1.4fr_0.8fr] md:items-center">
          <div className="space-y-4">
            {(hero?.NOMBRE_SECCION || textos.hero_badge || liveConfig?.heroBadge) && (
              <span className="inline-flex rounded-full bg-white/75 px-3 py-1 text-xs font-bold" style={{ color: "var(--preview-primary)" }}>
                {textos.hero_badge || liveConfig?.heroBadge || hero?.NOMBRE_SECCION}
              </span>
            )}
            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl" style={{ color: "var(--preview-text)" }}>{heroTitle}</h1>
            <p className="max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--preview-muted)" }}>{heroSubtitle}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="rounded-2xl px-5 py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--preview-secondary), var(--preview-primary))" }}>{primaryCta}</button>
              <button className="rounded-2xl bg-white/75 px-5 py-3 text-sm font-bold" style={{ color: "var(--preview-text)" }}>{textos.hero_cta_secundario || liveConfig?.heroCtaSecondary || "Ver catálogo"}</button>
            </div>
          </div>
          <div className="hidden rounded-[2rem] bg-white/70 p-5 shadow-sm md:block">
            <div className="aspect-square rounded-[1.5rem] bg-gradient-to-br from-[var(--preview-secondary)] to-[var(--preview-primary)] p-6 text-white">
              <span className="material-symbols-outlined text-5xl">spa</span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Preview</p>
              <p className="mt-2 text-2xl font-black">{brandName}</p>
            </div>
          </div>
        </section>

        {showServices && (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-black" style={{ color: "var(--preview-text)" }}>{services?.TITULO_PUBLICO || "Servicios destacados"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--preview-muted)" }}>{services?.SUBTITULO_PUBLICO || "Servicios publicados desde el backend."}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(serviceItems.length ? serviceItems : [{ id: "service-empty", NOMBRE_PUBLICO_SERVICIO: "Servicios publicados", DESCRIPCION_WEB: "Cuando cargues servicios, se verán acá." }]).map((item, index) => {
                const title = formatPublicName(item.NOMBRE_PUBLICO_SERVICIO || item.NOMBRE_SERVICIO || "Servicio publicado");
                return (
                  <PreviewCard
                    key={item.id || index}
                    title={title}
                    subtitle={item.DESCRIPCION_WEB || item.DESCRIPCION || ""}
                    price={formatMoney(item.PRECIO_WEB ?? item.PRECIO_PUBLICITADO_WEB)}
                    image={getPublicServiceImage(item)}
                    icon="content_cut"
                  />
                );
              })}
            </div>
          </section>
        )}

        {showProducts && (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-black" style={{ color: "var(--preview-text)" }}>{products?.TITULO_PUBLICO || "Productos destacados"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--preview-muted)" }}>{products?.SUBTITULO_PUBLICO || "Productos publicados desde el backend."}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(productItems.length ? productItems : [{ slug: "product-empty", nombre_visible: "Productos publicados", descripcion_visible: "Cuando cargues productos, se verán acá." }]).map((item, index) => (
                <PreviewCard
                  key={item.slug || index}
                  title={item.nombre_visible || "Producto publicado"}
                  subtitle={item.descripcion_visible || formatCategoria(item.categoria_publica)}
                  price={formatMoney(item.precio_visible)}
                  image={item.imagen_principal}
                  icon="inventory_2"
                />
              ))}
            </div>
          </section>
        )}

        {showHow && (
          <section className="rounded-[2rem] bg-white/70 p-5 shadow-sm">
            <h2 className="text-2xl font-black" style={{ color: "var(--preview-text)" }}>{how?.TITULO_PUBLICO || "¿Cómo funciona?"}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--preview-muted)" }}>{how?.SUBTITULO_PUBLICO || "Flujo simple para que el cliente entienda qué hacer."}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Explorá", "Elegí", "Confirmá"].map((item, index) => (
                <div key={item} className="rounded-2xl bg-white/80 p-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: "var(--preview-primary)" }}>{index + 1}</div>
                  <p className="mt-3 text-sm font-bold" style={{ color: "var(--preview-text)" }}>{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(showBranches || final) && (
          <section className="grid gap-3 md:grid-cols-2">
            {showBranches && (
              <div className="rounded-[2rem] bg-white/70 p-5 shadow-sm">
                <span className="material-symbols-outlined" style={{ color: "var(--preview-primary)" }}>location_on</span>
                <h3 className="mt-2 text-xl font-black" style={{ color: "var(--preview-text)" }}>{contact?.TITULO_PUBLICO || "Ubicación y contacto"}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--preview-muted)" }}>{contact?.SUBTITULO_PUBLICO || textos.contacto_direccion || liveConfig?.address || "Contacto visible según configuración."}</p>
              </div>
            )}
            <div className="rounded-[2rem] p-5 text-center shadow-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), color-mix(in srgb, var(--preview-primary) 14%, white))" }}>
              <h3 className="text-xl font-black" style={{ color: "var(--preview-text)" }}>{final?.TITULO_PUBLICO || "Listo para empezar"}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--preview-muted)" }}>{final?.SUBTITULO_PUBLICO || "CTA final de la landing pública."}</p>
              <button className="mt-4 rounded-2xl px-5 py-3 text-sm font-bold text-white" style={{ background: "var(--preview-primary)" }}>{final?.TEXTO_BOTON_CTA || primaryCta}</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function LandingPreviewModal({ open, onClose, form, liveConfig, landingRows = [], landingDrafts = {} }) {
  const [device, setDevice] = useState("mobile");
  const samples = useCatalogSamples(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const meta = DEVICES[device] || DEVICES.mobile;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Previsualizador de landing">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Previsualización en borrador</p>
              <h3 className="text-xl font-black text-slate-900">Landing pública</h3>
              <p className="mt-1 text-sm text-slate-500">Ves los cambios del formulario antes de guardarlos o publicarlos.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(DEVICES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDevice(key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold transition ${device === key ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  aria-pressed={device === key}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100">
                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
                Cerrar
              </button>
            </div>
          </div>
          <div className="mt-3 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
            {meta.hint}
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3 sm:p-5">
          <DeviceChrome device={device}>
            <LandingPreview
              device={device}
              form={form}
              liveConfig={liveConfig}
              rows={landingRows}
              drafts={landingDrafts}
              samples={samples}
            />
          </DeviceChrome>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

async function fetchJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
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
      banner_activo: !!textos.banner_activo,
      banner_titulo: textos.banner_titulo || "",
      banner_mensaje: textos.banner_mensaje || "",
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
  const { role, permisos } = useAuth();
  const { config: liveConfig, refresh } = useBrandConfig();
  const [state, setState] = useState({
    loading: true,
    error: null,
    marca: null,
    configuracion: [],
    modulos: [],
  });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      try {
        const [marca, conf, modulos] = await Promise.all([
          fetchJson("/api/marca-blanca"),
          fetchJson("/api/configuracion-publica"),
          fetchJson("/api/modulos"),
        ]);

        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          marca,
          configuracion: conf.configuracion || [],
          modulos: modulos.modulos || [],
        });
        setForm(buildForm(marca));
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
  const activeModules = state.modulos.filter((m) => m.ACTIVO === true || m.activo === true);
  const faltantes = marca.faltantes || [];
  const canEdit = !!(permisos?.configuracion && permisos?.editar);

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
            {permisos?.editar ? "Edición habilitada por rol" : "Solo lectura"}
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
                <Field label="Primario" value={form.colores.primario} disabled={!canEdit} placeholder="006686" onChange={(value) => updateNested("colores", "primario", value)} />
                <Field label="Secundario" value={form.colores.secundario} disabled={!canEdit} placeholder="7DD3FC" onChange={(value) => updateNested("colores", "secundario", value)} />
                <Field label="Acento" value={form.colores.acento} disabled={!canEdit} placeholder="38BDF8" onChange={(value) => updateNested("colores", "acento", value)} />
                <Field label="Fondo" value={form.colores.fondo} disabled={!canEdit} placeholder="F8F9FF" onChange={(value) => updateNested("colores", "fondo", value)} />
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
              </div>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Marca" value={marca.nombre_sistema || liveConfig.brandName} hint={marca.rubro || liveConfig.rubro} />
        <InfoCard label="Modo de oferta" value={rawBusiness.modo_oferta || business.offerMode} hint={business.catalogLabel} />
        <InfoCard label="Canal" value={rawBusiness.canal_operacion || business.operationChannel} hint="Online, físico o mixto" />
        <InfoCard label="Módulos activos" value={activeModules.length} hint={`${state.modulos.length} módulos totales`} />
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

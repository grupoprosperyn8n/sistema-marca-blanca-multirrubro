import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

async function fetchJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
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
  const { config: liveConfig } = useBrandConfig();
  const [state, setState] = useState({
    loading: true,
    error: null,
    marca: null,
    configuracion: [],
    modulos: [],
  });

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

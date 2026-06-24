import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatPublicName } from "../utils/publicDataFilters";
import SucursalesPublicas from "./SucursalesPublicas";
import { formatCategoria } from "../utils/displayFormatters";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Home() {
  const { config } = useBrandConfig();
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/servicios-web`)
      .then(r => r.json())
      .then(d => {
        const raw = Array.isArray(d) ? d : d.servicios_web || [];
        const publicos = raw.filter(s => {
          const nombre = (s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "").trim();
          return nombre && nombre.toUpperCase() !== "SERVICIO" && nombre.length > 3;
        }).slice(0, 6);
        setServicios(publicos);
      })
      .catch(() => {});

    fetch(`${API}/api/productos-web`)
      .then(r => r.json())
      .then(d => {
        const items = d.productos || [];
        const anomalos = (d.anomalias || []).map(a => a.nombre || a.id);
        setProductos(items.filter(p => !anomalos.includes(p.nombre_visible)).slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const formatearMoneda = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return "";
    return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  };

  const iconos = ["content_cut", "spa", "brush", "face", "style", "auto_awesome"];

  const sec = config.seccionesVisibles || {};
  const business = config.business || {};
  const showServices = business.usesServices !== false && sec.mostrar_servicios !== false;
  const showProducts = business.usesProducts !== false && sec.mostrar_productos !== false;
  const showBranches = business.usesBranches !== false && sec.mostrar_sucursales !== false;
  const showVisitCard = business.showContactAddress && (config.address || config.phone || config.email);
  const primaryActionUrl = business.primaryFlow === "RESERVA" && business.usesAppointments
    ? (config.heroCtaPrimaryUrl || "/reserva")
    : (business.usesProducts && !business.usesServices ? "/productos" : "/catalogo");
  const primaryActionText = business.primaryFlow === "RESERVA" && business.usesAppointments
    ? (config.heroCtaPrimary || "Reservar")
    : `Ver ${String(business.catalogLabel || "catálogo").toLowerCase()}`;
  const finalCtaUrl = business.usesAppointments ? "/reserva" : primaryActionUrl;
  const finalCtaText = business.usesAppointments ? "Reservar turno" : primaryActionText;
  const heroSecondaryUrl = config.heroCtaSecondaryUrl || "/catalogo";
  const showSecondaryAction = Boolean(config.heroCtaSecondary) &&
    (business.usesAppointments !== false || !heroSecondaryUrl.startsWith("/reserva"));
  const howItWorks = business.usesAppointments ? [
    { num: "1", icon: "search", title: "Explorá", desc: "Navegá las opciones disponibles y elegí la que más te sirve." },
    { num: "2", icon: "event_available", title: "Reservá", desc: "Seleccioná sucursal, día y horario si el negocio trabaja con turnos." },
    { num: "3", icon: "check_circle", title: "Confirmá", desc: "Ingresá al portal y seguí el estado de tu reserva." },
  ] : [
    { num: "1", icon: "search", title: "Explorá", desc: "Navegá el catálogo publicado por el negocio." },
    { num: "2", icon: "shopping_bag", title: "Elegí", desc: "Compará productos, servicios o packs disponibles." },
    { num: "3", icon: "support_agent", title: "Coordiná", desc: "Contactá o comprá según el canal configurado." },
  ];
  const ordenSecciones = (sec.orden_secciones || "hero,servicios,como_funciona,productos,visitanos,cta_final")
    .split(",").map(s => s.trim());

  return (
    <div className="page-bg">
      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 space-y-8 animate-fade-in">
            {config.heroBadge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                style={{ background: 'rgba(125,211,252,0.15)', color: 'var(--brand-primary)', border: '1px solid rgba(125,211,252,0.3)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand-primary)' }} />
                {config.heroBadge}
              </div>
            )}
            <h1 className="display-lg" style={{ color: 'var(--brand-text)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)' }}>
              {config.heroTitle || (
                <>Belleza, bienestar y reservas simples<br />
                <span style={{ color: 'var(--brand-primary)' }}>en un solo lugar.</span></>
              )}
            </h1>
            <p className="text-lg max-w-xl" style={{ color: 'var(--brand-text-secondary)', lineHeight: 1.7 }}>
              {config.heroSubtitle || `${config.brandName} te conecta con servicios profesionales de salón. Reservá tu turno en segundos, sin llamadas ni mensajes.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={primaryActionUrl} className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4 rounded-xl">
                <span className="material-symbols-outlined">{business.usesAppointments ? "calendar_month" : "storefront"}</span>
                {primaryActionText}
              </Link>
              {showSecondaryAction && (
                <Link to={heroSecondaryUrl} className="btn-secondary inline-flex items-center gap-2 text-base px-8 py-4 rounded-xl">
                  <span className="material-symbols-outlined">spa</span>
                  {config.heroCtaSecondary}
                </Link>
              )}
            </div>
          </div>

          {/* Hero visual — bento */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="relative">
              <div className="glass-panel p-6 rounded-3xl shadow-xl">
                <div className="text-center space-y-4">
                  <span className="material-symbols-outlined text-6xl" style={{ color: 'var(--brand-primary)' }}>spa</span>
                  <div>
                    <p className="text-xs font-medium opacity-50" style={{ color: 'var(--brand-primary)' }}>
                      {business.usesAppointments ? "AGENDÁ EN 3 PASOS" : "OPERÁ EN 3 PASOS"}
                    </p>
                    {(business.usesAppointments ? ["Elegí opción", "Seleccioná horario", "Confirmá y listo"] : ["Explorá catálogo", "Elegí canal", "Contactá o comprá"]).map((step, i) => (
                      <div key={i} className="flex items-center gap-3 mt-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' }}>{i+1}</div>
                        <span className="text-sm" style={{ color: 'var(--brand-text)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 -z-10" style={{ background: 'var(--brand-secondary)', filter: 'blur(40px)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Servicios destacados */}
      {showServices && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className="text-center mb-12">
            <h2 className="headline-lg mb-3" style={{ color: 'var(--brand-text)' }}>Servicios destacados</h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
              Opciones destacadas publicadas por el negocio
            </p>
          </div>

          {servicios.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
                style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
              <p className="opacity-50">Cargando servicios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicios.map((s, i) => {
                const nombre = formatPublicName(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "");
                const desc = s.DESCRIPCION_WEB || s.DESCRIPCION || "";
                const precio = s.PRECIO_WEB ?? s.PRECIO_PUBLICITADO_WEB;
                const duracion = s.DURACION_MINUTOS_WEB ?? s.DURACION_MINUTOS;
                return (
                  <div key={i} className="glass-card p-6 group cursor-pointer" onClick={() => window.location.href = '/catalogo'}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' }}>
                        <span className="material-symbols-outlined">{iconos[i % iconos.length]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate" style={{ color: 'var(--brand-text)' }}>{nombre}</h3>
                        {desc && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--brand-text-secondary)' }}>{desc}</p>}
                        <div className="flex items-center gap-2 text-xs">
                          {duracion && <span className="opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>{duracion} min</span>}
                          {precio && (
                            <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>
                              {duracion ? '· ' : ''}{formatearMoneda(precio)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/catalogo" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--brand-primary)' }}>
              Ver catálogo completo
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </section>
      )}

      {/* Productos destacados */}
      {showProducts && productos.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className="text-center mb-12">
            <h2 className="headline-lg mb-3" style={{ color: "var(--brand-text)" }}>Productos destacados</h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "var(--brand-text-secondary)" }}>
              Ítems publicados para venta, consulta o promoción
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productos.map((p, i) => {
              const nombre = p.nombre_visible || "";
              const desc = p.descripcion_visible || "";
              const precio = p.precio_visible;
              const categoria = formatCategoria(p.categoria_publica);
              const img = p.imagen_principal;
              const tieneImg = img?.url;
              return (
                <div key={p.slug || i} className="glass-card p-6 group cursor-pointer" onClick={() => window.location.href = "/productos"}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: tieneImg ? "transparent" : "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                      {tieneImg ? (
                        <img src={img.url} alt={p.alt_text || nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-white">inventory_2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {categoria && (
                        <span className="text-xs font-medium uppercase tracking-wider mb-1 block opacity-60" style={{ color: "var(--brand-primary)" }}>
                          {categoria}
                        </span>
                      )}
                      <h3 className="font-semibold text-base mb-1 truncate" style={{ color: "var(--brand-text)" }}>{nombre}</h3>
                      {desc && <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--brand-text-secondary)" }}>{desc}</p>}
                      <div className="flex items-center gap-2 text-xs">
                        {precio != null && (
                          <span className="font-semibold" style={{ color: "var(--brand-primary)" }}>
                            ${Number(precio).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link to="/productos" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: "var(--brand-primary)" }}>
              Ver productos
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </section>
      )}

      {/* ¿Cómo funciona? */}
      {sec.mostrar_como_funciona !== false && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className="glass-panel p-10 sm:p-16 rounded-3xl">
            <div className="text-center mb-12">
              <h2 className="headline-lg mb-3" style={{ color: 'var(--brand-text)' }}>¿Cómo funciona?</h2>
              <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
                Reservar nunca fue tan simple
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {howItWorks.map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' }}>
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--brand-text)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contacto + CTA final */}
      {(showVisitCard || business.usesAppointments || business.usesProducts || business.usesServices) && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className={`grid gap-8 ${showVisitCard ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
            {showVisitCard && (
              <div className="glass-panel p-8 sm:p-12 rounded-3xl">
                <span className="material-symbols-outlined text-3xl mb-4 block" style={{ color: 'var(--brand-primary)' }}>location_on</span>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>Ubicación y contacto</h3>
                {config.address && (
                  <p className="text-sm mb-2" style={{ color: 'var(--brand-text-secondary)' }}>📍 {config.address}</p>
                )}
                {config.phone && (
                  <p className="text-sm mb-2" style={{ color: 'var(--brand-text-secondary)' }}>📞 {config.phone}</p>
                )}
                {config.email && (
                  <p className="text-sm mb-4" style={{ color: 'var(--brand-text-secondary)' }}>✉️ {config.email}</p>
                )}
                {showBranches && (
                  <Link to="/sucursales" className="text-sm font-medium inline-flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                    Ver sucursales
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                )}
              </div>
            )}
            <div className="glass-panel p-8 sm:p-12 rounded-3xl flex flex-col justify-center text-center"
              style={{ background: 'linear-gradient(135deg, rgba(125,211,252,0.2), rgba(220,233,255,0.2))' }}>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-text)' }}>
                {business.usesAppointments ? "¿Listo para coordinar tu turno?" : `Explorá ${String(business.catalogLabel || "el catálogo").toLowerCase()}`}
              </h3>
              <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
                {business.usesAppointments ? "Reservá ahora y seguí el estado desde tu portal." : "La experiencia se adapta al canal configurado por cada negocio."}
              </p>
              <Link to={finalCtaUrl} className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4 rounded-xl mx-auto">
                <span className="material-symbols-outlined">{business.usesAppointments ? "calendar_month" : "storefront"}</span>
                {finalCtaText}
              </Link>
            </div>
          </div>
        </section>
      )}

      {showBranches && <SucursalesPublicas />}
    </div>
  );
}

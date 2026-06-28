import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatPublicName, getPublicServiceImage, toPublicSlug } from "../utils/publicDataFilters";
import SucursalesPublicas from "./SucursalesPublicas";
import { formatCategoria } from "../utils/displayFormatters";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Home() {
  const { config } = useBrandConfig();
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [landingSections, setLandingSections] = useState([]);
  const [serviciosLoading, setServiciosLoading] = useState(true);
  const [productosLoading, setProductosLoading] = useState(true);
  const [serviciosError, setServiciosError] = useState(null);
  const [productosError, setProductosError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/servicios-web`, { cache: "no-store" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const raw = Array.isArray(d) ? d : d.servicios_web || [];
        const publicos = raw.filter(s => {
          const nombre = (s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "").trim();
          return nombre && nombre.toUpperCase() !== "SERVICIO" && nombre.length > 3;
        }).slice(0, 6);
        setServicios(publicos);
      })
      .catch(e => setServiciosError(e.message))
      .finally(() => setServiciosLoading(false));

    fetch(`${API}/api/productos-web`, { cache: "no-store" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const items = d.productos || [];
        const anomalos = (d.anomalias || []).map(a => a.nombre || a.id);
        setProductos(items.filter(p => !anomalos.includes(p.nombre_visible)).slice(0, 3));
      })
      .catch(e => setProductosError(e.message))
      .finally(() => setProductosLoading(false));

    fetch(`${API}/api/landing-secciones`, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : { landing_secciones: [] }))
      .then(d => {
        const raw = Array.isArray(d) ? d : d.landing_secciones || [];
        setLandingSections(raw.filter((section) => section.REGISTRO_ACTIVO !== false));
      })
      .catch(() => setLandingSections([]));
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
  const landingByKey = landingSections.reduce((acc, section) => {
    if (section.CLAVE_SECCION) acc[section.CLAVE_SECCION] = section;
    return acc;
  }, {});
  const getSection = (key) => landingByKey[key] || null;
  const sectionVisible = (key, fallback = true) => {
    const section = getSection(key);
    if (!section) return fallback;
    return section.VISIBLE_EN_FRONTEND_PUBLICO !== false;
  };
  const heroSection = getSection("HOME_HERO_PRINCIPAL");
  const servicesSection = getSection("HOME_SERVICIOS_DESTACADOS");
  const productsSection = getSection("HOME_PRODUCTOS_DESTACADOS");
  const howSection = getSection("HOME_BLOQUE_RESERVAS") || getSection("HOME_AGENDA_PUBLICA");
  const contactSection = getSection("HOME_SUCURSALES_CONTACTO") || getSection("HOME_CONTACTO_RAPIDO");
  const finalSection = getSection("HOME_FOOTER") || getSection("HOME_PORTAL_CLIENTES");
  const showServices = business.usesServices !== false && sec.mostrar_servicios !== false && sectionVisible("HOME_SERVICIOS_DESTACADOS");
  const showProducts = business.usesProducts !== false && sec.mostrar_productos !== false && sectionVisible("HOME_PRODUCTOS_DESTACADOS");
  const showBranches = business.usesBranches !== false && sec.mostrar_sucursales !== false && sectionVisible("HOME_SUCURSALES_CONTACTO");
  const showVisitCard = business.showContactAddress && (config.address || config.phone || config.email);
  const primaryActionUrl = business.primaryFlow === "RESERVA" && business.usesAppointments
    ? (heroSection?.URL_BOTON_CTA || config.heroCtaPrimaryUrl || "/reserva")
    : (business.usesProducts && !business.usesServices ? "/productos" : "/catalogo");
  const primaryActionText = business.primaryFlow === "RESERVA" && business.usesAppointments
    ? (heroSection?.TEXTO_BOTON_CTA || config.heroCtaPrimary || "Reservar")
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
              {heroSection?.TITULO_PUBLICO || config.heroTitle || (
                <>{config.brandName}: catálogo, turnos y portales<br />
                <span style={{ color: 'var(--brand-primary)' }}>adaptados a cada negocio.</span></>
              )}
            </h1>
            <p className="text-lg max-w-xl" style={{ color: 'var(--brand-text-secondary)', lineHeight: 1.7 }}>
              {heroSection?.SUBTITULO_PUBLICO || config.heroSubtitle || "Una plantilla marca blanca para publicar productos, servicios, sucursales y reservas según la configuración de cada tenant."}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link to={primaryActionUrl} className="btn-primary inline-flex w-full sm:w-auto items-center justify-center gap-2 text-base px-8 py-4 rounded-xl">
                <span className="material-symbols-outlined" aria-hidden="true">{business.usesAppointments ? "calendar_month" : "storefront"}</span>
                {primaryActionText}
              </Link>
              {showSecondaryAction && (
                <Link to={heroSecondaryUrl} className="btn-secondary inline-flex w-full sm:w-auto items-center justify-center gap-2 text-base px-8 py-4 rounded-xl">
                  <span className="material-symbols-outlined" aria-hidden="true">spa</span>
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
            <h2 className="headline-lg mb-3" style={{ color: 'var(--brand-text)' }}>{servicesSection?.TITULO_PUBLICO || "Servicios destacados"}</h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
              {servicesSection?.SUBTITULO_PUBLICO || "Opciones destacadas publicadas por el negocio"}
            </p>
          </div>

          {serviciosLoading ? (
            <div className="glass-panel p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
                style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }} />
              <p className="opacity-50" style={{ color: 'var(--brand-text-secondary)' }}>Cargando servicios…</p>
            </div>
          ) : serviciosError ? (
            <div className="glass-panel p-10 text-center">
              <p className="text-sm text-rose-500">No pudimos cargar los servicios. Probá nuevamente en unos minutos.</p>
            </div>
          ) : servicios.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <span className="material-symbols-outlined mb-3 block text-4xl opacity-40" style={{ color: 'var(--brand-primary)' }}>category</span>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Catálogo en preparación</h3>
              <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>Todavía no hay servicios publicados para esta demo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicios.map((s, i) => {
                const nombre = formatPublicName(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || "");
                const desc = s.DESCRIPCION_WEB || s.DESCRIPCION || "";
                const precio = s.PRECIO_WEB ?? s.PRECIO_PUBLICITADO_WEB;
                const duracion = s.DURACION_MINUTOS_WEB ?? s.DURACION_MINUTOS;
                const imagen = getPublicServiceImage(s);
                const slug = toPublicSlug(s.NOMBRE_PUBLICO_SERVICIO || s.NOMBRE_SERVICIO || s.SERVICIO_NOMBRE) || s.id;
                return (
                  <Link key={s.id || i} to={`/servicios/${slug}`} className="glass-card block p-6 group no-underline">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white flex-shrink-0 overflow-hidden"
                        style={{ background: imagen?.url ? 'transparent' : 'linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))' }}>
                        {imagen?.url ? (
                          <img
                            src={imagen.url}
                            alt={nombre}
                            width={imagen.width || 64}
                            height={imagen.height || 64}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="material-symbols-outlined" aria-hidden="true">{iconos[i % iconos.length]}</span>
                        )}
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
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/catalogo" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-[gap,color]" style={{ color: 'var(--brand-primary)' }}>
              Ver catálogo completo
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </section>
      )}

      {/* Productos destacados */}
      {showProducts && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className="text-center mb-12">
            <h2 className="headline-lg mb-3" style={{ color: "var(--brand-text)" }}>{productsSection?.TITULO_PUBLICO || "Productos destacados"}</h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "var(--brand-text-secondary)" }}>
              {productsSection?.SUBTITULO_PUBLICO || "Ítems publicados para venta, consulta o promoción"}
            </p>
          </div>

          {productosLoading ? (
            <div className="glass-panel p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
                style={{ borderColor: "var(--brand-secondary)", borderTopColor: "transparent" }} />
              <p className="opacity-50" style={{ color: "var(--brand-text-secondary)" }}>Cargando productos…</p>
            </div>
          ) : productosError ? (
            <div className="glass-panel p-10 text-center">
              <p className="text-sm text-rose-500">No pudimos cargar los productos. Probá nuevamente en unos minutos.</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <span className="material-symbols-outlined mb-3 block text-4xl opacity-40" style={{ color: "var(--brand-primary)" }}>inventory_2</span>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--brand-text)" }}>Productos en preparación</h3>
              <p className="text-sm" style={{ color: "var(--brand-text-secondary)" }}>Todavía no hay productos publicados para esta demo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {productos.map((p, i) => {
                const nombre = p.nombre_visible || "";
                const desc = p.descripcion_visible || "";
                const precio = p.precio_visible;
                const categoria = formatCategoria(p.categoria_publica);
                const img = p.imagen_principal;
                const tieneImg = img?.url;
                return (
                  <Link key={p.slug || i} to="/productos" className="glass-card block p-6 group no-underline">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: tieneImg ? "transparent" : "linear-gradient(135deg, var(--brand-secondary), var(--brand-primary))" }}>
                        {tieneImg ? (
                          <img src={img.url} alt={p.alt_text || nombre} width="56" height="56" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-white" aria-hidden="true">inventory_2</span>
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
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/productos" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-[gap,color]" style={{ color: "var(--brand-primary)" }}>
              Ver productos
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </section>
      )}

      {/* ¿Cómo funciona? */}
      {sec.mostrar_como_funciona !== false && sectionVisible("HOME_BLOQUE_RESERVAS") && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
          <div className="glass-panel p-10 sm:p-16 rounded-3xl">
            <div className="text-center mb-12">
              <h2 className="headline-lg mb-3" style={{ color: 'var(--brand-text)' }}>{howSection?.TITULO_PUBLICO || "¿Cómo funciona?"}</h2>
              <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
                {howSection?.SUBTITULO_PUBLICO || (business.usesAppointments ? "Reservas simples cuando el negocio trabaja con turnos" : "Un flujo adaptable al canal comercial de cada negocio")}
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
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>{contactSection?.TITULO_PUBLICO || "Ubicación y contacto"}</h3>
                {contactSection?.SUBTITULO_PUBLICO && (
                  <p className="text-sm mb-4" style={{ color: 'var(--brand-text-secondary)' }}>{contactSection.SUBTITULO_PUBLICO}</p>
                )}
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
                {finalSection?.TITULO_PUBLICO || (business.usesAppointments ? "¿Listo para coordinar tu turno?" : `Explorá ${String(business.catalogLabel || "el catálogo").toLowerCase()}`)}
              </h3>
              <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
                {finalSection?.SUBTITULO_PUBLICO || (business.usesAppointments ? "Reservá ahora y seguí el estado desde tu portal." : "La experiencia se adapta al canal configurado por cada negocio.")}
              </p>
              <Link to={finalSection?.URL_BOTON_CTA || finalCtaUrl} className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4 rounded-xl mx-auto">
                <span className="material-symbols-outlined">{business.usesAppointments ? "calendar_month" : "storefront"}</span>
                {finalSection?.TEXTO_BOTON_CTA || finalCtaText}
              </Link>
            </div>
          </div>
        </section>
      )}

      {showBranches && <SucursalesPublicas />}
    </div>
  );
}

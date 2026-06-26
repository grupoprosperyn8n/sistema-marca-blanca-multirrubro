import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
// X icon as inline SVG to avoid extra dependency
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

function buildFallbackMessages(config) {
  const business = config.business || {};
  const catalogLabel = String(business.catalogLabel || "catálogo").toLowerCase();
  const messages = [
    {
      texto: `${config.brandName || "Demo"} publica ${catalogLabel} desde configuración marca blanca`,
      cta: "Ver catálogo",
      ctaLink: "/catalogo",
    },
  ];
  if (business.usesAppointments) {
    messages.push({
      texto: "Turnos online disponibles según agenda y sucursal configurada",
      cta: "Reservar turno",
      ctaLink: "/reserva",
    });
  }
  if (business.usesProducts) {
    messages.push({
      texto: "Productos publicados para consulta o venta según canal del negocio",
      cta: "Ver productos",
      ctaLink: "/productos",
    });
  }
  return messages;
}

export default function AnnouncementBar() {
  const { config } = useBrandConfig();
  const fallbackMessages = useMemo(() => buildFallbackMessages(config), [config]);
  const [messages, setMessages] = useState(fallbackMessages);
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("banner-dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    // Si MARCAS tiene banner activo, usarlo como prioridad
    if (config.bannerActive && config.bannerMessage) {
      setMessages([{
        texto: config.bannerTitle ? `${config.bannerTitle} — ${config.bannerMessage}` : config.bannerMessage,
        cta: config.bannerCtaText || null,
        ctaLink: config.bannerCtaUrl || "/catalogo",
      }]);
      return;
    }

    // Fallback: CONFIGURACION_PUBLICA banners
    setMessages(fallbackMessages);
    async function cargar() {
      try {
        const res = await fetch(`${API}/api/configuracion-publica`);
        const data = await res.json();
        const configs = Array.isArray(data) ? data : data.configuracion || [];
        const banners = configs
          .filter(c => c.VISIBLE_EN_FRONTEND_PUBLICO && c.CATEGORIA_CONFIGURACION === "BANNER_ROTATIVO")
          .sort((a, b) => (a.ORDEN_VISUAL || 99) - (b.ORDEN_VISUAL || 99));
        if (banners.length > 0) {
          setMessages(banners.map(b => ({
            texto: b.TEXTO_CONFIGURACION || b.NOMBRE_CONFIGURACION || "",
            cta: b.SI_NO_CONFIGURACION ? "Ver más" : null,
            ctaLink: b.CLAVE_CONFIGURACION?.startsWith("LINK_") ? (b.VALOR_CONFIGURACION || "/catalogo") : null,
          })));
        }
      } catch {
        // Fallback to demo messages if config not available
      }
    }
    cargar();
  }, [config.bannerActive, config.bannerMessage, config.bannerTitle, config.bannerCtaText, config.bannerCtaUrl, fallbackMessages]);

  useEffect(() => {
    setCurrent(0);
  }, [messages.length]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem("banner-dismissed", "1"); } catch {}
  }, []);

  const rotate = useCallback(() => {
    if (messages.length <= 1) return;
    setExiting(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % messages.length);
      setExiting(false);
    }, 300);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(rotate, 6000);
    return () => clearInterval(timer);
  }, [rotate, messages.length]);

  if (messages.length === 0 || dismissed) return null;

  const safeCurrent = Math.min(current, messages.length - 1);
  const msg = messages[safeCurrent];
  if (!msg?.texto) return null;

  return (
    <div className="relative overflow-hidden" style={{ position: "relative", background: "linear-gradient(135deg, var(--brand-primary) 0%, #0b4d6a 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center">
        <button type="button" onClick={dismiss} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 hover:text-white transition-colors" aria-label="Cerrar banner"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <div className={`transition-[opacity,transform] duration-300 ${exiting ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}>
          <p className="pr-8 text-sm sm:text-base text-white font-medium">
            {msg.texto}
            {msg.cta && (
              <Link
                to={msg.ctaLink || "/catalogo"}
                className="ml-2 inline-block px-3 py-0.5 rounded-full text-xs font-bold transition-colors"
                style={{ background: "var(--brand-secondary)", color: "var(--brand-text)" }}
              >
                {msg.cta} →
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

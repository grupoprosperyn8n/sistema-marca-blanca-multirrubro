import { useState, useEffect, useCallback } from "react";
import { useBrandConfig } from "../context/BrandConfigContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

const DEMO_MESSAGES = [
  { texto: "Promo semana: 15% off en tratamientos seleccionados", cta: "Ver servicios", ctaLink: "/catalogo" },
  { texto: "Reservá online y elegí tu sucursal", cta: "Reservar turno", ctaLink: "/reserva" },
  { texto: "Productos profesionales disponibles en salón", cta: "Ver productos", ctaLink: "/productos" },
];

export default function AnnouncementBar() {
  const { config } = useBrandConfig();
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);

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
  }, [config.bannerActive, config.bannerMessage, config.bannerTitle, config.bannerCtaText, config.bannerCtaUrl]);

  const rotate = useCallback(() => {
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

  if (messages.length === 0) return null;

  const msg = messages[current];

  return (
    <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--brand-primary) 0%, #0b4d6a 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center">
        <div className={`transition-all duration-300 ${exiting ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}>
          <p className="text-sm sm:text-base text-white font-medium">
            {msg.texto}
            {msg.cta && (
              <a
                href={msg.ctaLink || "#"}
                className="ml-2 inline-block px-3 py-0.5 rounded-full text-xs font-bold transition-colors"
                style={{ background: "var(--brand-secondary)", color: "var(--brand-text)" }}
              >
                {msg.cta} →
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

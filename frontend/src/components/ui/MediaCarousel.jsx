import { useEffect, useState } from "react";

function mediaKind(item) {
  const type = String(item?.type || "").toUpperCase();
  if (type.includes("VIDEO")) return "VIDEO";
  if (type.includes("EMBED")) return "EMBED";
  const url = String(item?.url || "").toLowerCase();
  if (/\.(mp4|webm|mov)(\?|#|$)/.test(url)) return "VIDEO";
  return "IMAGEN";
}

export default function MediaCarousel({
  items = [],
  alt = "",
  className = "",
  mediaClassName = "aspect-[4/3]",
  imageClassName = "h-full w-full object-cover",
  showControls = true,
  fallbackIcon = "photo_library",
}) {
  const [active, setActive] = useState(0);
  const slides = Array.isArray(items) ? items.filter((item) => item?.url) : [];

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  if (!slides.length) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-100 ${className}`}>
        <div className={`flex items-center justify-center ${mediaClassName}`}>
          <span className="material-symbols-outlined text-4xl opacity-30" aria-hidden="true" style={{ color: "var(--brand-primary)" }}>
            {fallbackIcon}
          </span>
        </div>
      </div>
    );
  }

  const current = slides[active] || slides[0];
  const kind = mediaKind(current);
  const prev = () => setActive((value) => (value - 1 + slides.length) % slides.length);
  const next = () => setActive((value) => (value + 1) % slides.length);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-white to-cyan-100 ${className}`}>
      <div className={`overflow-hidden ${mediaClassName}`}>
        {kind === "VIDEO" ? (
          <video
            src={current.url}
            className={imageClassName}
            controls
            preload="metadata"
            playsInline
            aria-label={current.alt || alt || "Video"}
          />
        ) : kind === "EMBED" ? (
          <iframe
            src={current.url}
            title={current.title || current.alt || alt || "Contenido embebido"}
            className="h-full w-full border-0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <img
            src={current.url}
            alt={current.alt || alt || "Imagen"}
            width={current.width || 900}
            height={current.height || 675}
            loading={active === 0 ? "eager" : "lazy"}
            fetchPriority={active === 0 ? "high" : "auto"}
            className={imageClassName}
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        )}
      </div>

      {showControls && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg font-bold shadow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ color: "var(--brand-primary)" }}
            aria-label="Medio anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg font-bold shadow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ color: "var(--brand-primary)" }}
            aria-label="Medio siguiente"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/75 px-2 py-1 shadow-sm">
            {slides.map((slide, index) => (
              <button
                key={slide.id || `${slide.url}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2 rounded-full transition-[opacity,width] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${index === active ? "w-5" : "w-2 opacity-50"}`}
                style={{ background: index === active ? "var(--brand-primary)" : "var(--brand-secondary)" }}
                aria-label={`Ver medio ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

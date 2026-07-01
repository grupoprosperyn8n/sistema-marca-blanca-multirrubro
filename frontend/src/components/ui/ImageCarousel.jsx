import { useState } from "react";

export default function ImageCarousel({
  images = [],
  alt = "",
  className = "",
  mediaClassName = "aspect-[4/3] sm:aspect-[16/9]",
  imageClassName = "h-full w-full object-contain p-4",
}) {
  const [active, setActive] = useState(0);

  if (!images.length) return null;

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  return (
    <div className={`relative w-full ${className}`} style={{ background: "linear-gradient(135deg, #e0f2fe, #f0f9ff)" }}>
      <div className={`overflow-hidden ${mediaClassName}`}>
        <img
          src={images[active]}
          alt={`${alt} — imagen ${active + 1}`}
          width="1200"
          height="900"
          loading={active === 0 ? "eager" : "lazy"}
          fetchPriority={active === 0 ? "high" : "auto"}
          className={imageClassName}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg font-bold transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: "rgba(255,255,255,0.85)", color: "var(--brand-primary)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            aria-label="Imagen anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg font-bold transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: "rgba(255,255,255,0.85)", color: "var(--brand-primary)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            aria-label="Imagen siguiente"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`h-2.5 rounded-full transition-[opacity,width] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  i === active ? "w-6" : "opacity-50 hover:opacity-80"
                }`}
                style={{ background: i === active ? "var(--brand-primary)" : "var(--brand-secondary)" }}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

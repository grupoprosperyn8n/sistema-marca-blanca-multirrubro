import { useState } from "react";

export default function ImageCarousel({ images = [], alt = "" }) {
  const [active, setActive] = useState(0);

  if (!images.length) return null;

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  return (
    <div className="relative w-full" style={{ background: "linear-gradient(135deg, #e0f2fe, #f0f9ff)" }}>
      <div className="aspect-[4/3] sm:aspect-[16/9] overflow-hidden">
        <img
          src={images[active]}
          alt={`${alt} — imagen ${active + 1}`}
          className="w-full h-full object-contain p-4"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.85)", color: "var(--brand-primary)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            aria-label="Imagen anterior"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.85)", color: "var(--brand-primary)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            aria-label="Imagen siguiente"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
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

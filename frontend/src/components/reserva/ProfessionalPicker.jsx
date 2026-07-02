const AUTO_VALUE = "AUTO";

function specialtyText(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "";
}

function avatar(name, url) {
  if (url) {
    return <img src={url} alt="" className="h-10 w-10 rounded-2xl object-cover shadow-sm" loading="lazy" />;
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-500">
      {(name || "P").charAt(0)}
    </span>
  );
}

export default function ProfessionalPicker({
  value,
  onChange,
  professionals = [],
  disabled = false,
  loading = false,
}) {
  const options = [
    {
      id: AUTO_VALUE,
      nombre: loading ? "Buscando profesionales…" : "Automático",
      descripcion: "El sistema elige por menor carga del día y rotación.",
      puesto: "Recomendado",
    },
    ...professionals,
  ];

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Profesional</span>
        <span className="text-[11px]" style={{ color: "var(--brand-text-secondary)" }}>{professionals.length} disponibles</span>
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-white/70 bg-white/70 p-2">
        {options.map((professional) => {
          const selected = value === professional.id;
          const description = professional.descripcion || specialtyText(professional.especialidad) || professional.puesto || "Profesional habilitado";
          return (
            <button
              key={professional.id}
              type="button"
              onClick={() => onChange(professional.id)}
              className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition"
              style={{
                borderColor: selected ? "var(--brand-primary)" : "#e5e7eb",
                background: selected ? "rgba(14,165,233,.08)" : "#fff",
                color: "var(--brand-text)",
              }}
            >
              {professional.id === AUTO_VALUE ? (
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg">⚡</span>
              ) : avatar(professional.nombre, professional.fotoUrl)}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{professional.nombre}</span>
                <span className="line-clamp-2 block text-xs opacity-70">{description}</span>
              </span>
              <span className={`h-3 w-3 rounded-full ${selected ? "bg-emerald-500" : "bg-slate-200"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

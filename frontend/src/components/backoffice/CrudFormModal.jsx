/* eslint-disable react/prop-types */
import GlassCard from "../ui/GlassCard";
import PrimaryButton from "../ui/PrimaryButton";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:opacity-60";

export default function CrudFormModal({
  title,
  fields,
  values,
  saving = false,
  error = "",
  onChange,
  onSubmit,
  onClose,
}) {
  function renderField(field) {
    const value = values[field.name];
    if (field.type === "checkbox") {
      return (
        <label key={field.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm">
          <span>{field.label}</span>
          <input
            type="checkbox"
            checked={!!value}
            disabled={field.disabled}
            onChange={(event) => onChange(field.name, event.target.checked)}
          />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.name} className="block text-xs font-semibold">
          {field.label}
          <select
            value={value || ""}
            disabled={field.disabled}
            onChange={(event) => onChange(field.name, event.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.name} className="block text-xs font-semibold">
          {field.label}
          <textarea
            value={value || ""}
            disabled={field.disabled}
            onChange={(event) => onChange(field.name, event.target.value)}
            rows={3}
            className={inputClass}
          />
        </label>
      );
    }

    return (
      <label key={field.name} className="block text-xs font-semibold">
        {field.label}
        <input
          type={field.type || "text"}
          value={value ?? ""}
          disabled={field.disabled}
          onChange={(event) => {
            const nextValue = field.type === "number" && event.target.value !== ""
              ? Number(event.target.value)
              : event.target.value;
            onChange(field.name, nextValue);
          }}
          className={inputClass}
        />
      </label>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="w-full max-w-lg p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>{title}</h2>
          <button type="button" className="text-sm opacity-60 hover:opacity-100" onClick={onClose}>×</button>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          {fields.map(renderField)}
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>
              Cancelar
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </PrimaryButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

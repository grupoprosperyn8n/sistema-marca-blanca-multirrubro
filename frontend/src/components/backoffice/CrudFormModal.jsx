/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import GlassCard from "../ui/GlassCard";
import PrimaryButton from "../ui/PrimaryButton";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60";
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || []);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  function renderField(field) {
    const value = values[field.name];
    if (field.type === "checkbox") {
      return (
        <label key={field.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm">
          <span className="min-w-0">{field.label}</span>
          <input
            name={field.name}
            type="checkbox"
            checked={!!value}
            disabled={field.disabled}
            onChange={(event) => onChange(field.name, event.target.checked)}
            className="h-4 w-4 shrink-0 accent-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.name} className="block text-xs font-semibold">
          {field.label}
          <select
            name={field.name}
            value={value || ""}
            disabled={field.disabled}
            onChange={(event) => onChange(field.name, event.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {(field.options || []).map((option) => {
              const value = typeof option === "object" ? option.value : option;
              const label = typeof option === "object" ? option.label : option;
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
          {field.helper && <span className="mt-1 block text-xs font-normal text-slate-500">{field.helper}</span>}
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.name} className="block text-xs font-semibold">
          {field.label}
          <textarea
            name={field.name}
            value={value || ""}
            disabled={field.disabled}
            onChange={(event) => onChange(field.name, event.target.value)}
            rows={3}
            className={inputClass}
          />
          {field.helper && <span className="mt-1 block text-xs font-normal text-slate-500">{field.helper}</span>}
        </label>
      );
    }

    return (
      <label key={field.name} className="block text-xs font-semibold">
        {field.label}
        <input
          name={field.name}
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
        {field.helper && <span className="mt-1 block text-xs font-normal text-slate-500">{field.helper}</span>}
      </label>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-2 backdrop-blur-sm sm:p-4" onClick={() => onCloseRef.current?.()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crud-form-modal-title"
        className="my-auto w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <GlassCard className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 overscroll-contain sm:max-h-[calc(100dvh-2rem)]" hover={false}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="crud-form-modal-title" className="min-w-0 text-lg font-bold text-pretty" style={{ color: "var(--brand-text)" }}>{title}</h2>
          <button ref={closeButtonRef} type="button" aria-label="Cerrar formulario" className="shrink-0 rounded-md px-2 py-1 text-lg leading-none opacity-60 transition hover:bg-slate-100 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" onClick={() => onCloseRef.current?.()}>×</button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 overscroll-contain sm:px-6">
            {fields.map(renderField)}
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          </div>
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <button type="button" className="min-h-11 rounded-lg border border-slate-200 px-4 py-2 text-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" onClick={() => onCloseRef.current?.()}>
              Cancelar
            </button>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </PrimaryButton>
          </div>
        </form>
        </GlassCard>
      </div>
    </div>
  );
}

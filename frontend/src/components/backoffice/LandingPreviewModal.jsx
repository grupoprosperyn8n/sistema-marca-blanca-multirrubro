import { useEffect, useMemo, useRef, useState } from "react";
import {
  LANDING_PREVIEW_MESSAGE,
  clearLandingPreviewPayload,
  writeLandingPreviewPayload,
} from "../../utils/landingPreview";

const DEVICES = {
  mobile: { label: "Celular", icon: "smartphone", width: 390, hint: "Mobile first · 390px" },
  tablet: { label: "Tablet", icon: "tablet_mac", width: 760, hint: "Tablet · 760px" },
  desktop: { label: "Web", icon: "desktop_windows", width: 1120, hint: "Desktop · 1120px" },
};

function previewUrl() {
  const suffix = "preview=landing-builder";
  return `/?${suffix}`;
}

function DeviceShell({ device, children }) {
  const meta = DEVICES[device] || DEVICES.mobile;
  const isMobile = device === "mobile";

  return (
    <div className="flex justify-center overflow-auto rounded-3xl bg-slate-100/80 p-3 sm:p-5">
      <div
        className={`overflow-hidden border bg-white shadow-2xl ${isMobile ? "rounded-[2.25rem] border-slate-300" : "rounded-3xl border-slate-200"}`}
        style={{ width: meta.width, maxWidth: "100%" }}
      >
        {isMobile && (
          <div className="flex h-7 items-center justify-center bg-slate-950">
            <div className="h-1.5 w-20 rounded-full bg-white/25" />
          </div>
        )}
        <div className="h-[68vh] overflow-hidden bg-white">{children}</div>
      </div>
    </div>
  );
}

export default function LandingPreviewModal({
  open,
  onClose,
  form,
  liveConfig,
  landingRows = [],
  landingDrafts = {},
  configRows = [],
  configDrafts = {},
}) {
  const iframeRef = useRef(null);
  const [device, setDevice] = useState("mobile");

  const payload = useMemo(() => ({
    source: "backoffice-landing-builder",
    updatedAt: Date.now(),
    form,
    liveConfig,
    landingRows,
    landingDrafts,
    configRows,
    configDrafts,
  }), [form, liveConfig, landingRows, landingDrafts, configRows, configDrafts]);

  function pushPreviewPayload(nextPayload = payload) {
    writeLandingPreviewPayload(nextPayload);
    iframeRef.current?.contentWindow?.postMessage({
      type: LANDING_PREVIEW_MESSAGE,
      payload: nextPayload,
    }, window.location.origin);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    pushPreviewPayload(payload);
    const timeoutIds = [80, 300, 900].map((delay) => window.setTimeout(() => pushPreviewPayload(payload), delay));
    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [open, payload]);

  useEffect(() => {
    if (!open) clearLandingPreviewPayload();
  }, [open]);

  if (!open) return null;

  const meta = DEVICES[device] || DEVICES.mobile;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Previsualizador de landing">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Previsualización exacta</p>
              <h3 className="text-xl font-black text-slate-900">Landing real con cambios en borrador</h3>
              <p className="mt-1 text-sm text-slate-500">Este visor carga la misma app pública en un iframe, por eso CTAs y subpáginas funcionan como en producción.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(DEVICES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDevice(key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold transition ${device === key ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  aria-pressed={device === key}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100">
                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
                Cerrar
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{meta.hint}</span>
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Borrador sin guardar</span>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3 sm:p-5">
          <DeviceShell device={device}>
            <iframe
              key="landing-preview-frame"
              ref={iframeRef}
              title="Previsualización exacta de landing"
              src={previewUrl()}
              className="h-full w-full border-0 bg-white"
              onLoad={() => pushPreviewPayload(payload)}
            />
          </DeviceShell>
        </div>
      </div>
    </div>
  );
}

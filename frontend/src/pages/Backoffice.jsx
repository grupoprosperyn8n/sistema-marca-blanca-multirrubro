import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import { getDashboardCards, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Backoffice() {
  const { role, access } = useAuth();
  const [stats, setStats] = useState({ servicios: null, clientes: null, citas: null, sucursales: null });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestControllersRef = useRef(new Set());

  useEffect(() => {
    let active = true;
    async function fetchJsonWithTimeout(url) {
      const controller = new AbortController();
      requestControllersRef.current.add(controller);
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } finally {
        window.clearTimeout(timeout);
        requestControllersRef.current.delete(controller);
      }
    }

    async function load() {
      const hasLoadedStats = Object.values(stats).some((value) => value !== null);
      if (hasLoadedStats) setRefreshing(true);
      else setInitialLoading(true);
      setLoadError("");
      const results = await Promise.allSettled([
        fetchJsonWithTimeout(`${API}/api/servicios`),
        fetchJsonWithTimeout(`${API}/api/clientes`),
        fetchJsonWithTimeout(`${API}/api/citas`),
        fetchJsonWithTimeout(`${API}/api/sucursales`),
      ]);
      if (!active) return;
      const count = (result, key, fallback) => result.status === "fulfilled"
        ? (Array.isArray(result.value) ? result.value.length : result.value[key]?.length || 0)
        : fallback;
      setStats((previousStats) => ({
        servicios: count(results[0], "servicios", previousStats.servicios),
        clientes: count(results[1], "clientes", previousStats.clientes),
        citas: count(results[2], "citas", previousStats.citas),
        sucursales: count(results[3], "sucursales", previousStats.sucursales),
      }));
      if (results.some((result) => result.status === "rejected")) {
        setLoadError("Algunos indicadores no pudieron cargarse. Podés reintentar sin salir del dashboard.");
      }
      setInitialLoading(false);
      setRefreshing(false);
    }
    load();
    return () => {
      active = false;
      requestControllersRef.current.forEach((controller) => controller.abort());
      requestControllersRef.current.clear();
    };
  }, [reloadKey]);

  if (initialLoading) return <p className="py-12 text-center opacity-50">Cargando…</p>;

  const statByRoute = {
    "/backoffice/servicios": stats.servicios,
    "/backoffice/clientes": stats.clientes,
    "/backoffice/citas": stats.citas,
    "/backoffice/sucursales": stats.sucursales,
  };
  const iconByRoute = {
    "/backoffice/agenda": "📅",
    "/backoffice/citas": "📋",
    "/backoffice/clientes": "👥",
    "/backoffice/configuracion": "⚙️",
    "/backoffice/servicios": "💇",
    "/backoffice/sucursales": "📍",
    "/backoffice/usuarios": "🔐",
  };
  const cards = getDashboardCards(role, access).map((card) => ({
    ...card,
    label: card.title,
    icon: iconByRoute[card.to] || "📄",
    value: statByRoute[card.to] ?? (card.to in statByRoute ? "—" : "→"),
  }));

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-pretty sm:mb-6" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
        Dashboard
      </h1>
      {loadError && (
        <div role="status" aria-live="polite" className="mb-4 flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="min-h-10 shrink-0 rounded-lg border border-amber-300 px-3 py-2 font-semibold transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">Reintentar</button>
        </div>
      )}
      {refreshing && <p aria-live="polite" className="mb-4 text-sm opacity-60">Actualizando indicadores…</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {cards.map((c, i) => (
          <Link key={i} to={c.to} aria-label={`Abrir ${c.label}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <GlassCard className="h-full text-center" padding hover>
              <span className="mb-2 block text-2xl" aria-hidden="true">{c.icon}</span>
              <p className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>{c.value}</p>
              <p className="mt-1 break-words text-xs opacity-50" style={{ color: 'var(--brand-text)' }}>{c.label}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

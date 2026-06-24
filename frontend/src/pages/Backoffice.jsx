import { useState, useEffect } from "react";
import GlassCard from "../components/ui/GlassCard";
import { getDashboardCards, useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Backoffice() {
  const { role, access } = useAuth();
  const [stats, setStats] = useState({ servicios: 0, clientes: 0, citas: 0, sucursales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [srv, cli, cit, suc] = await Promise.all([
          fetch(`${API}/api/servicios`).then(r => r.json()),
          fetch(`${API}/api/clientes`).then(r => r.json()),
          fetch(`${API}/api/citas`).then(r => r.json()),
          fetch(`${API}/api/sucursales`).then(r => r.json()),
        ]);
        setStats({
          servicios: Array.isArray(srv) ? srv.length : srv.servicios?.length || 0,
          clientes: Array.isArray(cli) ? cli.length : cli.clientes?.length || 0,
          citas: Array.isArray(cit) ? cit.length : cit.citas?.length || 0,
          sucursales: Array.isArray(suc) ? suc.length : suc.sucursales?.length || 0,
        });
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="opacity-50 text-center py-12">Cargando...</p>;

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
    value: statByRoute[card.to] ?? "→",
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading, Manrope)', color: 'var(--brand-text)' }}>
        Dashboard
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <GlassCard key={i} className="text-center" padding hover>
            <span className="text-2xl mb-2 block">{c.icon}</span>
            <p className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>{c.value}</p>
            <p className="text-xs opacity-50 mt-1" style={{ color: 'var(--brand-text)' }}>{c.label}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function Configuracion() {
  const { role, permisos } = useAuth();
  const [config, setConfig] = useState([]);
  const [marca, setMarca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [resConf, resMarca] = await Promise.all([
          fetch(`${API}/configuracion-publica`).then(r => r.json()),
          fetch(`${API}/marca-blanca`).then(r => r.json()),
        ]);
        setConfig(resConf.configuracion || []);
        setMarca(resMarca.marca_blanca || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) return <div className="text-center py-12 text-terra-500">Cargando configuración...</div>;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-terra-800">Configuración Pública</h2>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
          {config.length} flags — Sin identidad de marca
        </span>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
        <p className="text-xs text-amber-800">
          ⚠️ <strong>Sin identidad de marca final.</strong> La tabla CONFIGURACION_PUBLICA tiene {config.length} flags del sistema pero carece de NOMBRE_SISTEMA, COLORES y LOGO. Se usa fallback visual del frontend.
        </p>
      </div>

      <p className="text-xs text-terra-500 mb-4">Rol: {role}</p>
      {!permisos.editar && (
        <p className="text-xs text-amber-600 mb-4">Solo lectura — edición deshabilitada</p>
      )}

      {/* Marca blanca — diagnóstico */}
      {marca && (
        <div className="bg-white rounded-lg shadow border border-terra-100 p-4 mb-6">
          <h3 className="text-sm font-bold text-terra-700 mb-3">Diagnóstico de marca</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-terra-50 rounded p-2">
              <p className="text-terra-400">Nombre sistema</p>
              <p className="font-medium text-terra-800">{marca.nombre_sistema || "—"}</p>
            </div>
            <div className="bg-terra-50 rounded p-2">
              <p className="text-terra-400">Colores</p>
              <p className="font-medium text-terra-800">{marca.colores || "—"}</p>
            </div>
            <div className="bg-terra-50 rounded p-2">
              <p className="text-terra-400">Logo</p>
              <p className="font-medium text-terra-800">{marca.logo ? "✓" : "—"}</p>
            </div>
            <div className="bg-terra-50 rounded p-2">
              <p className="text-terra-400">Módulos activos</p>
              <p className="font-medium text-green-700">{marca.modulos_activos || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {config.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-700 font-medium">Sin datos de configuración</p>
          <p className="text-sm text-amber-600 mt-1">La tabla CONFIGURACION_PUBLICA está vacía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-terra-50 border-b border-terra-200 sticky top-0">
              <tr>
                <th className="text-left p-3 text-terra-700 font-semibold">Clave</th>
                <th className="text-left p-3 text-terra-700 font-semibold">Nombre</th>
                <th className="text-center p-3 text-terra-700 font-semibold">Valor</th>
                <th className="text-center p-3 text-terra-700 font-semibold">Ámbito</th>
                <th className="text-center p-3 text-terra-700 font-semibold">Visible</th>
              </tr>
            </thead>
            <tbody>
              {config.map((c) => (
                <tr key={c.id} className="border-b border-terra-100 hover:bg-terra-50 transition">
                  <td className="p-3 text-xs font-mono text-terra-500">{c.CLAVE_CONFIGURACION || "—"}</td>
                  <td className="p-3 text-xs text-terra-700">{c.NOMBRE_CONFIGURACION || "—"}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.SI_NO_CONFIGURACION === true || c.SI_NO_CONFIGURACION === "true"
                        ? "bg-green-100 text-green-700"
                        : c.SI_NO_CONFIGURACION === false || c.SI_NO_CONFIGURACION === "false"
                          ? "bg-red-100 text-red-700"
                          : "bg-terra-100 text-terra-600"
                    }`}>
                      {c.SI_NO_CONFIGURACION != null ? (c.SI_NO_CONFIGURACION ? "SI" : "NO") : c.VALOR_TEXTO || c.TEXTO_CONFIGURACION || "—"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-xs bg-terra-100 text-terra-600 px-2 py-0.5 rounded-full">
                      {c.AMBITO_APLICACION || "—"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {c.VISIBLE_EN_FRONTEND_PUBLICO ? (
                      <span className="text-xs text-green-600">✓</span>
                    ) : (
                      <span className="text-xs text-terra-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

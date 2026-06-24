import { useAuth } from "../context/AuthContext";

export default function RoleSelector() {
  const { role, cambiarRol, ROLES } = useAuth();

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-6">
      <p className="text-xs font-bold text-amber-800 mb-2">🧪 MOCK — Selector de Rol (Fase 1A)</p>
      <div className="flex flex-wrap gap-2">
        {Object.values(ROLES).map((r) => (
          <button
            key={r}
            onClick={() => cambiarRol(r)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              role === r
                ? "bg-terra-600 text-white border-terra-600"
                : "bg-white text-terra-700 border-terra-300 hover:bg-terra-100"
            }`}
          >
            {r.replace("_", " ")}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-amber-600 mt-2">
        Rol activo: <strong>{role}</strong>. Sin autenticación real — simulación Fase 1A.
      </p>
    </div>
  );
}

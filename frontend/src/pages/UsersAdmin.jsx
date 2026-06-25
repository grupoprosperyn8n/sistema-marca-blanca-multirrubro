import { useState, useEffect, useCallback } from "react";
import { canViewField, getModuleActions, useAuth } from "../context/AuthContext";
import GlassCard from "../components/ui/GlassCard";
import PrimaryButton from "../components/ui/PrimaryButton";

const API = import.meta.env.VITE_API_BASE_URL || "";

// Estados visuales
const ESTADO_COLORS = {
  ACTIVO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BLOQUEADO: "bg-rose-100 text-rose-700 border-rose-200",
  PENDIENTE: "bg-amber-100 text-amber-700 border-amber-200",
  INACTIVO: "bg-gray-100 text-gray-500 border-gray-200",
};

const ROL_COLORS = {
  ADMINISTRADOR: "bg-purple-100 text-purple-700 border-purple-200",
  GERENTE: "bg-blue-100 text-blue-700 border-blue-200",
  EMPLEADO_GESTION: "bg-sky-100 text-sky-700 border-sky-200",
  PROFESIONAL: "bg-teal-100 text-teal-700 border-teal-200",
  SOLO_LECTURA: "bg-gray-100 text-gray-600 border-gray-200",
  CLIENTE: "bg-green-100 text-green-700 border-green-200",
};

export default function UsersAdmin() {
  const { role, access } = useAuth();
  const actions = getModuleActions(role, "usuarios", access);
  const canCreate = actions.create;
  const canEdit = actions.edit;
  const showEmail = canViewField(access, "USUARIOS", "EMAIL_LOGIN");
  const showPasswordFlags = canViewField(access, "USUARIOS", "REQUIERE_CAMBIO_CLAVE");
  const showLastLogin = canViewField(access, "USUARIOS", "ULTIMO_LOGIN");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRol, setNewRol] = useState("PROFESIONAL");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tempPwd, setTempPwd] = useState("");

  // Reset modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/admin/users`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al cargar usuarios");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Create User ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!canCreate) { setCreateError("Tu rol no tiene permiso para crear usuarios."); return; }
    if (!newName.trim() || !newEmail.trim()) { setCreateError("Completá todos los campos"); return; }

    setCreating(true);
    try {
      const res = await fetch(`${API}/api/auth/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newName.trim(), email: newEmail.trim(), rol_nombre: newRol }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al crear usuario");

      setTempPwd(data.temp_password || "");
      setNewName(""); setNewEmail(""); setNewRol("PROFESIONAL");
      fetchUsers();
      setSuccess(`Usuario ${data.nombre} creado.`);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Reset Password ──
  const handleReset = async (user) => {
    if (!canEdit) { setError("Tu rol no tiene permiso para resetear contraseñas."); return; }
    setResetTarget(user);
    setResetPwd("");
    setResetting(true);
    try {
      const res = await fetch(`${API}/api/auth/admin/users/${user.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al resetear contraseña");
      setResetPwd(data.temp_password || "");
      setSuccess(`Contraseña reseteada para ${user.nombre || user.nombre_usuario || user.email}`);
    } catch (err) {
      setError(err.message);
      setResetTarget(null);
    } finally {
      setResetting(false);
    }
  };

  // ── Force Password Change ──
  const handleForce = async (user) => {
    if (!canEdit) { setError("Tu rol no tiene permiso para forzar cambio de contraseña."); return; }
    try {
      const res = await fetch(`${API}/api/auth/admin/users/${user.id}/force-password-change`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      setSuccess(`${user.nombre || user.nombre_usuario || user.email} debe cambiar contraseña en próximo login`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Block / Unblock ──
  const handleToggleBlock = async (user) => {
    if (!canEdit) { setError("Tu rol no tiene permiso para bloquear o desbloquear usuarios."); return; }
    const isBlocked = user.estado_acceso === "BLOQUEADO";
    const endpoint = isBlocked ? "unblock" : "block";
    try {
      const res = await fetch(`${API}/api/auth/admin/users/${user.id}/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      setSuccess(isBlocked
        ? `${user.nombre || user.nombre_usuario || user.email} desbloqueado`
        : `${user.nombre || user.nombre_usuario || user.email} bloqueado`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Filters ──
  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase().trim();
    if (s) {
      const name = (u.nombre || u.nombre_usuario || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      if (!name.includes(s) && !email.includes(s)) return false;
    }
    if (filterRol && u.rol !== filterRol) return false;
    return true;
  });

  const rolesDisponibles = ["ADMINISTRADOR", "GERENTE", "EMPLEADO_GESTION", "PROFESIONAL", "SOLO_LECTURA", "CLIENTE"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-text)" }}>Gestión de Usuarios</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--brand-text-secondary)" }}>
            Crear, resetear contraseñas, forzar cambios, bloquear y desbloquear según permisos del rol
          </p>
        </div>
        <PrimaryButton
          disabled={!canCreate}
          title={!canCreate ? "Sin permiso para crear usuarios" : ""}
          onClick={() => { setShowCreate(true); setTempPwd(""); setCreateError(""); }}
        >
          + Nuevo Usuario
        </PrimaryButton>
      </div>

      {/* Alerts */}
      {error && <div className="px-4 py-3 rounded-lg bg-rose-50 text-rose-600 text-sm border border-rose-200 flex items-center justify-between">
        <span>{error}</span>
        <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-600">×</button>
      </div>}
      {success && <div className="px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 flex items-center justify-between">
        <span>{success}</span>
        <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">×</button>
      </div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white/80 text-sm flex-1 min-w-[200px]"
        />
        <select value={filterRol} onChange={e => setFilterRol(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white/80 text-sm">
          <option value="">Todos los roles</option>
          {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Users table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--brand-text)" }}>Usuario</th>
                  {showEmail && <th className="text-left px-4 py-3 font-semibold text-xs hidden sm:table-cell" style={{ color: "var(--brand-text)" }}>Email</th>}
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--brand-text)" }}>Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "var(--brand-text)" }}>Estado</th>
                  {showLastLogin && <th className="text-left px-4 py-3 font-semibold text-xs hidden md:table-cell" style={{ color: "var(--brand-text)" }}>Último Login</th>}
                  <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: "var(--brand-text)" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4 + (showEmail ? 1 : 0) + (showLastLogin ? 1 : 0)} className="text-center py-8 text-xs" style={{ color: "var(--brand-text-secondary)" }}>No se encontraron usuarios</td></tr>
                ) : filteredUsers.map(u => {
                  const isBlocked = u.estado_acceso === "BLOQUEADO";
                  const requiere = u.requiere_cambio_clave || u.debe_cambiar_password;
                  const displayName = u.nombre || u.nombre_usuario || "—";
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--brand-text)" }}>
                        {displayName}
                        {showPasswordFlags && requiere && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">🔑 debe cambiar</span>}
                      </td>
                      {showEmail && <td className="px-4 py-3 hidden sm:table-cell" style={{ color: "var(--brand-text-secondary)" }}>{u.email || "—"}</td>}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ROL_COLORS[u.rol] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {u.rol || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ESTADO_COLORS[u.estado_acceso] || ESTADO_COLORS.PENDIENTE}`}>
                          {u.estado_acceso || "PENDIENTE"}
                        </span>
                      </td>
                      {showLastLogin && <td className="px-4 py-3 hidden md:table-cell text-xs" style={{ color: "var(--brand-text-secondary)" }}>
                        {u.ultimo_login || "—"}
                      </td>}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button onClick={() => handleReset(u)} disabled={!canEdit || (resetting && resetTarget?.id === u.id)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                            title="Resetear contraseña">🔑</button>
                          <button onClick={() => handleForce(u)} disabled={!canEdit}
                            className="text-xs px-2 py-1 rounded border border-amber-200 hover:bg-amber-50 text-amber-700 disabled:opacity-50"
                            title="Forzar cambio">⚠️</button>
                          <button onClick={() => handleToggleBlock(u)} disabled={!canEdit}
                            className={`text-xs px-2 py-1 rounded border disabled:opacity-50 ${isBlocked ? 'border-emerald-200 hover:bg-emerald-50 text-emerald-700' : 'border-rose-200 hover:bg-rose-50 text-rose-700'}`}
                            title={isBlocked ? "Desbloquear" : "Bloquear"}>
                            {isBlocked ? "🔓" : "🔒"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30 text-xs" style={{ color: "var(--brand-text-secondary)" }}>
          {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""}
        </div>
      </GlassCard>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <GlassCard className="w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--brand-text)" }}>Nuevo Usuario</h2>
            {tempPwd ? (
              <div className="space-y-3">
                <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                  <p className="font-semibold text-emerald-800">Usuario creado exitosamente</p>
                  <p className="mt-2 text-xs text-emerald-600">Contraseña temporal (copiala ahora — solo se muestra una vez):</p>
                  <code className="block mt-1 px-3 py-2 bg-white rounded border border-emerald-200 font-mono text-sm text-emerald-900 select-all">{tempPwd}</code>
                </div>
                <PrimaryButton className="w-full justify-center" onClick={() => { setShowCreate(false); setTempPwd(""); }}>
                  Cerrar
                </PrimaryButton>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nombre</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Nombre completo" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    placeholder="usuario@example.com" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Rol</label>
                  <select value={newRol} onChange={e => setNewRol(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {createError && <p className="text-xs text-rose-500">{createError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                  <PrimaryButton type="submit" disabled={creating} className="flex-1 justify-center">
                    {creating ? "Creando..." : "Crear"}
                  </PrimaryButton>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      )}

      {/* ── Reset Password Result Modal ── */}
      {resetTarget && resetPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setResetTarget(null); setResetPwd(""); }}>
          <GlassCard className="w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--brand-text)" }}>Contraseña Reseteada</h2>
            <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <p className="font-semibold text-amber-800">{resetTarget.nombre || resetTarget.nombre_usuario || resetTarget.email}</p>
              <p className="mt-2 text-xs text-amber-600">Nueva contraseña temporal (solo se muestra una vez):</p>
              <code className="block mt-1 px-3 py-2 bg-white rounded border border-amber-200 font-mono text-sm select-all">{resetPwd}</code>
            </div>
            <PrimaryButton className="w-full justify-center mt-4" onClick={() => { setResetTarget(null); setResetPwd(""); }}>
              Entendido
            </PrimaryButton>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

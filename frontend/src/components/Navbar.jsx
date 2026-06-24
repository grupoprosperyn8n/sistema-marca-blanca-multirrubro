import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, getNavLinks } from "../context/AuthContext";

export default function Navbar() {
  const { role, usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = getNavLinks(role);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="bg-terra-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-cobre-200">
          Sistema
        </Link>

        <div className="flex gap-4 items-center">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm px-3 py-1 rounded transition ${
                location.pathname === l.to || (l.to !== "/" && location.pathname.startsWith(l.to))
                  ? "bg-terra-600 text-white"
                  : "text-terra-200 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-terra-300 bg-terra-700 px-2 py-0.5 rounded">
            {role.replace(/_/g, " ")}
          </span>
          {usuario ? (
            <>
              <span className="text-xs text-terra-300">{(usuario.nombre || usuario.nombre_usuario || usuario.email)}</span>
              <button
                onClick={handleLogout}
                className="text-xs bg-terra-600 hover:bg-terra-500 px-2 py-1 rounded"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xs bg-cobre-500 hover:bg-cobre-400 px-3 py-1 rounded text-white"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

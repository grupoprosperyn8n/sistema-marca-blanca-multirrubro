# Decision de Arquitectura — ProtectedRoute + loading

**Fecha**: 2026-06-21
**Fase**: FASE_2A_D_AUTH_FRONTEND_INTEGRACION_CONTROLADA
**Contexto**: Cierre de integracion auth frontend

## Problema

Al refrescar la pagina estando autenticado (location.reload() en /backoffice), el usuario era redirigido a /login a pesar de tener una cookie auth_token HttpOnly valida.

## Causa raiz

Race condition en ProtectedRoute (App.jsx):

1. AuthProvider monta con usuario=null, loading=true
2. useEffect dispara fetch("/api/auth/me") (asincrono)
3. Antes de que /me responda, ProtectedRoute evalua !usuario → true → redirect /login
4. /me responde con user data → setUsuario(data) → pero ya es tarde

## Solucion

ProtectedRoute ahora espera que loading === false antes de decidir:

```
function ProtectedRoute({ children, roles }) {
  const { role, usuario, permisos, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!usuario) return <Navigate to="/login" replace />;
  ...
}
```

## Verificacion

- location.reload() en /backoffice → sesion persiste OK
- /api/auth/me responde con user data usando la cookie OK
- Consola: 0 errores OK
- npm run build: OK

## Regla permanente

TODO componente que haga guards de autenticacion DEBE esperar loading del contexto de auth antes de redirigir.
El AuthProvider tiene loading=true inicialmente y lo pone en false en el .finally() del /me.
Cualquier redirect antes de loading=false causa race condition y rompe la persistencia de sesion en refresh.

# SALON-013R — Reporte QA Frontend de Roles

**Fecha**: 2026-06-23 | **Version**: 1.0 | **Fase**: SALON-013R_QA_FRONTEND_ROLES_SURGE

## Resumen Ejecutivo

QA funcional completa de 6 roles sobre el frontend desplegado en Surge contra backend Railway. **APROBADO** con 1 bug menor y 1 mejora futura documentada. Cero bloqueantes.

## Resultados por Rol

### 1. ADMINISTRADOR
| Item | Resultado |
|------|-----------|
| Login | OK -> Dashboard Backoffice |
| Secciones | 8/8 (todas) |
| Usuarios admin | OK, CRUD completo |
| Sucursales | OK, 8 registros |
| Logout/Refresh | OK |
| Consola | limpia |

### 2. GERENTE
| Item | Resultado |
|------|-----------|
| Login | OK -> Dashboard Backoffice |
| Secciones | 6/8 (-Config, -Usuarios) |
| Bloqueos | OK: /usuarios, /configuracion |
| Logout/Refresh | OK |
| Consola | limpia |

### 3. EMPLEADO_GESTION
| Item | Resultado |
|------|-----------|
| Login | OK -> Dashboard Backoffice |
| Secciones | 5/8 (-Suc, -Config, -Usuarios) |
| Bloqueo Config | OK |
| Bloqueo Usuarios | OK |
| Bloqueo Sucursales | BUG - accesible por URL |
| Logout/Refresh | OK |
| Consola | limpia |

### 4. PROFESIONAL
| Item | Resultado |
|------|-----------|
| Login | OK -> Portal Profesional |
| Vista | Agenda semanal + Citas |
| Backoffice | BLOQUEADO |
| Logout/Refresh | OK |
| Consola | limpia |

### 5. CLIENTE
| Item | Resultado |
|------|-----------|
| Login | OK -> Mi Portal |
| Vista | Perfil + Servicios + Reservar |
| Backoffice | BLOQUEADO -> redirect portal |
| Logout/Refresh | OK |
| Consola | limpia |

### 6. SOLO_LECTURA
| Item | Resultado |
|------|-----------|
| Login | OK -> Dashboard Backoffice |
| Secciones | 7/8 (-Usuarios) |
| Editar | NO PERMITE (sin botones accion) |
| Bloqueo Usuarios | OK |
| Logout/Refresh | OK |
| Consola | limpia |

## Bugs

### BUG-013R-01: EMPLEADO_GESTION accede a Sucursales por URL (MENOR)
- Ruta: /backoffice/sucursales
- Causa: route guard no verifica verSucursales
- Fix: agregar check de permisos en ProtectedRoute

## No Bloqueante

### HN-013R-01: /api/auth/refresh no implementado
- Backend: 404
- Frontend no lo usa actualmente
- Tokens expiran a 8h sin refresh

## Veredicto

**SALON-013R: APROBADO**

| Metrica | Valor |
|---------|-------|
| Roles validados | 6/6 |
| Bugs bloqueantes | 0 |
| Bugs menores | 1 |
| Mejoras futuras | 1 |
| Errores JS | 0 |
| Secretos expuestos | 0 |

## Recomendacion

1. Cerrar SALON-013R como APROBADO
2. Crear ticket BUG-013R-01 (prioridad baja)
3. Crear ticket HN-013R-01 (backlog)
4. Avanzar a FASE_3 previa aprobacion

---

# PATCH_013R — Corrección BUG-013R-01

**Fecha**: 2026-06-23 | **Commit**: `1a6b060`

## BUG-013R-01 → CORREGIDO ✅

| Antes | Después |
|-------|---------|
| EMPLEADO_GESTION accedía a `/backoffice/sucursales` por URL directa (la ruta compartía `ROLES_GESTION` con Clientes y Servicios) | EMPLEADO_GESTION bloqueado. Ruta Sucursales protegida por `ROLES_SUCURSALES = [ADMINISTRADOR, GERENTE, SOLO_LECTURA]` |

**Fix**: `frontend/src/App.jsx` — se agregó `ROLES_SUCURSALES` y se separó la ruta Sucursales de la ruta compartida Clientes/Servicios.

**Validado en bundle Surge**: `Ax = [B.ADMINISTRADOR, B.GERENTE, B.SOLO_LECTURA]` protege `ir(Ax, {path:"/backoffice/sucursales"})`.

## Estado final SALON-013R

- **BUG-013R-01**: CORREGIDO ✅
- **HN-013R-01** (/api/auth/refresh): permanece como mejora futura no bloqueante
- **Veredicto**: APROBADO — todos los roles validados, 0 bugs activos


---

# 🏁 CIERRE FORMAL — SALON-013R

**Fecha**: 2026-06-23 | **Commit**: `1a6b060` | **Fase**: CIERRE_FINAL_SALON_013R

## Estado Final

| Métrica | Valor |
|---------|-------|
| Bugs corregidos | 1/1 (BUG-013R-01) |
| Bugs activos | **0** |
| Mejoras futuras | 1 (HN-013R-01) |
| Roles validados | 6/6 |
| Errores JS | 0 |
| Secretos expuestos | 0 |
| Build | OK |
| Deploy Surge | OK |
| Commit | `1a6b060` |
| Veredicto | **APROBADO — CERRADO** ✅ |

## Lecciones

- **Route guard granular**: El check de roles global no cubre permisos por vista. Usar arrays de roles específicos por ruta (ROLES_SUCURSALES, ROLES_GESTION, etc.).
- **Dos capas independientes**: Sidebar (UI) + Route guard (lógica). Validar ambas por separado en QA.
- **Verificación bundle**: Siempre verificar el bundle minificado post-deploy para confirmar que el código minificado refleja el fix.

## Próximo Paso

FASE_3 — propuesta en preparación para aprobación.

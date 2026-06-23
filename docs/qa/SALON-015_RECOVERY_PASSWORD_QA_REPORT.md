# 🔐 Reporte QA — Flujo de Recuperación de Contraseña

**Proyecto:** Sistema Marca Blanca Multirrubro (Demo: Belleza)
**Fase:** SALON-015 (a/b/c/d) — Recovery Password
**Fecha:** 2026-06-22
**Estado:** ✅ APROBADO — Listo para cierre
**Backend:** Railway — https://earnest-comfort-production-3d75.up.railway.app
**Frontend:** Surge.sh — https://bellezapro-demo.surge.sh
**Commit checkpoint:** 8565d30

---

## 1. Resumen Ejecutivo

Se implementó y verificó el flujo completo de recuperación de contraseña para el sistema de autenticación. El flujo cubre: solicitud de recuperación → envío de email automatizado → reseteo de contraseña con token → login con nueva credencial.

**Resultado: 6/6 pruebas pasadas, 2 bugs corregidos y re-testeados, security audit sin hallazgos críticos.**

---

## 2. Descripción del Flujo

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Usuario     │────▶│  Forgot PW   │────▶│  Automation      │────▶│  Email      │
│  olvida pw   │     │  POST /api/  │     │  Airtable        │     │  con link   │
│              │     │  auth/       │     │  ENVIAR_EMAIL    │     │  de reset   │
└─────────────┘     │  forgot-     │     └──────────────────┘     └──────┬──────┘
                    │  password    │                                      │
                    └──────┬───────┘                                      │
                           │                                              ▼
                    ┌──────▼───────┐                              ┌──────────────┐
                    │  Setea       │                              │  Usuario hace │
                    │  Estados     │                              │  clic en link │
                    │  en Airtable │                              └──────┬───────┘
                    └──────────────┘                                     │
                                                                  ┌──────▼───────┐
                                                                  │  Reset PW    │
                                                                  │  POST /api/  │
                                                                  │  auth/reset- │
                                                                  │  password    │
                                                                  └──────┬───────┘
                                                                         │
                                                            ┌────────────┴────────────┐
                                                            ▼                         ▼
                                                    ┌──────────────┐         ┌──────────────┐
                                                    │  Login OK    │         │  401 / 400   │
                                                    │  (nueva pw)  │         │  (vieja/reuso)│
                                                    └──────────────┘         └──────────────┘
```

### Campos de Airtable Involucrados (tabla USUARIOS)

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `ESTADO_RECUPERACION_CLAVE` | Single select | Estado del flujo (RECUPERACION_SOLICITADA / EMAIL_ENVIADO / TOKEN_USADO / EXPIRADO) |
| `RESET_PASSWORD_TOKEN_HASH` | Single line text | Token hasheado (SHA256) para verificación |
| `RESET_PASSWORD_URL_TEMPORAL` | Single line text | URL temporal generada por el backend |
| `RESET_PASSWORD_EXPIRA` | Date/time | Fecha de expiración del token (30 min desde solicitud) |
| `RESET_PASSWORD_SOLICITADO_EN` | Date/time | Timestamp de la solicitud |
| `RESET_PASSWORD_USADO_EN` | Date/time | Timestamp del uso exitoso del token |
| `RESET_PASSWORD_EMAIL_ENVIADO_EN` | Date/time | Timestamp del envío de email (seteado por automation) |

---

## 3. Pruebas Realizadas

### R1 — Transiciones de ESTADO_RECUPERACION_CLAVE
| # | Transición | Trigger | Resultado |
|---|-----------|---------|-----------|
| 1 | (vacío) → RECUPERACION_SOLICITADA | forgot-password | ✅ PASS |
| 2 | RECUPERACION_SOLICITADA → EMAIL_ENVIADO | Automation Airtable (~10s) | ✅ PASS |
| 3 | (cualquier estado) → TOKEN_USADO | Reset exitoso | ✅ PASS |
| 4 | (token vencido) → EXPIRADO | Reset falla (vencido) | ✅ PASS (BUG 1 corregido) |
| 5 | EMAIL_ENVIADO_EN se limpia en nuevo forgot | forgot-password consecutivo | ✅ PASS (BUG 2 corregido) |
| 6 | Estados vacío/null permitidos | Sin recovery en curso | ✅ PASS |

### R2 — Forgot-Password + Automation Email
| Check | Resultado |
|-------|-----------|
| POST /api/auth/forgot-password → 200 | ✅ |
| Se genera RESET_PASSWORD_TOKEN_HASH | ✅ |
| Se genera RESET_PASSWORD_URL_TEMPORAL | ✅ |
| ESTADO_RECUPERACION_CLAVE = RECUPERACION_SOLICITADA | ✅ |
| Automation dispara en ~10s → EMAIL_ENVIADO | ✅ |

### R3 — Reset de Contraseña (token válido)
| Check | Resultado |
|-------|-----------|
| POST /api/auth/reset-password → 200 | ✅ |
| CONTRASENA_HASH actualizado | ✅ |
| ESTADO_RECUPERACION_CLAVE = TOKEN_USADO | ✅ |
| RESET_PASSWORD_TOKEN_HASH limpiado | ✅ |
| INTENTOS_FALLIDOS = 0 | ✅ |
| BLOQUEADO_HASTA = None | ✅ |

### R4 — Login post-reset
| Check | Resultado |
|-------|-----------|
| Login con nueva contraseña → 200 + cookie | ✅ |
| Rol y permisos intactos | ✅ |
| Login con contraseña vieja → 401 rechazada | ✅ |

### R5 — Reuso de Token
| Check | Resultado |
|-------|-----------|
| POST reset-password con mismo token → 400 | ✅ |
| Mensaje: "Token inválido o vencido" | ✅ |

### R6 — Token Vencido
| Check | Resultado |
|-------|-----------|
| POST reset-password con token vencido → 400 | ✅ |
| ESTADO_RECUPERACION_CLAVE = EXPIRADO | ✅ |
| Contraseña original intacta (login OK) | ✅ |
| Contraseña nueva rechazada (login 401) | ✅ |

---

## 4. Bugs Detectados y Corregidos

### BUG 1 — [MEDIUM] EXPIRADO no se setea al rechazar token vencido
- **Síntoma:** Al intentar resetear con token vencido, el backend devolvía 400 pero no actualizaba ESTADO_RECUPERACION_CLAVE a EXPIRADO.
- **Causa:** El código de `reset_password()` levantaba HTTPException antes de llamar a `client.patch_record()`.
- **Fix:** Mover la llamada `client.patch_record(..., {"ESTADO_RECUPERACION_CLAVE": "EXPIRADO"})` **antes** del `raise HTTPException(400)`.
- **Archivo:** `backend/auth/routes.py` (líneas 562-575)
- **Commit:** 5b436ff

### BUG 2 — [LOW-MEDIUM] EMAIL_ENVIADO_EN stale bloquea re-disparo de automation
- **Síntoma:** Si la automation no se disparaba correctamente, el campo `RESET_PASSWORD_EMAIL_ENVIADO_EN` quedaba con un timestamp viejo que impedía re-ejecutar forgot-password.
- **Causa:** El backend no limpiaba `RESET_PASSWORD_EMAIL_ENVIADO_EN` al iniciar un nuevo forgot-password.
- **Fix:** Agregar `"RESET_PASSWORD_EMAIL_ENVIADO_EN": None` al `patch_record` de recovery en `forgot_password()`.
- **Archivo:** `backend/auth/routes.py` (línea 474)
- **Commit:** 5b436ff

### Regla de Validación — Validación de password alfanumérica
- **Descripción:** La validación de password en el backend aplica las siguientes reglas:
  - mínimo 7 caracteres;
  - al menos 1 letra;
  - al menos 1 número;
  - solo caracteres alfanuméricos.
- **Impacto:** Los símbolos y caracteres especiales son rechazados por diseño.
- **Estado:** Decisión de producto vigente. Relajar esta regla requeriría aprobación de producto.

---

## 5. Automations de Airtable

| Nombre | Tipo | Trigger | Acción | Estado QA |
|--------|------|---------|--------|-----------|
| **RECUPERACION_PASSWORD_ENVIAR_EMAIL** | Automation nativa Airtable | Cambio en USUARIOS (ESTADO_RECUPERACION_CLAVE = RECUPERACION_SOLICITADA) | Envía email con link de reset, setea EMAIL_ENVIADO_EN | ✅ Verificado end-to-end |
| **RECUPERACION_PASSWORD_ALERTA_ERROR** | Automation nativa Airtable | Errores en flujos críticos (backup, recovery, auth) | Notifica al administrador | ⚠️ Configurada y activa. Pendiente: prueba negativa controlada (forzar error y verificar notificación) |
| **RECUPERACION_PASSWORD_REVISION_SEMANAL** | Cron semanal | Schedule | Auditoría de tokens no usados, usuarios bloqueados | ⚠️ Activa. Script probado manualmente. Ejecución semanal real depende del calendario Airtable |

---

## 6. Auditoría de Seguridad (SALON-015c)

| Categoría | Check | Resultado |
|-----------|-------|-----------|
| **Almacenamiento** | Passwords en bcrypt ($2b$, 12 rounds) | ✅ |
| **Almacenamiento** | Token de reset hasheado (SHA256) en BD | ✅ |
| **Almacenamiento** | Token hasheado no reversible | ✅ |
| **Rate-limiting** | forgot-password: 3 intentos / 15 min por IP | ✅ |
| **Rate-limiting** | reset-password: 5 intentos / 15 min por IP | ✅ |
| **Red** | CORS configurado (allow_credentials=True) | ✅ |
| **Red** | Cookie HttpOnly/Secure/SameSite | ✅ |
| **Red** | Sin exposición de secretos en respuestas API | ✅ |
| **Validación** | Password mín. 7 caracteres, al menos 1 letra + 1 número, solo alfanumérico | ⚠️ Símbolos no permitidos por decisión de producto |

---

## 7. Seguimiento de Commits

| Commit | Fecha | Descripción | Estado |
|--------|-------|-------------|--------|
| ea181ae | 2026-06-22 | PATCH: forgot-password setea estados recovery + URL temporal | ✅ Online |
| 5b436ff | 2026-06-22 | PATCH: BUG 1 (EXPIRADO) + BUG 2 (limpiar EMAIL_ENVIADO_EN) | ✅ Online |
| 8565d30 | 2026-06-22 | Checkpoint: recovery password flow completed | ✅ Main |

---

## 8. Riesgos Remanentes

| Riesgo | Severidad | Impacto | Mitigación |
|--------|-----------|---------|------------|
| Validación de password alfanumérica (regla de producto) | 🟢 Baja | UX: usuarios no pueden usar símbolos en passwords | Evaluar relajar validación si producto lo aprueba |
| Rate-limit en memoria (pérdida en cold-start) | 🟡 Media | Usuario puede exceder intentos si Railway hace cold-start | Implementar rate-limit persistente (Redis) |
| Sin refresh token JWT | 🟡 Media | Sesión expira a las 8h sin renovación posible | Planificar en FASE_2B |
| Password demo público conocida | 🟢 Baja | Usuario demo con password conocida | Rotar antes de usuarios reales |
| Sin registro de auditoría de recovery | 🟢 Baja | No hay log de quién solicitó reset | Agregar logging estructurado |

---

## 9. Veredicto y Recomendación

### ✅ APROBADO — Listo para cierre de FASE RECOVERY

El flujo de recuperación de contraseña funciona end-to-end en producción. Todos los casos de prueba (válido, vencido, reuso, seguridad) fueron verificados exitosamente. Los 2 bugs detectados fueron corregidos, re-testeados y desplegados.

**Recomendación:** Proceder sin bloqueo a las siguientes fases. La validación de password alfanumérica es una decisión de producto, no un bug. Puede evaluarse como mejora de UX en fase de hardening si producto lo aprueba.

### Próximos Pasos Sugeridos
1. Implementar refresh token JWT (sesión > 8h)
2. Rate-limit persistente (Redis)
3. Evaluar relajar validación de password (permitir símbolos) si producto lo aprueba
4. Registro de auditoría de recovery

---

*Reporte generado por 8-Documentation & Contracts — 2026-06-22*

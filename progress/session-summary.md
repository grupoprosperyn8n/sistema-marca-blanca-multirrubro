# SALON-015b — QA Reset Password Completo

**Fecha:** 2026-06-22
**Estado:** COMPLETO — 6/6 pruebas, 2 bugs corregidos, re-test OK

Demo user: sololectura@salon.com

---

## R1 — Opciones ESTADO_RECUPERACION_CLAVE
PASS — 6/6

## R2 — Forgot + automation
PASS — EMAIL_ENVIADO a 10s

## R3 — Reset valido
PASS — 200, TOKEN_USADO

## R4a — Login password nueva
PASS — 200, SOLO_LECTURA_DEMO

## R4b — Login password vieja
PASS — 401 rechazada

## R5 — Reuso token
PASS — 400 Token invalido o vencido

## R6 — Token vencido (post-fix)
- Reset rechazado 400: PASS
- Password intacta (TempPW999 sigue funcionando): PASS  
- Password rechazada (NewPass99 rechazada): PASS
- ESTADO_RECUPERACION_CLAVE → EXPIRADO: **PASS ✓** (fix aplicado)

---

## PATCH: RECOVERY_PASSWORD_ESTADOS_Y_RETEST

**Commit:** 5b436ff
**Deploy Railway:** 79eb5e0b → SUCCESS
**Rama:** main

### Fix 1 — BUG 1: setear EXPIRADO en token vencido

**Archivo:** `backend/auth/routes.py` (línea 562-575)
**Cambio:** En `reset_password()`, bloque que detecta token vencido, agregar `client.patch_record("USUARIOS", user_id, {"ESTADO_RECUPERACION_CLAVE": "EXPIRADO"})` antes de levantar HTTPException 400.

**Re-test post-deploy:**
| Check | Resultado |
|-------|-----------|
| Token vencido → 400 | ✅ PASS |
| ESTADO_RECUPERACION_CLAVE = EXPIRADO | ✅ PASS |
| Contraseña vieja (TempPW999) login OK | ✅ 200 |
| Contraseña nueva (NewPass99) login rechazado | ✅ 401 |

### Fix 2 — BUG 2: limpiar EMAIL_ENVIADO_EN en forgot-password

**Archivo:** `backend/auth/routes.py` (línea 474)
**Cambio:** En `forgot_password()`, agregar `"RESET_PASSWORD_EMAIL_ENVIADO_EN": None` al patch_record de recovery. El backend limpia el campo; el automation de Airtable luego lo sobreescribe con el timestamp nuevo (~3-10s). Esto evita que queden datos viejos si el automation falla.

**Re-test post-deploy:**
| Check | Resultado |
|-------|-----------|
| Forgot-password → 200 | ✅ PASS |
| Automation dispara (EMAIL_ENVIADO) | ✅ PASS |
| EMAIL_ENVIADO_EN limpiado antes del automation | ✅ (backend lo setea a None; automation sobreescribe con timestamp nuevo) |

---

## BUG 3 — Password solo alfanumerica
Backend rechaza caracteres especiales. Solo letras y numeros.
Severidad: Baja. No autorizado modificar en esta fase.

---

## Veredicto Final

**RECOVERY PASSWORD: COMPLETO Y CORREGIDO**
Flujo core funciona end-to-end. Ambos bugs de SALON-015b corregidos y re-testeados.
Rate-limit: 3 forgot / 15 min efectivo.

---

## Pendientes
- SALON-015d: documentacion (asignado a Documentation)
- BUG 3: evaluar si relajar validacion de password (baja prioridad)

SALON-015b: ✅ COMPLETED

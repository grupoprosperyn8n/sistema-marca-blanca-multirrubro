"""
backend/auth/routes.py — Auth endpoints: login, me, logout.

Endpoints:
  POST /api/auth/login   — verify credentials, set HttpOnly cookie
  GET  /api/auth/me      — return current user from cookie
  POST /api/auth/logout  — clear auth cookie
"""

import logging
from datetime import date, datetime, timezone

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr

from airtable_adapter import AirtableClient
from .rate_limit import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Models ────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str = ""
    nombre: str = ""
    rol: str = ""
    cliente: str = ""


class LoginResponse(BaseModel):
    message: str
    user: UserResponse
    debe_cambiar_password: bool = False
    estado_acceso: str = ""


# ── Helpers ───────────────────────────────────
def _resolve_rol(rol_field) -> str:
    """Resuelve campo ROL (Link a ROLES) a string NOMBRE_ROL."""
    if isinstance(rol_field, list) and rol_field:
        linked_id = rol_field[0]
        try:
            client = AirtableClient()
            rol_record = client.get_record("ROLES", linked_id)
            return rol_record.get("fields", {}).get("NOMBRE_ROL", "")
        except Exception as e:
            logger.warning("Failed to resolve ROL linked record %s: %s", linked_id, e)
            return ""
    return str(rol_field) if rol_field else ""


def _format_user(record: dict) -> UserResponse:
    fields = record.get("fields", {})
    # CLIENTE is a multipleRecordLinks → list; extract first ID or ""
    cliente_raw = fields.get("CLIENTE", "")
    cliente = (
        cliente_raw[0] if isinstance(cliente_raw, list) and cliente_raw
        else str(cliente_raw) if cliente_raw else ""
    )
    return UserResponse(
        id=record["id"],
        email=fields.get("EMAIL_LOGIN", ""),
        nombre=fields.get("NOMBRE_USUARIO", ""),
        rol=_resolve_rol(fields.get("ROL", "")),
        cliente=cliente,
    )


def _set_cookie(response: Response, token: str):
    """Set auth_token cookie with centralized config."""
    from .security import get_cookie_config

    cfg = get_cookie_config()
    response.set_cookie(
        key=cfg["key"],
        value=token,
        httponly=cfg["httponly"],
        samesite=cfg["samesite"],
        secure=cfg["secure"],
        max_age=cfg["max_age"],
        path=cfg["path"],
    )


# ── POST /api/auth/login ─────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, response: Response, request: Request):
    """Verify credentials and set auth_token cookie."""
    from .security import verify_password, create_token, check_jwt_configured

    if not check_jwt_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth no configurado. JWT_SECRET requerido en entorno.",
        )

    email = body.email.strip().lower()

    # ── Rate-limit check ────────────────────────
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.headers.get("X-Real-IP", "") or (request.client.host if request.client else "unknown")
    remaining = check_rate_limit(client_ip, email)
    if remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Esperá 15 minutos.",
        )

    client = AirtableClient()

    # ── Find user by email ──────────────────
    try:
        records = client.list_records(
            "USUARIOS",
            filter_formula=f"{{EMAIL_LOGIN}}='{email}'",
            max_records=1,
        )
    except Exception as e:
        logger.error("Airtable lookup failed for %s: %s", email, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al buscar usuario.",
        )

    if not records:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas.",
        )

    user_record = records[0]
    fields = user_record.get("fields", {})
    user_id = user_record["id"]

    # ── Check BLOQUEADO_HASTA ──────────────────
    bloqueado_hasta = fields.get("BLOQUEADO_HASTA")
    if bloqueado_hasta:
        if isinstance(bloqueado_hasta, str):
            bloqueado_hasta_date = date.fromisoformat(bloqueado_hasta[:10])
        else:
            bloqueado_hasta_date = bloqueado_hasta
        if bloqueado_hasta_date >= date.today():
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Cuenta bloqueada.",
            )

    # ── Check EMAIL_VERIFICADO ─────────────────
    email_verificado = fields.get("EMAIL_VERIFICADO")
    if email_verificado is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email no verificado.",
        )

    # ── Verify password ────────────────────────
    hashed = fields.get("CONTRASENA_HASH", "")
    if not hashed or not verify_password(body.password, hashed):
        # Increment INTENTOS_FALLIDOS
        intentos = fields.get("INTENTOS_FALLIDOS", 0) or 0
        try:
            client.patch_record(
                "USUARIOS",
                user_id,
                {"INTENTOS_FALLIDOS": intentos + 1},
            )
        except Exception as e:
            logger.error("Failed to update INTENTOS_FALLIDOS: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas.",
        )

    # ── Success: reset INTENTOS_FALLIDOS, update ULTIMO_LOGIN ──
    today_str = date.today().isoformat()  # YYYY-MM-DD
    try:
        client.patch_record(
            "USUARIOS",
            user_id,
            {
                "INTENTOS_FALLIDOS": 0,
                "ULTIMO_LOGIN": today_str,
            },
        )
    except Exception as e:
        logger.error("Failed to update login success fields: %s", e)

    # ── Create JWT ─────────────────────────────
    token = create_token(
        user_id=user_id,
        email=email,
        nombre=fields.get("NOMBRE_USUARIO", ""),
        rol=_resolve_rol(fields.get("ROL", "")),
    )

    _set_cookie(response, token)

    user = _format_user(user_record)
    requiere_cambio = fields.get("REQUIERE_CAMBIO_CLAVE", False)
    estado_acceso = fields.get("ESTADO_USUARIO", "")
    return LoginResponse(
        message="Login exitoso.",
        user=user,
        debe_cambiar_password=bool(requiere_cambio),
        estado_acceso=estado_acceso if estado_acceso else "",
    )


# ── GET /api/auth/me ──────────────────────────
@router.get("/me")
async def me(request: Request, auth_token: str = Cookie(default=None)):
    """Return current user from JWT cookie. Requires valid auth_token."""
    from .dependencies import get_current_user

    user = await get_current_user(request, auth_token)
    # FASE_2D: incluir debe_cambiar_password
    client = AirtableClient()
    user_email = user.get("email", "")
    records = client.list_records("USUARIOS", filter_formula=f"{{EMAIL_LOGIN}}='{user_email}'", max_records=1)
    requiere = False
    estado = ""
    if records:
        fields = records[0].get("fields", {})
        requiere = bool(fields.get("REQUIERE_CAMBIO_CLAVE", False))
        estado = fields.get("ESTADO_USUARIO", "") or ""
    return {
        **user,
        "debe_cambiar_password": requiere,
        "estado_acceso": estado,
    }


# ── POST /api/auth/logout ─────────────────────
@router.post("/logout")
async def logout(response: Response):
    """Clear auth_token cookie."""
    from .security import get_cookie_config

    cfg = get_cookie_config()
    response.delete_cookie(
        key=cfg["key"],
        path=cfg["path"],
        httponly=cfg["httponly"],
        samesite=cfg["samesite"],
        secure=cfg["secure"],
    )
    return {"message": "Sesión cerrada."}


# ══ FASE_2C: Register + Recovery ════════════
from typing import Optional as _Optional
from datetime import datetime as _datetime, timedelta as _timedelta, timezone as _timezone
from pydantic import BaseModel as _BaseModel

_RESET_TOKEN_MINUTES = 15+15  # 30 min

# ── Models ────────────────────────────────────
class RegisterClientRequest(_BaseModel):
    nombre: str
    email: str
    password: str
    confirm_password: str
    telefono: _Optional[str] = ""


class RegisterClientResponse(_BaseModel):
    message: str
    user_id: str = ""
    email: str = ""


class ForgotPasswordRequest(_BaseModel):
    email: str


class ForgotPasswordResponse(_BaseModel):
    message: str


class ResetPasswordRequest(_BaseModel):
    token: str
    password: str
    confirm_password: str


class ResetPasswordResponse(_BaseModel):
    message: str


# ── Helpers ───────────────────────────────────
def _get_client_ip(request: Request) -> str:
    """Extract real client IP from headers."""
    return (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or request.headers.get("X-Real-IP","")
        or (request.client.host if request.client else "unknown")
    )


def _normalize_email(email: str) -> str:
    """Trim and lowercase email."""
    return email.strip().lower()


def _find_user_by_email(client: AirtableClient, email: str) -> dict | None:
    """Find a USUARIOS record by EMAIL_LOGIN. Returns record or None."""
    try:
        records = client.list_records(
            "USUARIOS",
            filter_formula=f"{{EMAIL_LOGIN}}='{email}'",
            max_records=1,
        )
        return records[0] if records else None
    except Exception as e:
        logger.error("Airtable lookup failed for %s: %s", email, e)
        return None


# ── POST /api/auth/register-client ────────────
@router.post("/register-client", response_model=RegisterClientResponse)
async def register_client(body: RegisterClientRequest, request: Request, response: Response):
    """Register a new CLIENTE user. Public endpoint — only CLIENTE role."""
    from .rate_limit import check_register_limit
    from .security import hash_password, validate_password

    client_ip = _get_client_ip(request)
    email = _normalize_email(body.email)

    # ── Rate limit ───────────────────────
    if check_register_limit(client_ip) <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espera 15 minutos.",
        )

    # ── Validate fields ────────────────
    if not body.nombre.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre es obligatorio.",
        )

    if body.password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden.",
        )

    is_valid, pw_error = validate_password(body.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_error,
        )

    client = AirtableClient()

    # ── Check duplicate email ──────────
    existing = _find_user_by_email(client, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese email.",
        )

    # ── Create or reuse CLIENTES record ─
    cliente_id = None
    try:
        existing_clients = client.list_records(
            "CLIENTES",
            filter_formula=f"{{EMAIL}}='{email}'",
            max_records=1,
        )
        if existing_clients:
            cliente_id = existing_clients[0]["id"]
            logger.info("Reusing existing CLIENTES record %s for %s", cliente_id, email)
    except Exception as e:
        logger.warning("CLIENTES lookup failed: %s", e)

    if not cliente_id:
        try:
            cliente_fields = {
                "NOMBRE_CLIENTE": body.nombre.strip(),
                "EMAIL": email,
            }
            if body.telefono and body.telefono.strip():
                cliente_fields["TELEFONO"] = body.telefono.strip()
            new_cliente = client.create_record("CLIENTES", cliente_fields)
            cliente_id = new_cliente["id"]
            logger.info("Created CLIENTES record %s for %s", cliente_id, email)
        except Exception as e:
            logger.error("Failed to create CLIENTES: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear perfil de cliente.",
            )

    # ── Create USUARIOS with ROL CLIENTE ─
    password_hash = hash_password(body.password)
    rol_cliente_id = "recTJFfeiWzjliBGd"

    try:
        new_user = client.create_record(
            "USUARIOS",
            {
                "NOMBRE_USUARIO": body.nombre.strip(),
                "EMAIL_LOGIN": email,
                "CONTRASENA_HASH": password_hash,
                "ROL": [rol_cliente_id],
                "CLIENTE": [cliente_id],
                "ACTIVO": True,
                "EMAIL_VERIFICADO": True,
                "INTENTOS_FALLIDOS": 0,
            },
        )
        user_id = new_user["id"]
        logger.info("Created USUARIOS %s (CLIENTE) for %s", user_id, email)
    except Exception as e:
        logger.error("Failed to create USUARIOS: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear cuenta de usuario.",
        )

    return RegisterClientResponse(
        message="Cuenta creada exitosamente. Ya puedes iniciar sesión.",
        user_id=user_id,
        email=email,
    )


# ── POST /api/auth/forgot-password ────────────
@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest, request: Request):
    """Request a password reset. Always returns generic message."""
    from .rate_limit import check_forgot_password_limit
    from .security import generate_reset_token

    client_ip = _get_client_ip(request)
    email = _normalize_email(body.email)

    if check_forgot_password_limit(client_ip) <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espera 15 minutos.",
        )

    client = AirtableClient()
    user = _find_user_by_email(client, email)

    if user:
        plain_token, token_hash = generate_reset_token()
        now_utc = _datetime.now(_timezone.utc)
        expires_at = now_utc + _timedelta(minutes=_RESET_TOKEN_MINUTES)

        try:
            client.patch_record(
                "USUARIOS",
                user["id"],
                {
                    "RESET_PASSWORD_TOKEN_HASH": token_hash,
                    "RESET_PASSWORD_EXPIRA": expires_at.isoformat(),
                    "RESET_PASSWORD_SOLICITADO_EN": now_utc.isoformat(),
                    "RESET_PASSWORD_USADO_EN": None,
                },
            )
            logger.info(
                "Reset token generated for %s (user %s), expires %s",
                email, user["id"], expires_at.isoformat(),
            )
        except Exception as e:
            logger.error("Failed to store reset token for %s: %s", email, e)

    return ForgotPasswordResponse(
        message="Si el email está registrado, recibirás instrucciones para recuperar tu contraseña."
    )


# ── POST /api/auth/reset-password ─────────────
@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(body: ResetPasswordRequest, request: Request):
    """Reset password using a valid token."""
    from .rate_limit import check_reset_password_limit
    from .security import verify_reset_token, hash_password, validate_password

    client_ip = _get_client_ip(request)

    if check_reset_password_limit(client_ip) <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espera 15 minutos.",
        )

    if body.password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden.",
        )

    is_valid, pw_error = validate_password(body.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_error,
        )

    client = AirtableClient()

    try:
        all_users = client.list_records(
            "USUARIOS",
            filter_formula="NOT({RESET_PASSWORD_TOKEN_HASH}='')",
            max_records=50,
        )
    except Exception as e:
        logger.error("Failed to list users with reset tokens: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la solicitud.",
        )

    found_user = None
    for record in all_users:
        stored_hash = record.get("fields", {}).get("RESET_PASSWORD_TOKEN_HASH", "")
        if stored_hash and verify_reset_token(body.token, stored_hash):
            found_user = record
            break

    if not found_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o vencido.",
        )

    user_id = found_user["id"]
    fields = found_user.get("fields", {})

    expires_str = fields.get("RESET_PASSWORD_EXPIRA")
    usado_str = fields.get("RESET_PASSWORD_USADO_EN")

    if usado_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o vencido.",
        )

    if expires_str:
        try:
            expires_dt = _datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
            if _datetime.now(_timezone.utc) > expires_dt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token inválido o vencido.",
                )
        except ValueError:
            pass

    new_hash = hash_password(body.password)
    now_utc = _datetime.now(_timezone.utc)

    try:
        client.patch_record(
            "USUARIOS",
            user_id,
            {
                "CONTRASENA_HASH": new_hash,
                "INTENTOS_FALLIDOS": 0,
                "BLOQUEADO_HASTA": None,
                "RESET_PASSWORD_USADO_EN": now_utc.isoformat(),
                "RESET_PASSWORD_TOKEN_HASH": None,
            },
        )
        logger.info("Password reset successful for user %s", user_id)
    except Exception as e:
        logger.error("Failed to update password for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la contraseña.",
        )

    return ResetPasswordResponse(
        message="Contraseña actualizada exitosamente. Ya puedes iniciar sesión."
    )



# ══ FASE_2D: Admin User Management + Change Password ════════════
from typing import Optional

# ── Models ────────────────────────────────────
class AdminCreateUserRequest(BaseModel):
    nombre: str
    email: str
    rol_nombre: str = "CLIENTE"
    cliente_id: Optional[str] = ""
    empleado_id: Optional[str] = ""

class AdminUserResponse(BaseModel):
    id: str
    nombre: str = ""
    email: str = ""
    rol: str = ""
    estado_acceso: str = ""
    ultimo_login: str = ""
    intentos_fallidos: int = 0
    email_verificado: bool = False
    debe_cambiar_password: bool = False
    cliente: str = ""
    empleado: str = ""

class AdminResetPasswordResponse(BaseModel):
    message: str
    temp_password: str = ""

class AdminActionResponse(BaseModel):
    message: str

class ChangePasswordRequest(BaseModel):
    current_password: str = ""
    new_password: str
    confirm_password: str

class ChangePasswordResponse(BaseModel):
    message: str

# ── Helpers ───────────────────────────────────
def _admin_format_user(record: dict) -> dict:
    fields = record.get("fields", {})
    cliente_raw = fields.get("CLIENTE", "")
    empleado_raw = fields.get("EMPLEADO", "")
    return {
        "id": record["id"],
        "nombre": fields.get("NOMBRE_USUARIO", ""),
        "email": fields.get("EMAIL_LOGIN", ""),
        "rol": _resolve_rol(fields.get("ROL", "")),
        "estado_acceso": fields.get("ESTADO_USUARIO", ""),
        "ultimo_login": str(fields.get("ULTIMO_LOGIN", "")) if fields.get("ULTIMO_LOGIN") else "",
        "intentos_fallidos": fields.get("INTENTOS_FALLIDOS", 0) or 0,
        "email_verificado": bool(fields.get("EMAIL_VERIFICADO", False)),
        "debe_cambiar_password": bool(fields.get("REQUIERE_CAMBIO_CLAVE", False)),
        "cliente": (cliente_raw[0] if isinstance(cliente_raw, list) and cliente_raw
                      else str(cliente_raw) if cliente_raw else ""),
        "empleado": (empleado_raw[0] if isinstance(empleado_raw, list) and empleado_raw
                       else str(empleado_raw) if empleado_raw else ""),
    }

def _resolve_rol_id(client: AirtableClient, rol_nombre: str) -> str:
    try:
        records = client.list_records(
            "ROLES", filter_formula="{NOMBRE_ROL}='%s'" % rol_nombre, max_records=1
        )
        if records:
            return records[0]["id"]
    except Exception:
        pass
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Rol '{rol_nombre}' no encontrado.",
    )

def _user_record_or_404(client: AirtableClient, user_id: str) -> dict:
    try:
        return client.get_record("USUARIOS", user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

# ── GET /api/auth/admin/users ──────────────────
@router.get("/admin/users", response_model=list[AdminUserResponse])
async def admin_list_users(request: Request, auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    try:
        records = client.list_records("USUARIOS", max_records=200)
    except Exception as e:
        logger.error("Failed to list users: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar usuarios.",
        )
    return [_admin_format_user(r) for r in records]

# ── POST /api/auth/admin/users ──────────────────
@router.post("/admin/users", response_model=AdminUserResponse)
async def admin_create_user(body: AdminCreateUserRequest, request: Request,
                            response: Response, auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    from .security import hash_password, validate_password, generate_temp_password
    await verify_admin(request, auth_token)

    email = body.email.strip().lower()
    nombre = body.nombre.strip()

    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre es obligatorio.",
        )

    client = AirtableClient()

    existing = _find_user_by_email(client, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese email.",
        )

    rol_id = _resolve_rol_id(client, body.rol_nombre)

    temp_password = generate_temp_password()
    password_hash = hash_password(temp_password)

    user_fields = {
        "NOMBRE_USUARIO": nombre,
        "EMAIL_LOGIN": email,
        "CONTRASENA_HASH": password_hash,
        "ROL": [rol_id],
        "REQUIERE_CAMBIO_CLAVE": True,
        "ESTADO_USUARIO": "PENDIENTE",
        "INTENTOS_FALLIDOS": 0,
        "EMAIL_VERIFICADO": True,
    }
    if body.cliente_id:
        user_fields["CLIENTE"] = [body.cliente_id]
    if body.empleado_id:
        user_fields["EMPLEADO"] = [body.empleado_id]

    try:
        new_user = client.create_record("USUARIOS", user_fields)
        logger.info("Admin created USUARIOS %s (%s) role=%s", new_user["id"], email, body.rol_nombre)
    except Exception as e:
        logger.error("Failed to create user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear usuario.",
        )

    result = _admin_format_user(new_user)
    logger.info("Temp password generated for %s (not logged)", email)
    return {**result, "message": f"Usuario creado. Contrasena temporal: {temp_password}"}

# ── POST /api/auth/admin/users/{user_id}/reset-password ──
@router.post("/admin/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
async def admin_reset_password(user_id: str, request: Request,
                               auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    from .security import hash_password, generate_temp_password
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    temp_password = generate_temp_password()
    password_hash = hash_password(temp_password)
    now_utc = datetime.now(timezone.utc)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "CONTRASENA_HASH": password_hash,
                "REQUIERE_CAMBIO_CLAVE": True,
                "ESTADO_USUARIO": "PENDIENTE",
                "PASSWORD_RESET_FORZADO_EN": now_utc.isoformat(),
                "PASSWORD_RESET_FORZADO_POR": "ADMIN",
                "INTENTOS_FALLIDOS": 0,
                "BLOQUEADO_HASTA": None,
            },
        )
        logger.info("Admin reset password for user %s", user_id)
    except Exception as e:
        logger.error("Failed to reset password for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al resetear contrasena.",
        )

    return AdminResetPasswordResponse(
        message="Contrasena temporal generada. Copiala ahora. No se volvera a mostrar.",
        temp_password=temp_password,
    )

# ── POST /api/auth/admin/users/{user_id}/force-password-change ──
@router.post("/admin/users/{user_id}/force-password-change", response_model=AdminActionResponse)
async def admin_force_password_change(user_id: str, request: Request,
                                      auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "REQUIERE_CAMBIO_CLAVE": True,
                "ESTADO_USUARIO": "PENDIENTE",
            },
        )
        logger.info("Admin forced password change for user %s", user_id)
    except Exception as e:
        logger.error("Failed to force change for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al forzar cambio de contrasena.",
        )

    return AdminActionResponse(message="Cambio de contrasena forzado.")

# ── POST /api/auth/admin/users/{user_id}/block ──
@router.post("/admin/users/{user_id}/block", response_model=AdminActionResponse)
async def admin_block_user(user_id: str, request: Request,
                           auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {"ESTADO_USUARIO": "BLOQUEADO", "BLOQUEADO_HASTA": "2099-12-31"},
        )
        logger.info("Admin blocked user %s", user_id)
    except Exception as e:
        logger.error("Failed to block user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al bloquear usuario.",
        )

    return AdminActionResponse(message="Usuario bloqueado.")

# ── POST /api/auth/admin/users/{user_id}/unblock ──
@router.post("/admin/users/{user_id}/unblock", response_model=AdminActionResponse)
async def admin_unblock_user(user_id: str, request: Request,
                             auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "ESTADO_USUARIO": "ACTIVO",
                "BLOQUEADO_HASTA": None,
                "INTENTOS_FALLIDOS": 0,
            },
        )
        logger.info("Admin unblocked user %s", user_id)
    except Exception as e:
        logger.error("Failed to unblock user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al desbloquear usuario.",
        )

    return AdminActionResponse(message="Usuario desbloqueado.")

# ── POST /api/auth/change-password ──────────────
@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(body: ChangePasswordRequest, request: Request,
                          auth_token: str = Cookie(default=None)):
    from .dependencies import get_current_user
    from .security import verify_password, hash_password, validate_password

    user = await get_current_user(request, auth_token)
    user_id = user["id"]

    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contrasenas no coinciden.",
        )

    is_valid, pw_error = validate_password(body.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_error,
        )

    client = AirtableClient()
    record = _user_record_or_404(client, user_id)
    fields = record.get("fields", {})

    requiere_cambio = bool(fields.get("REQUIERE_CAMBIO_CLAVE", False))

    if not requiere_cambio:
        current_hash = fields.get("CONTRASENA_HASH", "")
        if not current_hash or not verify_password(body.current_password, current_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contrasena actual incorrecta.",
            )

    new_hash = hash_password(body.new_password)
    now_utc = datetime.now(timezone.utc)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "CONTRASENA_HASH": new_hash,
                "REQUIERE_CAMBIO_CLAVE": False,
                "PASSWORD_CAMBIADA_EN": now_utc.isoformat(),
                "ESTADO_USUARIO": "ACTIVO",
                "INTENTOS_FALLIDOS": 0,
                "BLOQUEADO_HASTA": None,
            },
        )
        logger.info("User %s changed password successfully", user_id)
    except Exception as e:
        logger.error("Failed to change password for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar contrasena.",
        )

    return ChangePasswordResponse(message="Contrasena cambiada exitosamente.")

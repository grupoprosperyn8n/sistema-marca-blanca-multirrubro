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
    return UserResponse(
        id=record["id"],
        email=fields.get("EMAIL_LOGIN", ""),
        nombre=fields.get("NOMBRE_USUARIO", ""),
        rol=_resolve_rol(fields.get("ROL", "")),
        cliente=fields.get("CLIENTE", ""),
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
async def login(body: LoginRequest, response: Response):
    """Verify credentials and set auth_token cookie."""
    from .security import verify_password, create_token, check_jwt_configured

    if not check_jwt_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth no configurado. JWT_SECRET requerido en entorno.",
        )

    email = body.email.strip().lower()
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
            bloqueado_hasta_date = date.fromisoformat(bloqueado_hasta)
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
    return LoginResponse(message="Login exitoso.", user=user)


# ── GET /api/auth/me ──────────────────────────
@router.get("/me", response_model=UserResponse)
async def me(request: Request, auth_token: str = Cookie(default=None)):
    """Return current user from JWT cookie. Requires valid auth_token."""
    from .dependencies import get_current_user

    user = await get_current_user(request, auth_token)
    return user


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

"""
backend/auth/dependencies.py — FastAPI dependency injection for auth.

Provides get_current_user: reads cookie, verifies JWT, fetches user from
Airtable, returns minimal User dict.
"""

import logging
from datetime import datetime, timezone

from fastapi import Cookie, HTTPException, Request, status

from airtable_adapter import AirtableClient

logger = logging.getLogger(__name__)

# ── Minimal User model (returned by get_current_user) ──
_USER_FIELDS_MINIMAL = [
    "EMAIL_LOGIN",
    "NOMBRE_USUARIO",
    "ROL",
    "CLIENTE",
]


async def get_current_user(request: Request, auth_token: str = Cookie(default=None)):
    """
    FastAPI dependency. Extracts and validates auth_token cookie.
    Returns dict with id, email, nombre, rol, cliente or raises 401.
    """
    from .security import verify_token  # lazy import to avoid circular

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado: cookie auth_token ausente.",
        )

    payload = verify_token(auth_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin subject.",
        )

    # Fetch user from Airtable
    try:
        client = AirtableClient()
        record = client.get_record("USUARIOS", user_id)
    except Exception as e:
        logger.error("Error fetching user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    fields = record.get("fields", {})

    # Resolve ROL linked field (Airtable Link → ROLES returns ['recXXX'])
    from .routes import _resolve_rol
    rol_resolved = _resolve_rol(fields.get("ROL", "")) or payload.get("rol", "")

    return {
        "id": record["id"],
        "email": fields.get("EMAIL_LOGIN", payload.get("email", "")),
        "nombre": fields.get("NOMBRE_USUARIO", payload.get("nombre", "")),
        "rol": rol_resolved,
        "cliente": fields.get("CLIENTE", ""),
    }

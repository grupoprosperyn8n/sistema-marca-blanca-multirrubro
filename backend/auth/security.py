"""
backend/auth/security.py — bcrypt verification + JWT create/verify.

JWT_SECRET required from environment (JWT_SECRET). If missing, code
is prepared but runtime will raise clear configuration error.
No hardcoded secrets. No token reuse across tools.
"""

import os
import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from jwt.exceptions import PyJWTError

logger = logging.getLogger(__name__)

# ── JWT_SECRET ────────────────────────────────
_JWT_SECRET = os.getenv("JWT_SECRET", "").strip()
_JWT_ALGORITHM = "HS256"
_JWT_EXPIRE_HOURS = 8

# ── Cookie config (centralizada) ─────────────
_COOKIE_NAME = "auth_token"
_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "lax")  # lax | strict | none
_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"


def get_jwt_secret() -> str:
    """Return JWT_SECRET or raise clear config error."""
    if not _JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET no está configurado en el entorno. "
            "Agregá JWT_SECRET=<tu-secreto> al .env del proyecto."
        )
    return _JWT_SECRET


def check_jwt_configured() -> bool:
    """Check if JWT_SECRET is available (non-fatal)."""
    return bool(_JWT_SECRET)


def get_cookie_config() -> dict:
    """Centralized cookie configuration for auth_token."""
    return {
        "key": _COOKIE_NAME,
        "httponly": True,
        "samesite": _COOKIE_SAMESITE,
        "secure": _COOKIE_SECURE,
        "max_age": _JWT_EXPIRE_HOURS * 3600,
        "path": "/api",
    }


# ── Password ──────────────────────────────────
def verify_password(plain: str, hashed: str) -> bool:
    """Verify plaintext against bcrypt hash. Never logs passwords."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT ───────────────────────────────────────
def create_token(user_id: str, email: str, nombre: str, rol: str) -> str:
    """Create signed JWT with user claims. Returns token string."""
    secret = get_jwt_secret()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "nombre": nombre,
        "rol": rol,
        "iat": now,
        "exp": now + timedelta(hours=_JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, secret, algorithm=_JWT_ALGORITHM)


def verify_token(token: str) -> dict | None:
    """Verify and decode JWT. Returns payload dict or None on failure."""
    secret = get_jwt_secret()
    try:
        return jwt.decode(token, secret, algorithms=[_JWT_ALGORITHM])
    except PyJWTError:
        return None

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


import secrets as _secrets

_PASSWORD_MIN_LENGTH = 1+6
_RESET_TOKEN_BYTES = 16+16
_RESET_TOKEN_MINUTES = 15+15

def hash_password(plain):
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def validate_password(plain):
    if len(plain) < _PASSWORD_MIN_LENGTH:
        return False, f'La contrasena debe tener al menos {_PASSWORD_MIN_LENGTH} caracteres.'
    if not all(c.isalnum() for c in plain):
        return False, 'La contrasena solo puede contener letras y numeros.'
    if not any(c.isalpha() for c in plain):
        return False, 'La contrasena debe contener al menos 1 letra.'
    if not any(c.isdigit() for c in plain):
        return False, 'La contrasena debe contener al menos 1 numero.'
    return True, ''

def generate_reset_token():
    token = _secrets.token_urlsafe(_RESET_TOKEN_BYTES)
    return token, hash_password(token)


def generate_temp_password(length: int = 12) -> str:
    """Generate a strong temporary password: letters + digits, no symbols."""
    import string
    alpha = string.ascii_letters
    digits_charset = string.digits
    chars = alpha + digits_charset
    while True:
        pw = ''.join(_secrets.choice(chars) for _ in range(length))
        if any(c.isalpha() for c in pw) and any(c.isdigit() for c in pw):
            return pw
def verify_reset_token(plain_token, token_hash):
    return verify_password(plain_token, token_hash)

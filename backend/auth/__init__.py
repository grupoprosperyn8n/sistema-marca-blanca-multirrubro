"""
backend/auth — Módulo de autenticación.

Fase: FASE_2A_C_AUTH_BACKEND_CORE_CONTROLADO
Tokens NUNCA viajan al frontend. JWT solo en cookie HttpOnly.
No mostrar secrets, passwords ni hashes completos.
"""

from auth.routes import router as auth_router

__all__ = ["auth_router"]

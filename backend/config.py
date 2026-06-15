"""
Configuración central del backend.
Carga variables de entorno sin mostrar secretos.
Fase: FASE_1B_MICROCORRECCION_CONFIG_Y_SEED_DRYRUN
"""
import os
from pathlib import Path

# Cargar .env manualmente (sin python-dotenv como dependencia)
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if _ENV_PATH.exists():
    for line in open(_ENV_PATH):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            v = v.strip().strip("'").strip('"')
            k = k.strip()
            # Saltar placeholders no expandidos
            if v.startswith("***[") and v.endswith("]]"):
                continue
            if k not in os.environ:
                os.environ[k] = v


def _get_env(var: str, fallback: str = "") -> str:
    return os.getenv(var, fallback)


# ── AIRTABLE ──
# Solo variables estándar. Sin fallbacks, sin hardcodes, sin inyección en os.environ.
AIRTABLE_BASE_ID = _get_env("AIRTABLE_BASE_ID") or ""
AIRTABLE_API_TOKEN = _get_env("AIRTABLE_API_TOKEN") or ""
AIRTABLE_API_URL = _get_env("AIRTABLE_API_URL") or "https://api.airtable.com"

# ── Diagnóstico (sin mostrar valores) ──
TOKENS_DISPONIBLES = {
    k: len(v) for k, v in os.environ.items()
    if any(t in k.upper() for t in ["TOKEN", "KEY", "CREDENCIALES"])
    and v
}


def check_precondiciones() -> dict:
    """Verifica variables requeridas."""
    faltantes = []
    if not AIRTABLE_BASE_ID:
        faltantes.append("AIRTABLE_BASE_ID")
    if not AIRTABLE_API_TOKEN:
        faltantes.append("AIRTABLE_API_TOKEN")
    return {
        "ok": len(faltantes) == 0,
        "faltantes": faltantes,
        "base_id_presente": bool(AIRTABLE_BASE_ID),
        "api_token_presente": bool(AIRTABLE_API_TOKEN),
        "api_url": AIRTABLE_API_URL,
        "tokens_alternativos": list(TOKENS_DISPONIBLES.keys()),
        "diagnostico": "FALTA_AIRTABLE_API_TOKEN" if not AIRTABLE_API_TOKEN else "OK",
    }

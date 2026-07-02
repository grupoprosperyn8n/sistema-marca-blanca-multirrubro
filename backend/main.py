"""
FastAPI — PRODUCTOS_WEB read-only.
Fase: FASE_2A_C_AUTH_BACKEND_CORE_CONTROLADO
Uso:  backend/.venv/bin/python -m uvicorn main:app --reload
"""
import sys, os
from pathlib import Path

# Asegurar que backend/ está primero en sys.path (para imports locales)
_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

# ── Cargar .env antes de cualquier import ──
# Orden: raíz primero (fuente de verdad), backend/.env después (overrides locales)
_ENV_DATA = {}
for _ENV_PATH in [_BACKEND.parent / ".env", _BACKEND / ".env"]:
    if _ENV_PATH.exists():
        for line in open(_ENV_PATH):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                v = v.strip().strip("'").strip('"')
                k = k.strip()
                # Saltar placeholders no expandidos (ej: ***[env_vars[...]])
                if v.startswith("***[") and v.endswith("]]"):
                    continue
                _ENV_DATA[k] = v
                os.environ[k] = v  # siempre sobreescribir, orden del loop define prioridad

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.commerce_public import router as commerce_public_router
from routes.carrito import router as carrito_router
from routes.media_publica import router as media_publica_router
from routes.personal_web import router as personal_web_router
from routes.reserva_opciones import router as reserva_opciones_router
from routes.productos_web import router as productos_web_router
from routes.configuracion_publica import router as configuracion_publica_router
from routes.landing_secciones import router as landing_secciones_router
from routes.modulos import router as modulos_router
from routes.categorias_menu import router as categorias_menu_router
from routes.sucursales import router as sucursales_router
from routes.clientes import router as clientes_router
from routes.servicios import router as servicios_router
from routes.servicios_web import router as servicios_web_router
from routes.agenda_slots import router as agenda_slots_router
from routes.citas import router as citas_router
from auth.routes import router as auth_router

app = FastAPI(
    title="SISTEMA MARCA BLANCA MULTIRRUBRO — API",
    version="0.1.0",
    description="Backend read-only — Fase 1A: base multirrubro",
)

# CORS para desarrollo local
# CORS: frontend Surge + desarrollo local
# Configurar via CORS_ORIGINS (coma-separado) o usa defaults
_cors_origins = os.getenv("CORS_ORIGINS", "https://bellezapro-demo.surge.sh,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Root healthcheck (Railway) ──────────────────
@app.get("/")
async def root():
    return {"status": "ok", "fase": "FASE_2A_D", "rutas_auth": True}

# P0 core
app.include_router(configuracion_publica_router)
app.include_router(landing_secciones_router)
app.include_router(modulos_router)
app.include_router(categorias_menu_router)
app.include_router(sucursales_router)
app.include_router(clientes_router)
app.include_router(servicios_router)
app.include_router(servicios_web_router)
app.include_router(agenda_slots_router)
app.include_router(citas_router)
# Técnico (no P0)
app.include_router(productos_web_router)
app.include_router(commerce_public_router)
app.include_router(carrito_router)
app.include_router(media_publica_router)
app.include_router(personal_web_router)
app.include_router(reserva_opciones_router)
# Auth (FASE_2A_C)
app.include_router(auth_router)


@app.on_event("startup")
async def startup_prewarm():
    """Pre-calentar Airtable — verificacion ligera sin fetch_schema (49 tablas → timeout)."""
    import logging
    logger = logging.getLogger("uvicorn")
    try:
        from airtable_adapter import AirtableClient
        client = AirtableClient()
        # Solo verificar conectividad, sin cargar schema completo
        tables = client.list_tables()
        logger.info(f"Airtable conectado: {len(tables)} tablas detectadas (schema NO precargado).")
    except Exception as e:
        logger.warning(f"Pre-calentamiento Airtable fallo (no bloqueante): {e}")

@app.get("/health")
async def health():
    """Health check con diagnóstico de variables — sin llamada API."""
    from config import check_precondiciones
    pk = check_precondiciones()
    
    return {
        "status": "ok",
        "fase": "FASE_1B_MICROCORRECCION_CONFIG_Y_SEED_DRYRUN",
        "precondiciones": pk,
        "tablas_info": "usa /api/tablas para ver lista completa",
        "endpoints_p0": [
            "/api/configuracion-publica",
            "/api/landing-secciones",
            "/api/modulos",
            "/api/marca-blanca",
            "/api/categorias-menu",
            "/api/sucursales",
            "/api/servicios",
            "/api/servicios-web",
            "/api/media-publica",
            "/api/personal-web",
            "/api/reserva/profesionales",
            "/api/reserva/agenda-opciones",
            "/api/commerce/public",
            "/api/carrito",
            "/api/clientes",
            "/api/clientes/citas/dry-run-multiple",
            "/api/clientes/citas/confirmar-multiple",
            "/api/agenda-slots",
            "/api/citas",
            "/api/profesional/me",
            "/api/profesional/citas",
        ],
        "nota": "Fase 1B — solo lectura. Sin escrituras a Airtable.",
    }


@app.get("/api/tablas")
async def tablas():
    """Listar tablas del base (posiblemente lento)."""
    from config import check_precondiciones
    pk = check_precondiciones()
    if not pk["base_id_presente"] or not pk["api_token_presente"]:
        return {"error": "Faltan credenciales", "precondiciones": pk}
    from airtable_adapter import AirtableClient
    client = AirtableClient()
    tablas = client.list_tables()
    return {
        "total": len(tablas),
        "tablas": sorted([t.name for t in tablas]),
    }

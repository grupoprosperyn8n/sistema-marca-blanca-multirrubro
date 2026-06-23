"""
Rutas FastAPI para CLIENTES — /api/clientes
Fase 3B: perfil cliente autenticado + citas propias.
"""
import sys
from pathlib import Path
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["clientes"])

# ── Campos seguros que un cliente puede editar en su perfil ──
_CAMPOS_EDITABLES_CLIENTE = {
    "NOMBRE_CLIENTE", "TELEFONO", "DOCUMENTO_IDENTIDAD",
    "CALLE_Y_N°", "LOCALIDAD", "PROVINCIA/PAIS", "CODIGO_POSTAL",
    "PREFERENCIAS_SERVICIOS", "ACEPTA_COMUNICACIONES", "FECHA_NACIMIENTO",
}


@router.get("/clientes")
async def listar_clientes():
    """Lista todos los clientes (uso administrativo)."""
    try:
        client = AirtableClient()
        records = client.list_records("CLIENTES", by_name=True)
        items = []
        for r in records:
            fields = r.get("fields", {})
            items.append({"id": r.get("id"), "createdTime": r.get("createdTime"), **fields})
        return {"total": len(items), "clientes": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ── GET /api/clientes/me ────────────────────────────────────────────
@router.get("/clientes/me")
async def get_my_cliente(user: dict = Depends(get_current_user)):
    """Devuelve el registro CLIENTES vinculado al usuario autenticado.

    El backend usa USUARIOS.CLIENTE para buscar en CLIENTES.
    No confía en parámetros del frontend.
    """
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    try:
        at = AirtableClient()
        record = at.get_record("CLIENTES", cliente_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener perfil: {str(e)}")

    fields = record.get("fields", {})
    return {"id": record["id"], "email": fields.get("EMAIL", user.get("email", "")), **fields}


# ── PATCH /api/clientes/me ──────────────────────────────────────────
@router.patch("/clientes/me")
async def update_my_cliente(payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza solo campos seguros del perfil CLIENTES.

    No permite editar email, rol, estado comercial, links ni campos admin.
    Guarda en CLIENTES (no en USUARIOS directamente).
    """
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    # Filtrar solo campos editables
    update_fields = {}
    for k, v in payload.items():
        if k in _CAMPOS_EDITABLES_CLIENTE:
            update_fields[k] = v

    if not update_fields:
        raise HTTPException(status_code=400, detail="No se enviaron campos editables validos.")

    try:
        at = AirtableClient()
        at.patch_record("CLIENTES", cliente_id, update_fields)
        # Leer registro actualizado
        updated = at.get_record("CLIENTES", cliente_id)
        fields = updated.get("fields", {})
        return {
            "id": updated["id"],
            "email": fields.get("EMAIL", user.get("email", "")),
            "actualizados": list(update_fields.keys()),
            **fields,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar perfil: {str(e)}")


# ── GET /api/clientes/me/citas ──────────────────────────────────────
@router.get("/clientes/me/citas")
async def get_my_citas(user: dict = Depends(get_current_user)):
    """Devuelve las CITAS vinculadas al CLIENTE autenticado.

    Filtra por backend usando USUARIOS.CLIENTE, no por parametro del frontend.
    Separa en proximas e historial.
    """
    cliente_id = (user.get("cliente") or "").strip()
    if not cliente_id:
        raise HTTPException(status_code=404, detail="No tenes un perfil de cliente vinculado.")

    try:
        at = AirtableClient()
        # Buscar citas donde el campo CLIENTE contiene este cliente_id
        formula = "SEARCH('" + cliente_id + "', ARRAYJOIN({CLIENTE}))"
        records = at.list_records("CITAS", filter_formula=formula, by_name=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener citas: {str(e)}")

    citas = []
    _campos_internos = {
        "OBSERVACIONES_INTERNAS", "DIAGNOSTICO_PREVIO",
        "REQUIERE_DIAGNOSTICO", "REQUIERE_CONSENTIMIENTO",
        "CONSENTIMIENTO_FIRMADO", "REQUIERE_PRUEBA_ALERGIA",
        "PRUEBA_ALERGIA_REALIZADA", "MOTIVO_CANCELACION",
        "FECHA_CANCELACION", "CANCELADO_POR",
    }
    for r in records:
        fields = r.get("fields", {})
        safe_fields = {k: v for k, v in fields.items() if k not in _campos_internos}
        citas.append({"id": r["id"], "createdTime": r.get("createdTime"), **safe_fields})

    # Separar
    hoy = date.today().isoformat()
    proximas = []
    historial = []
    for c in citas:
        estado = c.get("ESTADO_CITA", "")
        fecha = c.get("FECHA_CITA", "")
        if estado in ("COMPLETADA", "CANCELADA", "NO_ASISTIO"):
            historial.append(c)
        elif fecha and fecha >= hoy:
            proximas.append(c)
        else:
            historial.append(c)

    return {
        "total": len(citas),
        "proximas": sorted(proximas, key=lambda c: c.get("FECHA_CITA", "")),
        "historial": sorted(historial, key=lambda c: c.get("FECHA_CITA", ""), reverse=True),
    }

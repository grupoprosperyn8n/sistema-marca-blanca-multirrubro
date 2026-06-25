"""
Rutas FastAPI para SERVICIOS — /api/servicios
Fase 1B: lectura.
BACKOFFICE_CRUD_P0_CLIENTES_SERVICIOS: CRUD controlado para backoffice.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_edit_field, can_module
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["servicios"])

_BACKOFFICE_SERVICIOS_FIELDS = {
    "NOMBRE_SERVICIO",
    "CODIGO_SERVICIO",
    "CATEGORIA_SERVICIO",
    "SUBCATEGORIA",
    "DESCRIPCION_COMERCIAL",
    "DESCRIPCION_TECNICA",
    "DURACION_MINUTOS",
    "TIEMPO_PREPARACION_MINUTOS",
    "TIEMPO_LIMPIEZA_MINUTOS",
    "PRECIO_BASE",
    "PRECIO_MINIMO",
    "PRECIO_MAXIMO",
    "COSTO_INSUMOS_ESTIMADO",
    "REQUIERE_DIAGNOSTICO",
    "REQUIERE_PRUEBA_ALERGIA",
    "REQUIERE_CONSENTIMIENTO",
    "NIVEL_COMPLEJIDAD",
    "CAPACITACION_REQUERIDA",
    "COMISION_PROFESIONAL_PORCENTAJE",
    "ESTADO_SERVICIO",
    "FICHA_TECNICA_SERVICIO",
    "OBSERVACIONES",
    "ACTIVO",
}


def _require_servicios_action(user: dict, action: str):
    rol = user.get("rol") or ""
    if can_module(rol, "SERVICIOS", action):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Sin permiso para {action} SERVICIOS.",
    )


def _collect_servicios_patch(payload: dict, role_name: str, partial: bool = True) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    unknown = sorted(set(payload) - _BACKOFFICE_SERVICIOS_FIELDS)
    if unknown:
        raise HTTPException(
            status_code=400,
            detail={"message": "Campos no permitidos para SERVICIOS.", "fields": unknown},
        )

    patch = {}
    forbidden = []
    for field_name, value in payload.items():
        if not can_edit_field(role_name, "SERVICIOS", field_name):
            forbidden.append(field_name)
            continue
        if isinstance(value, str):
            value = value.strip()
        if value == "":
            value = None
        patch[field_name] = value

    if forbidden:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Campos no editables para tu rol.", "fields": forbidden},
        )
    if not patch:
        raise HTTPException(status_code=400, detail="No se enviaron campos editables.")
    if not partial and not str(patch.get("NOMBRE_SERVICIO") or "").strip():
        raise HTTPException(status_code=400, detail="NOMBRE_SERVICIO es obligatorio.")
    return patch


def _format_servicio_record(record: dict, extra: dict | None = None) -> dict:
    """Normaliza la respuesta backoffice; Airtable omite checkboxes false."""
    fields = dict(record.get("fields", {}))
    fields.setdefault("ACTIVO", False)
    data = {"id": record.get("id"), "createdTime": record.get("createdTime")}
    if extra:
        data.update(extra)
    data.update(fields)
    return data


@router.get("/servicios")
async def listar_servicios():
    """Lista todos los servicios."""
    try:
        client = AirtableClient()
        records = client.list_records("SERVICIOS", by_name=True)
        items = []
        for r in records:
            items.append(_format_servicio_record(r))
        return {"total": len(items), "servicios": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/backoffice/servicios")
async def crear_servicio_backoffice(payload: dict, user: dict = Depends(get_current_user)):
    """Crea un SERVICIO desde backoffice con RBAC y campos seguros."""
    _require_servicios_action(user, "create")
    fields = _collect_servicios_patch(payload, user.get("rol") or "", partial=False)
    fields.setdefault("ACTIVO", True)
    fields.setdefault("ESTADO_SERVICIO", "ACTIVO")
    try:
        at = AirtableClient()
        record = at.create_record("SERVICIOS", fields)
        return _format_servicio_record(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear servicio: {str(e)}")


@router.patch("/backoffice/servicios/{servicio_id}")
async def actualizar_servicio_backoffice(servicio_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza campos permitidos de SERVICIOS desde backoffice."""
    _require_servicios_action(user, "edit")
    fields = _collect_servicios_patch(payload, user.get("rol") or "", partial=True)
    try:
        at = AirtableClient()
        at.get_record("SERVICIOS", servicio_id)
        at.patch_record("SERVICIOS", servicio_id, fields)
        updated = at.get_record("SERVICIOS", servicio_id)
        return _format_servicio_record(updated, {"actualizados": list(fields.keys())})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar servicio: {str(e)}")


@router.delete("/backoffice/servicios/{servicio_id}")
async def baja_logica_servicio_backoffice(servicio_id: str, user: dict = Depends(get_current_user)):
    """Baja lógica: nunca borra físico; marca ACTIVO=false e INACTIVO."""
    _require_servicios_action(user, "delete")
    try:
        at = AirtableClient()
        at.get_record("SERVICIOS", servicio_id)
        patch = {"ACTIVO": False, "ESTADO_SERVICIO": "INACTIVO"}
        at.patch_record("SERVICIOS", servicio_id, patch)
        updated = at.get_record("SERVICIOS", servicio_id)
        fields = dict(updated.get("fields", {}))
        fields["ACTIVO"] = False
        fields["ESTADO_SERVICIO"] = "INACTIVO"
        updated = {**updated, "fields": fields}
        return _format_servicio_record(
            updated,
            {"deleted": False, "baja_logica": True, "actualizados": list(patch.keys())},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al dar de baja servicio: {str(e)}")

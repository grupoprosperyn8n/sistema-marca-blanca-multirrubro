"""
Rutas FastAPI para SUCURSALES — /api/sucursales
Fase 1A: lectura.
BACKOFFICE_CRUD_P1_SUCURSALES: CRUD controlado para backoffice.
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

router = APIRouter(prefix="/api", tags=["sucursales"])

_BACKOFFICE_SUCURSALES_FIELDS = {
    "NOMBRE_SUCURSAL",
    "CODIGO_SUCURSAL",
    "DESCRIPCION_SUCURSAL",
    "CALLE Y N°",
    "LOCALIDAD",
    "PROVINCIA",
    "PAIS",
    "CODIGO_POSTAL",
    "TELEFONO_CONTACTO",
    "EMAIL_CONTACTO",
    "WHATSAPP_SUCURSAL",
    "MAPA_UBICACION_URL",
    "HORARIO_REFERENCIA",
    "PUBLICAR_WEB",
    "VISIBILIDAD_WEB",
    "SLUG_SUCURSAL",
    "TIPO_SUCURSAL",
    "SUCURSAL_PRINCIPAL",
    "PERMITE_ATENCION_PRESENCIAL",
    "PERMITE_RESERVAS_WEB",
    "PERMITE_VENTAS_WEB",
    "PERMITE_RETIRO_PRODUCTOS",
    "ORDEN",
    "ACTIVO",
    "ESTADO_SUCURSAL",
}


def _require_sucursales_action(user: dict, action: str):
    rol = user.get("rol") or ""
    if can_module(rol, "SUCURSALES", action):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Sin permiso para {action} SUCURSALES.",
    )


def _collect_sucursales_patch(payload: dict, role_name: str, partial: bool = True) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    unknown = sorted(set(payload) - _BACKOFFICE_SUCURSALES_FIELDS)
    if unknown:
        raise HTTPException(
            status_code=400,
            detail={"message": "Campos no permitidos para SUCURSALES.", "fields": unknown},
        )

    patch = {}
    forbidden = []
    for field_name, value in payload.items():
        if not can_edit_field(role_name, "SUCURSALES", field_name):
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
    if not partial and not str(patch.get("NOMBRE_SUCURSAL") or "").strip():
        raise HTTPException(status_code=400, detail="NOMBRE_SUCURSAL es obligatorio.")
    return patch


def _format_sucursal_record(record: dict, extra: dict | None = None) -> dict:
    """Normaliza la respuesta backoffice; Airtable omite checkboxes false."""
    fields = dict(record.get("fields", {}))
    fields.setdefault("ACTIVO", False)
    fields.setdefault("PUBLICAR_WEB", False)
    data = {"id": record.get("id"), "createdTime": record.get("createdTime")}
    if extra:
        data.update(extra)
    data.update(fields)
    return data


@router.get("/sucursales")
async def listar_sucursales():
    """Lista todas las sucursales."""
    try:
        client = AirtableClient()
        records = client.list_records("SUCURSALES", by_name=True)
        items = []
        for r in records:
            items.append(_format_sucursal_record(r))
        return {"total": len(items), "sucursales": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/backoffice/sucursales")
async def crear_sucursal_backoffice(payload: dict, user: dict = Depends(get_current_user)):
    """Crea una SUCURSAL desde backoffice con RBAC y campos seguros."""
    _require_sucursales_action(user, "create")
    fields = _collect_sucursales_patch(payload, user.get("rol") or "", partial=False)
    fields.setdefault("ACTIVO", True)
    fields.setdefault("ESTADO_SUCURSAL", "ACTIVA")
    fields.setdefault("PUBLICAR_WEB", False)
    fields.setdefault("VISIBILIDAD_WEB", "INTERNA")
    try:
        at = AirtableClient()
        record = at.create_record("SUCURSALES", fields)
        return _format_sucursal_record(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear sucursal: {str(e)}")


@router.patch("/backoffice/sucursales/{sucursal_id}")
async def actualizar_sucursal_backoffice(sucursal_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """Actualiza campos permitidos de SUCURSALES desde backoffice."""
    _require_sucursales_action(user, "edit")
    fields = _collect_sucursales_patch(payload, user.get("rol") or "", partial=True)
    try:
        at = AirtableClient()
        at.get_record("SUCURSALES", sucursal_id)
        at.patch_record("SUCURSALES", sucursal_id, fields)
        updated = at.get_record("SUCURSALES", sucursal_id)
        return _format_sucursal_record(updated, {"actualizados": list(fields.keys())})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar sucursal: {str(e)}")


@router.delete("/backoffice/sucursales/{sucursal_id}")
async def baja_logica_sucursal_backoffice(sucursal_id: str, user: dict = Depends(get_current_user)):
    """Baja lógica: nunca borra físico; marca ACTIVO=false e INACTIVA."""
    _require_sucursales_action(user, "delete")
    try:
        at = AirtableClient()
        at.get_record("SUCURSALES", sucursal_id)
        patch = {
            "ACTIVO": False,
            "ESTADO_SUCURSAL": "INACTIVA",
            "PUBLICAR_WEB": False,
            "VISIBILIDAD_WEB": "OCULTA",
        }
        at.patch_record("SUCURSALES", sucursal_id, patch)
        updated = at.get_record("SUCURSALES", sucursal_id)
        fields = dict(updated.get("fields", {}))
        fields.update(patch)
        updated = {**updated, "fields": fields}
        return _format_sucursal_record(
            updated,
            {"deleted": False, "baja_logica": True, "actualizados": list(patch.keys())},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al dar de baja sucursal: {str(e)}")

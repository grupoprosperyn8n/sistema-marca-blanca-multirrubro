"""
Rutas FastAPI para CITAS — /api/citas
BACKOFFICE_OPERATIVO_P2_CITAS_AGENDA: CRUD controlado + consistencia con slots.
"""
import sys
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from airtable_adapter import AirtableClient
from auth.access_contract import can_edit_field, can_module
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["citas"])

_ACTIVE_CITA_STATES = {"CONFIRMADA", "PENDIENTE_CONFIRMACION", "EN_CURSO", "REPROGRAMADA"}
_LINK_FIELDS = {"CLIENTE", "SERVICIO", "PROFESIONAL", "AGENDA_SLOT", "SUCURSAL_ATENCION"}
_BACKOFFICE_CITAS_FIELDS = {
    "NOMBRE_CITA",
    "CLIENTE",
    "SERVICIO",
    "PROFESIONAL",
    "AGENDA_SLOT",
    "SUCURSAL_ATENCION",
    "FECHA_CITA",
    "HORA_INICIO",
    "HORA_FIN",
    "DURACION_MINUTOS",
    "CANAL_ORIGEN",
    "ESTADO_CITA",
    "REQUIERE_CONFIRMACION",
    "CONFIRMADA_CLIENTE",
    "OBSERVACIONES_CLIENTE",
    "OBSERVACIONES_INTERNAS",
    "MOTIVO_CANCELACION",
    "MOTIVO_REPROGRAMACION",
    "ACTIVO",
}


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _first_id(value) -> str:
    ids = [str(item).strip() for item in _as_list(value) if str(item).strip()]
    return ids[0] if ids else ""


def _to_bool(value, default=False):
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value).strip().lower()
    if text in {"true", "1", "si", "sí", "yes"}:
        return True
    if text in {"false", "0", "no"}:
        return False
    return default


def _require_citas_action(user: dict, action: str):
    rol = user.get("rol") or ""
    if can_module(rol, "CITAS", action):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Sin permiso para {action} CITAS.",
    )


def _normalize_field(field_name: str, value):
    if field_name in _LINK_FIELDS:
        record_id = _first_id(value)
        return [record_id] if record_id else []
    if isinstance(value, str):
        value = value.strip()
    if value == "":
        return None
    return value


def _collect_citas_patch(payload: dict, role_name: str, partial: bool = True) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    unknown = sorted(set(payload) - _BACKOFFICE_CITAS_FIELDS)
    if unknown:
        raise HTTPException(
            status_code=400,
            detail={"message": "Campos no permitidos para CITAS.", "fields": unknown},
        )

    patch = {}
    forbidden = []
    for field_name, value in payload.items():
        if not can_edit_field(role_name, "CITAS", field_name):
            forbidden.append(field_name)
            continue
        patch[field_name] = _normalize_field(field_name, value)

    if forbidden:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Campos no editables para tu rol.", "fields": forbidden},
        )
    if not patch:
        raise HTTPException(status_code=400, detail="No se enviaron campos editables.")
    if not partial:
        if not _first_id(patch.get("CLIENTE")):
            raise HTTPException(status_code=400, detail="CLIENTE es obligatorio.")
        if not _first_id(patch.get("SERVICIO")):
            raise HTTPException(status_code=400, detail="SERVICIO es obligatorio.")
        if not _first_id(patch.get("AGENDA_SLOT")):
            raise HTTPException(status_code=400, detail="AGENDA_SLOT es obligatorio.")
    return patch


class _Resolver:
    def __init__(self, client: AirtableClient):
        self.client = client
        self.cache: dict[tuple[str, str], dict] = {}

    def fields(self, table: str, record_id: str) -> dict:
        if not record_id:
            return {}
        key = (table, record_id)
        if key not in self.cache:
            try:
                self.cache[key] = self.client.get_record(table, record_id).get("fields", {})
            except Exception:
                self.cache[key] = {}
        return self.cache[key]

    def name(self, table: str, record_id: str, field_name: str) -> str:
        return str(self.fields(table, record_id).get(field_name) or "")


def _slot_is_available(at: AirtableClient, slot_id: str, exclude_cita_id: str | None = None) -> tuple[bool, dict]:
    if not slot_id:
        return False, {}
    slot = at.get_record("AGENDA_SLOTS", slot_id)
    fields = slot.get("fields", {})
    estado = str(fields.get("ESTADO_SLOT") or "").upper()
    capacidad = int(fields.get("CAPACIDAD_DISPONIBLE") or 0)
    available = (
        estado == "DISPONIBLE"
        and capacidad > 0
        and _to_bool(fields.get("ACTIVO"), True)
        and not _to_bool(fields.get("BLOQUEO_MANUAL"), False)
        and not _has_active_cita_for_slot(at, slot_id, exclude_cita_id)
    )
    return available, fields


def _has_active_cita_for_slot(at: AirtableClient, slot_id: str, exclude_cita_id: str | None = None) -> bool:
    records = at.list_records("CITAS", by_name=True)
    for record in records:
        if exclude_cita_id and record.get("id") == exclude_cita_id:
            continue
        fields = record.get("fields", {})
        if not _to_bool(fields.get("ACTIVO"), True):
            continue
        if str(fields.get("ESTADO_CITA") or "").upper() not in _ACTIVE_CITA_STATES:
            continue
        if slot_id in [str(item) for item in _as_list(fields.get("AGENDA_SLOT"))]:
            return True
    return False


def _reserve_slot(at: AirtableClient, slot_id: str, canal: str = "INTERNO") -> dict:
    available, fields = _slot_is_available(at, slot_id)
    if not available:
        raise HTTPException(status_code=409, detail="El slot no está disponible.")
    total = int(fields.get("CAPACIDAD_TOTAL") or 1)
    patch = {
        "ESTADO_SLOT": "RESERVADO",
        "TIPO_SLOT": "OCUPADO",
        "CAPACIDAD_OCUPADA": max(1, total),
        "CANAL_ORIGEN": canal,
    }
    at.patch_record("AGENDA_SLOTS", slot_id, patch)
    return fields


def _release_slot(at: AirtableClient, slot_id: str, exclude_cita_id: str | None = None):
    if not slot_id:
        return
    if _has_active_cita_for_slot(at, slot_id, exclude_cita_id=exclude_cita_id):
        return
    at.patch_record(
        "AGENDA_SLOTS",
        slot_id,
        {
            "ESTADO_SLOT": "DISPONIBLE",
            "TIPO_SLOT": "DISPONIBLE",
            "CAPACIDAD_OCUPADA": 0,
            "CANAL_ORIGEN": "INTERNO",
        },
    )


def _apply_slot_fields(fields: dict, slot_fields: dict):
    fields["FECHA_CITA"] = slot_fields.get("FECHA_SLOT")
    fields["HORA_INICIO"] = slot_fields.get("HORA_INICIO")
    fields["HORA_FIN"] = slot_fields.get("HORA_FIN")
    fields["DURACION_MINUTOS"] = slot_fields.get("DURACION_MINUTOS")
    if not _first_id(fields.get("PROFESIONAL")):
        profesional_id = _first_id(slot_fields.get("PROFESIONAL"))
        if profesional_id:
            fields["PROFESIONAL"] = [profesional_id]
    if not _first_id(fields.get("SUCURSAL_ATENCION")):
        sucursal_id = _first_id(slot_fields.get("SUCURSAL"))
        if sucursal_id:
            fields["SUCURSAL_ATENCION"] = [sucursal_id]


def _format_cita_record(record: dict, resolver: _Resolver | None = None) -> dict:
    fields = dict(record.get("fields", {}))
    fields.setdefault("ACTIVO", False)
    resolver = resolver or _Resolver(AirtableClient())

    cliente_id = _first_id(fields.get("CLIENTE"))
    servicio_id = _first_id(fields.get("SERVICIO"))
    profesional_id = _first_id(fields.get("PROFESIONAL"))
    sucursal_id = _first_id(fields.get("SUCURSAL_ATENCION"))
    slot_id = _first_id(fields.get("AGENDA_SLOT"))
    slot_fields = resolver.fields("AGENDA_SLOTS", slot_id) if slot_id else {}

    return {
        "id": record.get("id"),
        "createdTime": record.get("createdTime"),
        **fields,
        "CLIENTE_ID": cliente_id,
        "SERVICIO_ID": servicio_id,
        "PROFESIONAL_ID": profesional_id,
        "SUCURSAL_ID": sucursal_id,
        "AGENDA_SLOT_ID": slot_id,
        "NOMBRE_CLIENTE": resolver.name("CLIENTES", cliente_id, "NOMBRE_CLIENTE"),
        "NOMBRE_SERVICIO": resolver.name("SERVICIOS", servicio_id, "NOMBRE_SERVICIO"),
        "NOMBRE_PROFESIONAL": resolver.name("EMPLEADOS", profesional_id, "NOMBRE_EMPLEADO"),
        "NOMBRE_SUCURSAL": resolver.name("SUCURSALES", sucursal_id, "NOMBRE_SUCURSAL"),
        "ESTADO_SLOT": slot_fields.get("ESTADO_SLOT") or "",
    }


@router.get("/citas")
async def listar_citas():
    """Lista todas las citas con DTO enriquecido para backoffice."""
    try:
        client = AirtableClient()
        records = client.list_records("CITAS", by_name=True)
        resolver = _Resolver(client)
        items = [_format_cita_record(record, resolver) for record in records]
        return {"total": len(items), "citas": items}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/backoffice/citas")
async def crear_cita_backoffice(payload: dict, user: dict = Depends(get_current_user)):
    _require_citas_action(user, "create")
    fields = _collect_citas_patch(payload, user.get("rol") or "", partial=False)
    fields.setdefault("ACTIVO", True)
    fields.setdefault("ESTADO_CITA", "CONFIRMADA")
    fields.setdefault("CANAL_ORIGEN", "INTERNO")
    slot_id = _first_id(fields.get("AGENDA_SLOT"))

    at = AirtableClient()
    slot_fields = _reserve_slot(at, slot_id, fields.get("CANAL_ORIGEN") or "INTERNO")
    _apply_slot_fields(fields, slot_fields)
    fields.setdefault("NOMBRE_CITA", f"CITA {fields.get('FECHA_CITA')} {fields.get('HORA_INICIO')}")

    try:
        record = at.create_record("CITAS", fields)
        return _format_cita_record(record, _Resolver(at))
    except Exception as e:
        _release_slot(at, slot_id)
        raise HTTPException(status_code=500, detail=f"Error al crear cita: {str(e)}")


@router.patch("/backoffice/citas/{cita_id}")
async def actualizar_cita_backoffice(cita_id: str, payload: dict, user: dict = Depends(get_current_user)):
    _require_citas_action(user, "edit")
    fields = _collect_citas_patch(payload, user.get("rol") or "", partial=True)
    at = AirtableClient()
    current = at.get_record("CITAS", cita_id)
    current_fields = current.get("fields", {})
    old_slot_id = _first_id(current_fields.get("AGENDA_SLOT"))
    new_slot_id = _first_id(fields.get("AGENDA_SLOT")) if "AGENDA_SLOT" in fields else old_slot_id

    reserved_new = False
    if new_slot_id and new_slot_id != old_slot_id:
        slot_fields = _reserve_slot(at, new_slot_id, fields.get("CANAL_ORIGEN") or current_fields.get("CANAL_ORIGEN") or "INTERNO")
        reserved_new = True
        _apply_slot_fields(fields, slot_fields)
        fields["ESTADO_CITA"] = "REPROGRAMADA"
        fields["FECHA_REPROGRAMACION"] = date.today().isoformat()

    try:
        at.patch_record("CITAS", cita_id, fields)
        if new_slot_id != old_slot_id:
            _release_slot(at, old_slot_id, exclude_cita_id=cita_id)
        updated = at.get_record("CITAS", cita_id)
        return {**_format_cita_record(updated, _Resolver(at)), "actualizados": list(fields.keys())}
    except Exception as e:
        if reserved_new:
            _release_slot(at, new_slot_id, exclude_cita_id=cita_id)
        raise HTTPException(status_code=500, detail=f"Error al actualizar cita: {str(e)}")


@router.delete("/backoffice/citas/{cita_id}")
async def baja_logica_cita_backoffice(cita_id: str, payload: dict | None = None, user: dict = Depends(get_current_user)):
    _require_citas_action(user, "delete")
    at = AirtableClient()
    current = at.get_record("CITAS", cita_id)
    current_fields = current.get("fields", {})
    slot_id = _first_id(current_fields.get("AGENDA_SLOT"))
    patch = {
        "ESTADO_CITA": "CANCELADA",
        "ACTIVO": False,
        "FECHA_CANCELACION": date.today().isoformat(),
        "CANCELADO_POR": "SALON",
    }
    if isinstance(payload, dict) and payload.get("motivo"):
        patch["MOTIVO_CANCELACION"] = str(payload["motivo"]).strip()
    try:
        at.patch_record("CITAS", cita_id, patch)
        _release_slot(at, slot_id, exclude_cita_id=cita_id)
        updated = at.get_record("CITAS", cita_id)
        fields = dict(updated.get("fields", {}))
        fields.update(patch)
        updated = {**updated, "fields": fields}
        return {
            **_format_cita_record(updated, _Resolver(at)),
            "deleted": False,
            "baja_logica": True,
            "actualizados": list(patch.keys()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cancelar cita: {str(e)}")

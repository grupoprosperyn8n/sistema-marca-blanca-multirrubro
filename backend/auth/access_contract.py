"""Access/Menu contract derived from Airtable RBAC tables.

Source of truth:
- ROLES
- PERMISOS_MODULO
- PERMISOS_CAMPO
- MODULOS
- CATEGORIAS_MENU
"""

from __future__ import annotations

from unicodedata import normalize

from airtable_adapter import AirtableClient


SUPPORTED_BACKOFFICE_ROUTES = {
    "CLIENTES": "/backoffice/clientes",
    "SERVICIOS": "/backoffice/servicios",
    "SERVICIOS_WEB": "/backoffice/servicios",
    "SUCURSALES": "/backoffice/sucursales",
    "CITAS": "/backoffice/citas",
    "MARCA_BLANCA": "/backoffice/configuracion",
    "CONFIGURACION": "/backoffice/configuracion",
    "USUARIOS": "/backoffice/usuarios",
}

MODULE_LABELS = {
    "MARCA_BLANCA": "Configuración",
    "SERVICIOS_WEB": "Servicios",
}

MODULE_ICONS = {
    "CITAS": "📋",
    "CLIENTES": "👥",
    "CONFIGURACION": "⚙️",
    "MARCA_BLANCA": "⚙️",
    "SERVICIOS": "💇",
    "SERVICIOS_WEB": "💇",
    "SUCURSALES": "📍",
    "USUARIOS": "🔐",
}


def _bool(value, default=False):
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


def normalize_key(value) -> str:
    text = str(value or "").strip().upper()
    text = normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return text.replace("-", "_").replace(" ", "_")


def _first_link(value):
    if isinstance(value, list) and value:
        return value[0]
    return None


def _format_label(module_name: str) -> str:
    key = normalize_key(module_name)
    if key in MODULE_LABELS:
        return MODULE_LABELS[key]
    return key.replace("_", " ").title()


def _schema_snapshot():
    client = AirtableClient()
    roles = client.list_records("ROLES", by_name=True)
    modules = client.list_records("MODULOS", by_name=True)
    categories = client.list_records("CATEGORIAS_MENU", by_name=True)
    module_permissions = client.list_records("PERMISOS_MODULO", by_name=True)
    field_permissions = client.list_records("PERMISOS_CAMPO", by_name=True)
    return roles, modules, categories, module_permissions, field_permissions


def clear_access_cache():
    """Compatibility hook kept for callers; contract is intentionally live-read."""
    return None


def _menu_item(permission: dict, route: str, label: str | None = None, icon: str | None = None) -> dict:
    return {
        "to": route,
        "label": label or permission["label"],
        "module": permission["module"],
        "icon": icon or MODULE_ICONS.get(permission["module"], permission["icon"]),
        "category": permission["category"],
        "category_label": permission["category_label"],
        "description": permission["description"],
        "can": {
            "view": permission["view"],
            "create": permission["create"],
            "edit": permission["edit"],
            "delete": permission["delete"],
            "export": permission["export"],
        },
    }


def _menu_items_for_permission(permission: dict) -> list[dict]:
    """Translate canonical Airtable modules into implemented frontend routes.

    Agenda is a view of the existing CITAS module in Airtable. We do not invent an
    AGENDA_SLOTS module; the same CITAS permission drives both Agenda and Citas.
    """
    if not (permission["visible"] and permission["implemented"]):
        return []
    if permission["module"] == "CITAS":
        return [
            _menu_item(permission, "/backoffice/agenda", label="Agenda", icon="📅"),
            _menu_item(permission, "/backoffice/citas", label="Citas", icon="📋"),
        ]
    return [_menu_item(permission, permission["frontend_route"])]


def build_access_contract(role_name: str) -> dict:
    role_key = normalize_key(role_name)
    if role_key in {"", "PUBLICO"}:
        return {
            "role": role_key or "PUBLICO",
            "role_id": "",
            "modules": [],
            "menu": [],
            "permissions_by_module": {},
            "field_permissions": {},
        }

    roles, modules, categories, module_permissions, field_permissions = _schema_snapshot()

    role_record = next(
        (
            r for r in roles
            if normalize_key(r.get("fields", {}).get("NOMBRE_ROL")) == role_key
        ),
        None,
    )
    if not role_record:
        return {
            "role": role_key,
            "role_id": "",
            "modules": [],
            "menu": [],
            "permissions_by_module": {},
            "field_permissions": {},
        }

    role_id = role_record["id"]
    module_by_id = {m["id"]: m.get("fields", {}) for m in modules}
    category_by_id = {c["id"]: c.get("fields", {}) for c in categories}

    permissions = []
    for perm in module_permissions:
        fields = perm.get("fields", {})
        if role_id not in (fields.get("ROL") or []):
            continue
        if fields.get("ACTIVO") is False:
            continue

        module_id = _first_link(fields.get("MODULO"))
        module_fields = module_by_id.get(module_id) or {}
        module_name = module_fields.get("NOMBRE_MODULO")
        module_key = normalize_key(module_name)
        if not module_key or module_fields.get("ACTIVO") is False:
            continue

        category_id = _first_link(module_fields.get("CATEGORIA_MENU"))
        category = category_by_id.get(category_id) or {}
        frontend_route = SUPPORTED_BACKOFFICE_ROUTES.get(module_key)
        can_view = _bool(fields.get("VER"), False)
        visible = _bool(fields.get("VISIBLE"), False) and can_view
        permission = {
            "permission_id": perm["id"],
            "module_id": module_id,
            "module": module_key,
            "label": _format_label(module_key),
            "description": module_fields.get("DESCRIPCION") or "",
            "route": module_fields.get("RUTA") or "",
            "frontend_route": frontend_route,
            "implemented": bool(frontend_route),
            "icon": module_fields.get("ICONO") or MODULE_ICONS.get(module_key) or "📄",
            "category": normalize_key(category.get("NOMBRE_CATEGORIA")),
            "category_label": category.get("NOMBRE_CATEGORIA") or "",
            "order": module_fields.get("ORDEN") or 999,
            "visible": visible,
            "view": can_view,
            "create": _bool(fields.get("CREAR"), False),
            "edit": _bool(fields.get("EDITAR"), False),
            "delete": _bool(fields.get("ELIMINAR"), False),
            "export": _bool(fields.get("EXPORTAR"), False),
            "scope": fields.get("ALCANCE_DATOS") or "SIN_ACCESO",
            "default_view": fields.get("VISTA_DEFECTO") or "",
        }
        permissions.append(permission)

    permissions.sort(key=lambda p: (p["category_label"], p["order"], p["label"]))
    by_module = {}
    for perm in permissions:
        current = by_module.get(perm["module"])
        if current is None or (perm["visible"] and not current["visible"]):
            by_module[perm["module"]] = perm

    menu = []
    for perm in by_module.values():
        menu.extend(_menu_items_for_permission(perm))
    seen_routes = set()
    deduped_menu = []
    for item in sorted(menu, key=lambda i: (i["category_label"], i["label"])):
        if item["to"] in seen_routes:
            continue
        seen_routes.add(item["to"])
        deduped_menu.append(item)

    fields_by_table = {}
    for perm in field_permissions:
        fields = perm.get("fields", {})
        if role_id not in (fields.get("ROL") or []):
            continue
        if fields.get("ACTIVO") is False:
            continue
        table = normalize_key(fields.get("TABLA"))
        field = fields.get("CAMPO")
        if not table or not field:
            continue
        fields_by_table.setdefault(table, {})[field] = {
            "visible": _bool(fields.get("VISIBLE"), False),
            "editable": _bool(fields.get("EDITABLE"), False),
            "sensitive": _bool(fields.get("SENSIBLE"), False),
            "sensitivity": fields.get("NIVEL_SENSIBILIDAD") or "",
            "module_id": _first_link(fields.get("MODULO")),
        }

    return {
        "role": role_key,
        "role_id": role_id,
        "modules": permissions,
        "menu": deduped_menu,
        "permissions_by_module": by_module,
        "field_permissions": fields_by_table,
    }


def can_module(role_name: str, module_name: str, action: str = "view") -> bool:
    contract = build_access_contract(role_name)
    module = contract.get("permissions_by_module", {}).get(normalize_key(module_name))
    if not module:
        return False
    action_key = {
        "view": "view",
        "visible": "visible",
        "create": "create",
        "edit": "edit",
        "delete": "delete",
        "export": "export",
    }.get(action, action)
    return bool(module.get(action_key))

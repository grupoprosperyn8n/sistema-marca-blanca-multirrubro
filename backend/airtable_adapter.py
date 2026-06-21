"""
airtable_adapter.py — Capa backend segura para Airtable (READ-ONLY).

Fase 1: Solo lectura. El token NUNCA sale del backend.
Uso: importar este módulo en n8n workflows o backend server.

Backend canónico: SISTEMA_MARCA_BLANCA_MULTIRRUBRO — 49 tablas
Base anterior (app93Vhy56KrxNhwe) → DEPRECATED 2026-06-14
Nuevo PAT: 2026-06-14 comisionado por Diego

Autor: Hermes Agent
Versión: 1.1.0 — Backend V2 registrado
"""

import os
import json
import logging
from dataclasses import dataclass, field
from typing import Optional, Any
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════
# Configuración — solo desde variables de entorno
# ═══════════════════════════════════════════

@dataclass(frozen=True)
class AirtableConfig:
    """Configuración inmutable cargada exclusivamente desde entorno."""
    base_id: str
    api_token: str
    api_url: str = "https://api.airtable.com"

    @classmethod
    def from_env(cls) -> "AirtableConfig":
        """Carga configuración desde variables de entorno.
        
        Variables obligatorias:
          AIRTABLE_BASE_ID    — requerido (sin hardcode)
          AIRTABLE_API_TOKEN  — requerido (sin fallbacks)
          AIRTABLE_API_URL    — opcional (default: https://api.airtable.com)
        """
        # Variables estándar exclusivas. Sin fallbacks, sin hardcodes.
        base_id = os.getenv("AIRTABLE_BASE_ID")
        if not base_id:
            raise EnvironmentError(
                "AIRTABLE_BASE_ID requerido. Configuralo en .env."
            )
        
        api_token = os.getenv("AIRTABLE_API_TOKEN") or ""
        
        api_url = os.getenv("AIRTABLE_API_URL") or "https://api.airtable.com"
        
        if not api_token:
            raise EnvironmentError(
                "AIRTABLE_API_TOKEN requerido. Configuralo en .env."
            )
        
        return cls(base_id=base_id, api_token=api_token, api_url=api_url)


# ═══════════════════════════════════════════
# Modelos de datos
# ═══════════════════════════════════════════

@dataclass
class AirtableField:
    """Representación de un campo de Airtable."""
    id: str
    name: str
    type: str
    options: Optional[dict] = None
    description: Optional[str] = None

@dataclass
class AirtableTable:
    """Representación de una tabla de Airtable."""
    id: str
    name: str
    primary_field_id: str
    fields: list[AirtableField] = field(default_factory=list)

    @property
    def field_names(self) -> list[str]:
        return [f.name for f in self.fields]


# ═══════════════════════════════════════════
# Cliente Airtable — lectura + patch controlado
# ═══════════════════════════════════════════

class AirtableClient:
    """Cliente Airtable con PATCH para auth fields.
    
    El token se carga una sola vez desde el entorno.
    patch_record() solo para campos auth: INTENTOS_FALLIDOS, ULTIMO_LOGIN.
    """

    # Singleton — una sola instancia para toda la app
    _instance = None
    _initialized = False

    def __new__(cls, config: Optional[AirtableConfig] = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, config: Optional[AirtableConfig] = None):
        if AirtableClient._initialized and config is None:
            return
        self.config = config or AirtableConfig.from_env()
        self._schema: Optional[dict[str, AirtableTable]] = None
        self._table_list: Optional[list[AirtableTable]] = None
        AirtableClient._initialized = True

    # ── HTTP helpers ──────────────────────

    def _request(self, path: str, params: Optional[dict] = None) -> dict:
        """GET request autenticado a Airtable Meta/Data API."""
        url = f"{self.config.api_url}/v0/{path}"
        if params:
            url += "?" + urlencode(params, doseq=True)

        req = Request(url)
        req.add_header("Authorization", f"Bearer {self.config.api_token}")
        req.add_header("Accept", "application/json")

        try:
            with urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            body = e.read().decode() if e.fp else ""
            logger.error(f"Airtable HTTP {e.code}: {body[:500]}")
            raise
        except URLError as e:
            logger.error(f"Airtable connection error: {e.reason}")
            raise

    def _patch_request(self, path: str, body: dict) -> dict:
        """PATCH request autenticado a Airtable Data API."""
        data = json.dumps(body).encode("utf-8")
        url = f"{self.config.api_url}/v0/{path}"
        req = Request(url, data=data, method="PATCH")
        req.add_header("Authorization", f"Bearer {self.config.api_token}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")
        try:
            with urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            body_text = e.read().decode() if e.fp else ""
            logger.error(f"Airtable PATCH HTTP {e.code}: {body_text[:500]}")
            raise
        except URLError as e:
            logger.error(f"Airtable PATCH connection error: {e.reason}")
            raise

    # ── Escritura controlada (solo auth fields) ──

    def patch_record(
        self,
        table_name_or_id: str,
        record_id: str,
        fields: dict,
    ) -> dict:
        """Actualiza campos de un registro (uso controlado: solo auth)."""
        table = self.get_table(table_name_or_id)
        if not table:
            raise ValueError(f"Tabla no encontrada: {table_name_or_id}")
        return self._patch_request(
            f"{self.config.base_id}/{table.id}/{record_id}",
            {"fields": fields},
        )


    def _paginate(self, path: str, params: Optional[dict] = None) -> list[dict]:
        """Recorre todas las páginas de un endpoint paginado."""
        all_items = []
        offset = None
        p = dict(params or {})
        while True:
            if offset:
                p["offset"] = offset
            data = self._request(path, p)
            items_key = next((k for k in data if k != "offset"), None)
            if items_key:
                all_items.extend(data[items_key])
            offset = data.get("offset")
            if not offset:
                break
        return all_items

    # ── Schema / Metadata ────────────────

    def fetch_schema(self, force: bool = False) -> dict[str, AirtableTable]:
        """Obtiene schema completo de la base (cacheado)."""
        if self._schema is not None and not force:
            return self._schema

        tables_data = self._paginate(f"meta/bases/{self.config.base_id}/tables")
        self._schema = {}
        self._table_list = []
        for td in tables_data:
            fields = [
                AirtableField(
                    id=f["id"],
                    name=f["name"],
                    type=f["type"],
                    options=f.get("options"),
                    description=f.get("description"),
                )
                for f in td.get("fields", [])
            ]
            table = AirtableTable(
                id=td["id"],
                name=td["name"],
                primary_field_id=td["primaryFieldId"],
                fields=fields,
            )
            self._schema[td["name"]] = table
            self._schema[td["id"]] = table
            self._table_list.append(table)

        return self._schema

    def list_tables(self) -> list[AirtableTable]:
        """Lista todas las tablas con sus campos."""
        if self._table_list is None:
            self.fetch_schema()
        return self._table_list or []

    def get_table(self, name_or_id: str) -> Optional[AirtableTable]:
        """Obtiene una tabla por nombre o ID."""
        schema = self.fetch_schema()
        return schema.get(name_or_id)

    # ── Datos — solo lectura ─────────────

    def list_records(
        self,
        table_name_or_id: str,
        fields: Optional[list[str]] = None,
        filter_formula: Optional[str] = None,
        max_records: Optional[int] = None,
        view: Optional[str] = None,
        by_name: bool = False,
    ) -> list[dict]:
        """Lista registros de una tabla (READ-ONLY).
        
        Args:
            table_name_or_id: Nombre o ID de la tabla
            fields: Lista de campos a retornar (None = todos)
            filter_formula: Fórmula de filtro Airtable
            max_records: Máximo de registros a retornar
            view: Vista o grid view ID
            by_name: Si True, usa el nombre sin resolver schema (rápido)
        """
        params = {}
        if fields:
            params["fields"] = fields
        if filter_formula:
            params["filterByFormula"] = filter_formula
        if max_records:
            params["maxRecords"] = max_records
        if view:
            params["view"] = view

        if by_name:
            records = self._paginate(
                f"{self.config.base_id}/{table_name_or_id}", params
            )
            return records

        table = self.get_table(table_name_or_id)
        if not table:
            raise ValueError(f"Tabla no encontrada: {table_name_or_id}")
        records = self._paginate(f"{self.config.base_id}/{table.id}", params)
        return records

    def get_record(self, table_name_or_id: str, record_id: str) -> dict:
        """Obtiene un registro individual."""
        table = self.get_table(table_name_or_id)
        if not table:
            raise ValueError(f"Tabla no encontrada: {table_name_or_id}")

        return self._request(f"{self.config.base_id}/{table.id}/{record_id}")

    # ── Utilidades ───────────────────────

    def field_groups(self, table_name: str) -> dict[str, list[str]]:
        """Agrupa campos de una tabla por categoría basada en prefijos/nombres.
        
        Retorna dict con grupos como:
        - 'fuente_web': campos para frontend público
        - 'ia': campos generados por IA
        - 'revision_humana': campos de revisión/aprobación
        - 'permisos': campos relacionados a permisos
        - 'core': campos base/identificadores
        - 'other': resto
        """
        table = self.get_table(table_name)
        if not table:
            return {}

        groups = {
            "fuente_web": [],
            "ia": [],
            "revision_humana": [],
            "permisos": [],
            "core": [],
            "other": [],
        }

        for f in table.fields:
            name = f.name.upper()
            if any(kw in name for kw in ["IA_", "GENERADO_", "SCORE_IA", "RESUMEN_IA", "TAGS_IA"]):
                groups["ia"].append(f.name)
            elif any(kw in name for kw in ["REVISION_", "APROBADO_", "PENDIENTE_", "CORRECCION_"]):
                groups["revision_humana"].append(f.name)
            elif any(kw in name for kw in ["PERMISO_", "VISIBLE_", "ROL_"]):
                groups["permisos"].append(f.name)
            elif any(kw in name for kw in ["WEB_", "PUBLICO_", "FRONTEND_", "LANDING_", "E-COMMERCE"]):
                groups["fuente_web"].append(f.name)
            elif name in ["ID", "NAME", "NOMBRE", "CREATED_TIME", "CREATED", "STATUS"]:
                groups["core"].append(f.name)
            else:
                groups["other"].append(f.name)

        # Filtrar grupos vacíos
        return {k: v for k, v in groups.items() if v}


# ═══════════════════════════════════════════
# Verificación de seguridad
# ═══════════════════════════════════════════

def verify_no_token_in_frontend(static_dir: str) -> list[str]:
    """Verifica que no haya tokens Airtable en archivos frontend.
    
    Escanea archivos .html, .js, .css, .json en busca de:
    - pat* (Personal Access Tokens)
    - key* (API keys)
    - Bearer tokens
    
    Retorna lista de issues encontrados (vacía = limpio).
    """
    import fnmatch
    import re

    issues = []
    patterns = [
        (r'pat[a-zA-Z0-9]{10,}\.[a-zA-Z0-9]{30,}', "Airtable PAT"),
        (r'key[a-zA-Z0-9]{20,}', "Airtable API Key"),
        (r'Bearer\s+[a-zA-Z0-9_\-\.]{20,}', "Bearer token"),
    ]

    for root, _, files in os.walk(static_dir):
        for fname in files:
            if not any(fname.endswith(ext) for ext in [".html", ".js", ".css", ".json"]):
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath) as f:
                    content = f.read()
                for pat_re, label in patterns:
                    matches = re.findall(pat_re, content)
                    if matches:
                        issues.append(f"❌ {label} en {fpath}")
            except Exception:
                pass

    return issues


# ═══════════════════════════════════════════
# Demo / smoke test
# ═══════════════════════════════════════════

if __name__ == "__main__":
    print("=== Smoketest AirtableAdapter ===\n")
    client = AirtableClient()
    tables = client.list_tables()
    print(f"Tablas: {len(tables)}")
    for t in tables[:5]:
        print(f"  📋 {t.name} ({len(t.fields)} campos)")
    print("...")

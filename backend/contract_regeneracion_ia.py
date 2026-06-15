"""
Regeneracion IA — Contrato de disenio (Fase 1: sin ejecutar)

Define el contrato futuro para regenerar contenido IA en PRODUCTOS_WEB/SERVICIOS_WEB.
Regla fundamental: Regenerar IA NUNCA aprueba frontend automaticamente.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class RegeneracionIARequest:
    """POST /api/web/regenerar-ia"""
    tabla: str; record_id: str; campos_a_regenerar: list[str]
    solicitado_por: str; motivo: Optional[str] = None

@dataclass
class RegeneracionIAResponse:
    success: bool; record_id: str; campos_regenerados: list[str]
    fecha_regeneracion: datetime
    nuevo_estado_revision: str = "PENDIENTE"
    alerta: str = "IA regenerado — requiere revision humana antes de publicar"

REGLAS = {
    "R1": "Regenerar IA NUNCA aprueba frontend (APROBADO_USO_FRONTEND_IA = FALSE)",
    "R2": "Solo ADMINISTRADOR y GERENTE pueden regenerar IA",
    "R3": "Cada regeneracion registra auditoria (quien, cuando, que campos, motivo)",
    "R4": "Estado post-regeneracion siempre PENDIENTE, nunca APROBADO",
    "R5": "Bloqueo de aprobacion automatica: no permitir flujo automatico sin humano",
    "R6": "Campos IA regenerados: AGENTE_TEXTO_PROMOCIONAL_AI, AGENTE_CATEGORIZACION_WEB_AI, RIESGO_PUBLICACION_PRODUCTO_WEB_AI, NIVEL_RIESGO_PUBLICACION_AI, ACCION_RECOMENDADA_PUBLICACION_AI",
}

PERMISOS = {
    "ADMINISTRADOR": {"solicitar": True, "aprobar": True},
    "GERENTE": {"solicitar": True, "aprobar": True},
    "EMPLEADO_GESTION": {"solicitar": False, "aprobar": False},
    "PROFESIONAL": {"solicitar": False, "aprobar": False},
    "SOLO_LECTURA": {"solicitar": False, "aprobar": False},
}

FLUJO = """
[Contenido Fuente] -> IA genera -> PENDIENTE
                                     -> EN_REVISION (humano revisa)
                                     -> APROBADO (frontend visible) 
                                     -> RECHAZADO (volver a generar -> PENDIENTE) 
                                     -> REVISAR (corregir manual)
"""

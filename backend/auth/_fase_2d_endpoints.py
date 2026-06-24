

# ══ FASE_2D: Admin User Management + Change Password ════════════
from typing import Optional

# ── Models ────────────────────────────────────
class AdminCreateUserRequest(BaseModel):
    nombre: str
    email: str
    rol_nombre: str = "CLIENTE"
    cliente_id: Optional[str] = ""
    empleado_id: Optional[str] = ""

class AdminUserResponse(BaseModel):
    id: str
    nombre: str = ""
    email: str = ""
    rol: str = ""
    estado_acceso: str = ""
    ultimo_login: str = ""
    intentos_fallidos: int = 0
    email_verificado: bool = False
    debe_cambiar_password: bool = False
    cliente: str = ""
    empleado: str = ""

class AdminResetPasswordResponse(BaseModel):
    message: str
    temp_password: str = ""

class AdminActionResponse(BaseModel):
    message: str

class ChangePasswordRequest(BaseModel):
    current_password: str = ""
    new_password: str
    confirm_password: str

class ChangePasswordResponse(BaseModel):
    message: str

# ── Helpers ───────────────────────────────────
def _admin_format_user(record: dict) -> dict:
    fields = record.get("fields", {})
    cliente_raw = fields.get("CLIENTE", "")
    empleado_raw = fields.get("EMPLEADO", "")
    return {
        "id": record["id"],
        "nombre": fields.get("NOMBRE_USUARIO", ""),
        "email": fields.get("EMAIL_LOGIN", ""),
        "rol": _resolve_rol(fields.get("ROL", "")),
        "estado_acceso": fields.get("ESTADO_USUARIO", ""),
        "ultimo_login": str(fields.get("ULTIMO_LOGIN", "")) if fields.get("ULTIMO_LOGIN") else "",
        "intentos_fallidos": fields.get("INTENTOS_FALLIDOS", 0) or 0,
        "email_verificado": bool(fields.get("EMAIL_VERIFICADO", False)),
        "debe_cambiar_password": bool(fields.get("REQUIERE_CAMBIO_CLAVE", False)),
        "cliente": (cliente_raw[0] if isinstance(cliente_raw, list) and cliente_raw
                      else str(cliente_raw) if cliente_raw else ""),
        "empleado": (empleado_raw[0] if isinstance(empleado_raw, list) and empleado_raw
                       else str(empleado_raw) if empleado_raw else ""),
    }

def _resolve_rol_id(client: AirtableClient, rol_nombre: str) -> str:
    try:
        records = client.list_records(
            "ROLES", filter_formula=f"'NOMBRE_ROL'='{rol_nombre}'", max_records=1
        )
        if records:
            return records[0]["id"]
    except Exception:
        pass
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Rol '{rol_nombre}' no encontrado.",
    )

def _user_record_or_404(client: AirtableClient, user_id: str) -> dict:
    try:
        return client.get_record("USUARIOS", user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

# ── GET /api/auth/admin/users ──────────────────
@router.get("/admin/users", response_model=list[AdminUserResponse])
async def admin_list_users(request: Request, auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    try:
        records = client.list_records("USUARIOS", max_records=200)
    except Exception as e:
        logger.error("Failed to list users: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar usuarios.",
        )
    return [_admin_format_user(r) for r in records]

# ── POST /api/auth/admin/users ──────────────────
@router.post("/admin/users", response_model=AdminUserResponse)
async def admin_create_user(body: AdminCreateUserRequest, request: Request,
                            response: Response, auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    from .security import hash_password, validate_password, generate_temp_password
    await verify_admin(request, auth_token)

    email = body.email.strip().lower()
    nombre = body.nombre.strip()

    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre es obligatorio.",
        )

    client = AirtableClient()

    existing = _find_user_by_email(client, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese email.",
        )

    rol_id = _resolve_rol_id(client, body.rol_nombre)

    temp_password = generate_temp_password()
    password_hash = hash_password(temp_password)

    user_fields = {
        "NOMBRE_USUARIO": nombre,
        "EMAIL_LOGIN": email,
        "CONTRASENA_HASH": password_hash,
        "ROL": [rol_id],
        "REQUIERE_CAMBIO_CLAVE": True,
        "ESTADO_USUARIO": "PENDIENTE",
        "INTENTOS_FALLIDOS": 0,
        "EMAIL_VERIFICADO": True,
    }
    if body.cliente_id:
        user_fields["CLIENTE"] = [body.cliente_id]
    if body.empleado_id:
        user_fields["EMPLEADO"] = [body.empleado_id]

    try:
        new_user = client.create_record("USUARIOS", user_fields)
        logger.info("Admin created USUARIOS %s (%s) role=%s", new_user["id"], email, body.rol_nombre)
    except Exception as e:
        logger.error("Failed to create user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear usuario.",
        )

    result = _admin_format_user(new_user)
    logger.info("Temp password generated for %s (not logged)", email)
    return {**result, "message": f"Usuario creado. Contrasena temporal: {temp_password}"}

# ── POST /api/auth/admin/users/{user_id}/reset-password ──
@router.post("/admin/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
async def admin_reset_password(user_id: str, request: Request,
                               auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    from .security import hash_password, generate_temp_password
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    temp_password = generate_temp_password()
    password_hash = hash_password(temp_password)
    now_utc = datetime.now(timezone.utc)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "CONTRASENA_HASH": password_hash,
                "REQUIERE_CAMBIO_CLAVE": True,
                "ESTADO_USUARIO": "PENDIENTE",
                "PASSWORD_RESET_FORZADO_EN": now_utc.isoformat(),
                "PASSWORD_RESET_FORZADO_POR": "ADMIN",
                "INTENTOS_FALLIDOS": 0,
                "BLOQUEADO_HASTA": None,
            },
        )
        logger.info("Admin reset password for user %s", user_id)
    except Exception as e:
        logger.error("Failed to reset password for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al resetear contrasena.",
        )

    return AdminResetPasswordResponse(
        message="Contrasena temporal generada. Copiala ahora. No se volvera a mostrar.",
        temp_password=temp_password,
    )

# ── POST /api/auth/admin/users/{user_id}/force-password-change ──
@router.post("/admin/users/{user_id}/force-password-change", response_model=AdminActionResponse)
async def admin_force_password_change(user_id: str, request: Request,
                                      auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "REQUIERE_CAMBIO_CLAVE": True,
                "ESTADO_USUARIO": "PENDIENTE",
            },
        )
        logger.info("Admin forced password change for user %s", user_id)
    except Exception as e:
        logger.error("Failed to force change for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al forzar cambio de contrasena.",
        )

    return AdminActionResponse(message="Cambio de contrasena forzado.")

# ── POST /api/auth/admin/users/{user_id}/block ──
@router.post("/admin/users/{user_id}/block", response_model=AdminActionResponse)
async def admin_block_user(user_id: str, request: Request,
                           auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {"ESTADO_USUARIO": "BLOQUEADO", "BLOQUEADO_HASTA": "2099-12-31"},
        )
        logger.info("Admin blocked user %s", user_id)
    except Exception as e:
        logger.error("Failed to block user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al bloquear usuario.",
        )

    return AdminActionResponse(message="Usuario bloqueado.")

# ── POST /api/auth/admin/users/{user_id}/unblock ──
@router.post("/admin/users/{user_id}/unblock", response_model=AdminActionResponse)
async def admin_unblock_user(user_id: str, request: Request,
                             auth_token: str = Cookie(default=None)):
    from .dependencies import verify_admin
    await verify_admin(request, auth_token)

    client = AirtableClient()
    _user_record_or_404(client, user_id)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "ESTADO_USUARIO": "ACTIVO",
                "BLOQUEADO_HASTA": None,
                "INTENTOS_FALLIDOS": 0,
            },
        )
        logger.info("Admin unblocked user %s", user_id)
    except Exception as e:
        logger.error("Failed to unblock user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al desbloquear usuario.",
        )

    return AdminActionResponse(message="Usuario desbloqueado.")

# ── POST /api/auth/change-password ──────────────
@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(body: ChangePasswordRequest, request: Request,
                          auth_token: str = Cookie(default=None)):
    from .dependencies import get_current_user
    from .security import verify_password, hash_password, validate_password

    user = await get_current_user(request, auth_token)
    user_id = user["id"]

    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contrasenas no coinciden.",
        )

    is_valid, pw_error = validate_password(body.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_error,
        )

    client = AirtableClient()
    record = _user_record_or_404(client, user_id)
    fields = record.get("fields", {})

    requiere_cambio = bool(fields.get("REQUIERE_CAMBIO_CLAVE", False))

    if not requiere_cambio:
        current_hash = fields.get("CONTRASENA_HASH", "")
        if not current_hash or not verify_password(body.current_password, current_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contrasena actual incorrecta.",
            )

    new_hash = hash_password(body.new_password)
    now_utc = datetime.now(timezone.utc)

    try:
        client.patch_record(
            "USUARIOS", user_id,
            {
                "CONTRASENA_HASH": new_hash,
                "REQUIERE_CAMBIO_CLAVE": False,
                "PASSWORD_CAMBIADA_EN": now_utc.isoformat(),
                "ESTADO_USUARIO": "ACTIVO",
                "INTENTOS_FALLIDOS": 0,
                "BLOQUEADO_HASTA": None,
            },
        )
        logger.info("User %s changed password successfully", user_id)
    except Exception as e:
        logger.error("Failed to change password for %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar contrasena.",
        )

    return ChangePasswordResponse(message="Contrasena cambiada exitosamente.")

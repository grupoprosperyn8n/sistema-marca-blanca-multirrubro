# Variables de Entorno — AionUI Hermes Factory Harness v2

## 📋 Resumen

Este proyecto usa variables de entorno para configurar credenciales y conexiones a servicios externos. Se guardan en `.env` (en la raíz del proyecto), que está protegido por `.gitignore` y **nunca se sube a Git**.

El archivo de referencia es `.env.example` en la raíz. Los archivos en `config/*.env.example` son separaciones por servicio para documentación específica.

---

## 🗺️ Variables por servicio

### Supabase

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sí | Pública | Frontend, cliente Supabase | No conecta a DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sí | Pública | Frontend (con RLS) | Auth público no funciona |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Solo backend | 🔴 Secreta | Edge Functions, n8n, migraciones | Total: permisos administrativos |
| `SUPABASE_PROJECT_REF` | ✅ Sí | Interna | Scripts, backup-supabase | No identifica proyecto |
| `SUPABASE_DB_PASSWORD` | ✅ Sí | 🔴 Secreta | Migraciones directas | No migra DB |
| `DATABASE_URL` | ⚠️ Opcional | 🔴 Secreta | psql directo | Migraciones directas no funcionan |

> **⚠️ `SUPABASE_SERVICE_ROLE_KEY` tiene permisos TOTALES sobre toda la base de datos.**
> NUNCA usar en frontend, NUNCA exponer en logs, NUNCA incluir en código cliente.

### Airtable

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `AIRTABLE_API_KEY` | ✅ Sí | 🔴 Secreta | API Airtable, sync-maps | No sincroniza con Airtable |
| `AIRTABLE_BASE_ID` | ✅ Sí | Interna | Operaciones sobre bases | No puede leer/escribir |

### n8n

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `N8N_BASE_URL` | ✅ Sí | Interna | Webhooks, health checks | No ejecuta workflows |
| `N8N_API_KEY` | ✅ Sí | 🔴 Secreta | Autenticación webhooks | Webhooks rechazados |
| `N8N_WEBHOOK_SECRET` | ⚠️ Recomendada | 🔴 Secreta | Validación webhooks | Webhooks sin firma |

### GitHub

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `GITHUB_TOKEN` | ⚠️ Si usas GitHub | 🔴 Secreta | gh CLI, PR automation | No opera con repos |
| `GITHUB_OWNER` | ✅ Sí | Pública | Identifica dueño repo | CI/CD no funciona |
| `GITHUB_REPO` | ✅ Sí | Pública | Identifica repo | CI/CD no funciona |

### Stripe (Pagos)

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `STRIPE_SECRET_KEY` | ⚠️ Si usas pagos | 🔴 Secreta | Backend, webhooks de pago | No procesa pagos |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ Si usas pagos | Pública | Frontend, checkout | Checkout no carga |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Si usas webhooks | 🔴 Secreta | Validación webhooks Stripe | Webhooks no verificados |

> **⚠️ `STRIPE_SECRET_KEY` maneja pagos reales. Nunca exponer en frontend ni comitear.**

### Email (Resend)

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `RESEND_API_KEY` | ⚠️ Si usas email | 🔴 Secreta | Envío de emails | No envía notificaciones |
| `EMAIL_FROM` | ⚠️ Si usas email | Pública | Remitente de emails | Emails sin remitente |

### Notificaciones

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `TELEGRAM_BOT_TOKEN` | ⚠️ Si usas Telegram | 🔴 Secreta | Bot de Telegram | Notificaciones no llegan |
| `TELEGRAM_CHAT_ID` | ⚠️ Si usas Telegram | Interna | Canal/grupo destino | Bot no sabe a quién escribir |
| `SLACK_BOT_TOKEN` | ⚠️ Si usas Slack | 🔴 Secreta | Bot de Slack | Notificaciones no llegan |
| `SLACK_CHANNEL_ID` | ⚠️ Si usas Slack | Interna | Canal destino | Bot no sabe a quién escribir |

### Sistema

| Variable | Obligatoria | Pública/Secreta | Dónde se usa | Riesgo si falta |
|----------|:-----------:|:---------------:|--------------|-----------------|
| `AGENT_NAME` | ⚠️ Recomendada | Interna | Contexto del agente actual | El agente no se identifica |
| `FACTORY_HARNESS_VERSION` | ✅ Sí | Pública | Control de versión de fábrica | Versión no trackeada |

---

## 🔧 Cómo configurar

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
# Edita .env con tus valores reales
```

O ejecuta el script de setup (si existe):

```bash
bash harness/stack-setup.sh
```

### Por servicio (configuración separada)

Si preferís configurar servicio por servicio, los templates están en `config/`:

```bash
# Copiar y configurar solo lo que necesitas
cat config/supabase.env.example   # Documentación de Supabase
cat config/airtable.env.example  # Documentación de Airtable
cat config/n8n.env.example       # Documentación de n8n
```

---

## 🛡️ Reglas de seguridad

1. `.env` está en `.gitignore` — **nunca se sube a Git**
2. `SUPABASE_SERVICE_ROLE_KEY` — **NUNCA en frontend**, permisos totales sobre DB
3. `STRIPE_SECRET_KEY` — clave de pagos reales, proteger como contraseña bancaria
4. Ninguna variable secreta se escribe en logs ni archivos compartidos
5. Ninguna variable secreta se pasa a prompts de IA (usar referencias tipo `$SUPABASE_SERVICE_ROLE_KEY`)
6. Las variables públicas (NEXT_PUBLIC_*) pueden ir al frontend sin riesgo de RLS

---

## 🔄 Entornos (dev / staging / prod)

No hay archivos `.env.dev`, `.env.staging`, `.env.prod` separados.
Usar `APP_ENV` en `.env` para distinguir:

```env
APP_ENV=development   # o staging | production
```

Los scripts y sensores leen `APP_ENV` para decidir permisos.

---

## 📌 Alias Legacy (compatibilidad)

Si ves estos nombres en scripts viejos o documentación antigua, ahora se llaman así:

| Nombre legacy | Nombre estándar actual |
|---------------|------------------------|
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
| `AIRTABLE_TOKEN` | `AIRTABLE_API_KEY` |
| `N8N_URL` / `N8N_HOST` + `N8N_PORT` + `N8N_PROTOCOL` | `N8N_BASE_URL` |

---

## 📌 Notas

- Si agregás una nueva variable, actualizá este archivo, `.env.example` y `config/*.env.example`
- Los placeholders en `.env.example` deben ser claros (ej: `your_token_here` o `***`)
- No dejar placeholders vacíos sin explicación
- No compartir `.env` entre entornos — cada entorno debe tener su propio `.env`

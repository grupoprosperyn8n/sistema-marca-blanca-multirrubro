# 🤖 PROMPT PARA CODEX — SISTEMA MARCA BLANCA MULTIRRUBRO

> **Fecha**: 2026-06-24
> **Owner**: Diego López
> **Repositorio**: https://github.com/grupoprosperyn8n/sistema-marca-blanca-multirrubro
> **Último commit**: `b2626ff` — fix(backend): me/citas — filtrar en Python por nombre de cliente

---

## 🎯 ¿QUÉ ES ESTE PROYECTO?

Sistema modular **marca blanca multirrubro** para gestionar negocios de cualquier rubro. La demo piloto es un **Salón de Belleza** con portal público, login de clientes/profesionales/admin, reserva de turnos online, confirmación, cancelación, y reprogramación.

Es un **híbrido**: FastAPI + Airtable (no-code backend) + React (SPA frontend) + Surge.sh (deploy estático) + Railway (deploy backend).

---

## 🔗 URLS ACTIVAS (SURGE.SH + RAILWAY)

| URL | Descripción | Qué es |
|-----|-------------|--------|
| `https://belleza-demo.surge.sh` | Demo Salón Belleza | Frontend principal del piloto: menú público, reserva, portal cliente |
| `https://sistema-multirrubro-demo.surge.sh` | Marca Blanca genérica | Mismo frontend, misma API, sin marca de belleza |
| `https://bellezapro-demo.surge.sh` | Variante Pro | Otra variante de la demo |
| `https://earnest-comfort-production-3d75.up.railway.app` | **Backend FastAPI** | API productiva (Railway) |
| `https://manual-harness.surge.sh` | Manual Harness | Documentación del harness operativo |
| `https://harness-fabrica.surge.sh` | Harness Fábrica | Interfaz de la fábrica de proyectos |
| `https://fabrica-proyecto.surge.sh` | Fábrica Proyecto | Otra vista de fábrica |
| `https://gestion-desalones-de-belleza.surge.sh` | Versión legacy | Primera versión del sistema (antes del rename) |
| `https://gestion-desalones-de-belleza-preview.surge.sh` | Preview | Preview de la primera versión |

**Login QA**: `qaportal3b@bellezapro.test` / `qatest99` (rol CLIENTE)

---

## 🔑 CREDENCIALES Y API KEYS

### Airtable
- **Base ID del proyecto**: `appuns6zIUKaJG7r0`
- **Tokens**: Ver `CREDENCIALES.md` en la raíz del proyecto
- **API URL**: `https://api.airtable.com`

### n8n
- **API Key**: Ver `CREDENCIALES.md`
- **URL local**: `http://localhost:5678`

### Railway
- **URL backend**: `https://earnest-comfort-production-3d75.up.railway.app`
- **Proyecto**: `earnest-comfort` (grupoprosperyn8n)
- **Auto-deploy**: conectado a `main` del repo

### Surge.sh
- **Login**: Ver `CREDENCIALES.md`
- **CLI**: `surge` (comando global)

### GitHub
- **Repo**: `https://github.com/grupoprosperyn8n/sistema-marca-blanca-multirrubro`
- **Token**: almacenado en `gh` CLI local (`gh auth token`)

### OpenAI (Codex)
- **API Key**: Configurado en tu cuenta Codex local

### ⚠️ TODAS LAS CLAVES
**El archivo `CREDENCIALES.md` en la raíz del proyecto contiene TODAS las credenciales**:
- `AIRTABLE_CREDENCIALES` (token global)
- `AIRTABLE` (token proyecto `patcWb...`)
- `N8N_API_KEY`
- `GITHUB_TOKEN`
- `Surge.sh` (login: `streethead01@gmail.com`)
- `OPENAI`

---

## 📂 CARPETAS LOCALES DEL PROYECTO

```
/home/diegol/Descargas/PROYECTOS AIONUI/
└── sistema-marca-blanca-multirrubro/   ← 🎯 ESTE ES EL PROYECTO ACTIVO
    ├── backend/                        ← FastAPI (Python 3.11, Railway)
    │   ├── routes/                     ← Endpoints API
    │   │   ├── clientes.py             ← Portal cliente + cancelar/reprogramar
    │   │   ├── citas.py                ← Endpoint público de citas
    │   │   ├── agenda_slots.py         ← Slots de agenda
    │   │   ├── servicios_web.py        ← Servicios públicos
    │   │   ├── sucursales.py           ← Sucursales
    │   │   ├── productos_web.py        ← Productos/catálogo
    │   │   ├── auth/routes.py          ← Login/register/reset-password
    │   │   └── configuracion_publica.py← Config pública
    │   ├── auth/                       ← Auth module
    │   │   ├── security.py             ← bcrypt, JWT, verify_password
    │   │   └── dependencies.py         ← get_current_user
    │   ├── airtable_adapter.py         ← Wrapper Python sobre Airtable REST API
    │   ├── main.py                     ← Entry point FastAPI + CORS
    │   ├── config.py                   ← Config desde .env
    │   ├── requirements.txt            ← Dependencias
    │   └── .env                        ← Variables de entorno (NO COMMITEAR)
    ├── frontend/                       ← React SPA (Vite)
    │   └── src/
    │       ├── pages/                  ← 22 páginas
    │       │   ├── PortalCliente.jsx   ← Panel cliente (citas, cancelar, reprogramar)
    │       │   ├── Login.jsx           ← Login con email/password
    │       │   ├── Register.jsx        ← Registro
    │       │   ├── Reserva.jsx         ← Reserva de turno paso a paso
    │       │   ├── Agenda.jsx          ← Vista de agenda (profesional/admin)
    │       │   ├── Servicios.jsx       ← Catálogo servicios
    │       │   └── ... (16 páginas más)
    │       └── components/
    │           ├── ReservaTurnoModal.jsx ← Modal de reserva con dry-run
    │           └── ui/                 ← Componentes UI (GlassCard, DataTable, etc.)
    ├── harness/                        ← 📘 HARNESS (guías operativas)
    │   ├── HARNESS.md                  ← Documento maestro
    │   ├── AGENT_RUNBOOK.md            ← Instrucciones para agentes IA
    │   ├── MULTI_AGENT.md              ← Coordinación multi-agente
    │   ├── init.sh                     ← Script de inicialización
    │   ├── contracts/                  ← Contratos de features
    │   ├── templates/                  ← Templates de código
    │   └── quick-start/                ← Guías de arranque rápido
    ├── progress/                       ← 📊 Tracking de progreso
    │   ├── tasks.json                  ← Estado actual de fases
    │   ├── FASE_3B_PORTAL_CLIENTE.md   ← Reporte fase 3B
    │   └── plans/                      ← Planes futuros
    ├── docs/                           ← 📚 Documentación
    │   ├── roadmap/                    ← Roadmaps por fase
    │   ├── auth/                       ← Documentación auth
    │   └── data-model/                 ← Modelo de datos
    ├── skills/                         ← Skills de Hermes
    ├── scripts/                        ← Scripts utilitarios (seed, etc.)
    ├── deploy/                         ← Scripts de deploy
    ├── n8n/                            ← Workflows n8n (1 solo, no deployado)
    ├── FACTORY_HARNESS_MASTER.md       ← Filosofía de la fábrica
    ├── CREDENCIALES.md                 ← ⚠️ CREDENCIALES (todas las keys)
    ├── PROYECTO.md                     ← Info general del proyecto
    └── PROMPT_ARRANQUE.md              ← Prompt original de arranque

/home/diegol/Documentos/
└── erp-saas-aionui-workspace/         ← 🏭 FÁBRICA MADRE (no modificar)
    ├── app/                            ← App base
    ├── har.py                          ← Core del harness
    ├── airtable/                       ← Schemas Airtable
    └── .credenciales/                  ← Credenciales de la fábrica
```

---

## 🏗️ CÓMO USA HARNESS Y FACTORY EL PROYECTO

El **harness** (`harness/`) es el sistema operativo del proyecto. Define:
- Cómo se crean nuevas features (contratos → código → QA)
- Checklist de seguridad y secretos
- Sistema de fases con reportes de cierre
- Memoria persistente entre sesiones de IA

La **fábrica** (`erp-saas-aionui-workspace/`) es el template madre del que se clonó este proyecto. No se modifica directamente — se usa como referencia para nuevos proyectos.

El flujo es:
1. **Fábrica** clona estructura base → crea proyecto
2. **Harness** define metodología → guía al agente IA
3. **Backend** (FastAPI) expone API → conecta con Airtable
4. **Frontend** (React) consume API → experiencia de usuario
5. **Surge** hostea frontend → URLs públicas
6. **Railway** hostea backend → API pública
7. **n8n** (pendiente deployar) → automatizaciones

---

## 📋 ESTADO ACTUAL: ¿QUÉ FALTA?

### ✅ COMPLETADO
- **FASE 1**: Schema Airtable (15 tablas), CRUD base, seed data, UI multi-rol
- **FASE 2**: Auth completa (login, register, reset-password, roles CLIENTE/PROFESIONAL/ADMIN/EMPLEADO_GESTION), recuperación de contraseña con token BCrypt
- **FASE 3A**: Portal público responsive (servicios, sucursales, productos)
- **FASE 3B**: Portal Cliente (login → perfil → mis citas)
- **FASE 3C1**: Endpoint dry-run de reserva (valida sin escribir) → funciona
- **FASE 3C2**: Confirmación real de turnos (POST `/api/clientes/citas/confirmar`) → crea CITA + marca AGENDA_SLOT como RESERVADO
- **FASE 3C3** (back-end): Endpoints de cancelación (`POST /api/clientes/citas/{id}/cancelar`) y reprogramación (`POST /api/clientes/citas/{id}/reprogramar`) → commit `b2626ff`

### 🔧 EN PROGRESO (BUG)
- **`/api/clientes/me/citas`**: No retorna citas para el cliente logueado. Se cambió filtro Airtable (frágil con linked fields) por filtrado Python, pero Railway sigue sin devolver citas. **Necesita debug**.

### ❌ PENDIENTE
| Prioridad | Tarea | Descripción |
|-----------|-------|-------------|
| 🔴 P1 | **Fix me/citas** | El endpoint `/api/clientes/me/citas` retorna 0 citas. Necesita debuggear por qué `get_record("CLIENTES", ...)` y el filtro Python no funciona |
| 🔴 P1 | **QA FASE 3C3** | Probar cancelar y reprogramar desde frontend con citas reales (necesita fix de me/citas primero) |
| 🟡 P2 | **Portal Profesional** | Dashboard para profesionales: ver agenda diaria, clientes asignados, marcar atención completada |
| 🟡 P2 | **Notificaciones** | Email/SMS de confirmación al crear/cancelar/reprogramar cita (n8n) |
| 🟡 P2 | **n8n workflows** | Deployar y conectar workflows n8n (solo hay 1 archivo JSON, no deployado) |
| 🟢 P3 | **Supabase sync** | Sincronización Airtable ↔ Supabase para backup y queries complejas |
| 🟢 P3 | **Admin dashboard** | Métricas, KPIs, reportes para rol ADMIN |
| 🟢 P3 | **Multi-rubro** | Generalizar el sistema para otros rubros (no solo belleza) |
| 🟢 P3 | **Tests** | Tests unitarios, integración, E2E |
| 🟢 P3 | **Mobile app** | PWA o app nativa |

### 🐛 BUGS CONOCIDOS
- **`me/citas` no retorna citas**: Railway devuelve `total: 0` aunque el cliente tiene citas vinculadas en Airtable
- **Protección de rutas**: Sidebar que oculta un link NO garantiza ruta bloqueada. Probar acceso por URL directa para cada ruta restringida.

---

## 🚀 COMANDOS ÚTILES

```bash
# Deploy frontend a Surge
cd frontend && npm run build && cd dist && surge --domain belleza-demo.surge.sh

# Deploy backend a Railway (auto desde push a main)
cd backend && railway up

# Ver estado Railway
cd backend && railway status

# Seed de datos demo
cd scripts && python3 seed_data.py

# Token Airtable actual
cat backend/.env | grep AIRTABLE
```

---

## 🧠 FILOSOFÍA DEL PROYECTO

1. **No-code backend**: Airtable es la "base de datos". FastAPI solo expone/protege.
2. **Seguridad estricta**: Tokens NUNCA al frontend. `AirtableClient` Python wrapper.
3. **Contratos antes que código**: Ninguna feature sin definir el contrato API.
4. **Mobile first**: Todo el frontend responsive, probado en móvil.
5. **No borrar datos**: Estados (CANCELADA, REPROGRAMADA) en vez de DELETE.
6. **by_name=True**: Los linked fields de Airtable se devuelven como nombres para el frontend (no IDs).

---

## ⚡ ARRANQUE RÁPIDO PARA CODEX

```bash
# 1. Clonar
git clone https://github.com/grupoprosperyn8n/sistema-marca-blanca-multirrubro.git
cd sistema-marca-blanca-multirrubro

# 2. Backend (Python 3.11)
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Crear .env con las variables de arriba
uvicorn main:app --reload --port 8000

# 3. Frontend (React)
cd frontend
npm install
npm run dev

# 4. Probar login QA
# Usuario: qaportal3b@bellezapro.test / qatest99
```

---

**⚠️ IMPORTANTE**: No modificar `CREDENCIALES.md`, `.env`, fábrica madre (`erp-saas-aionui-workspace/`), ni archivos de auth/core sin revisar con Diego. No exponer tokens en logs/respuestas públicas.

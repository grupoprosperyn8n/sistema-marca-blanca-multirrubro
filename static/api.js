/**
 * ═══════════════════════════════════════════════════════════
 * LEGACY API — RETIRED (2026-06-20)
 * ═══════════════════════════════════════════════════════════
 *
 * Este archivo existía como conector directo Airtable ↔ frontend,
 * con token global, CRUD desde navegador y proxy n8n hardcodeado.
 *
 * Fue eliminado accidentalmente durante FASE_1H_G y NO se reconstruye
 * con lógica funcional por decisión de seguridad.
 *
 * ESTADO ACTUAL:
 *   - La app React consume el backend FastAPI vía VITE_API_BASE_URL.
 *   - El endpoint público es: GET /api/productos-web (Railway).
 *   - No hay conexión directa frontend ↔ Airtable.
 *
 * PROPÓSITO DE ESTE STUB:
 *   - Preservar la ruta /api.js para evitar 404s en logs.
 *   - Documentar la decisión de arquitectura.
 *   - Evitar que alguien reintroduzca Airtable directo en frontend.
 *
 * ⚠️  NO AGREGAR:
 *   - Tokens
 *   - AIRTABLE_CONFIG
 *   - Base IDs
 *   - URLs n8n
 *   - fetch() a api.airtable.com
 *   - CRUD
 *   - window.__AIRTABLE_TOKEN__
 *
 * Si aparece un backup real del archivo original, se restaurará
 * como artefacto histórico aislado, SIN reactivar su lógica.
 * ═══════════════════════════════════════════════════════════
 */

window.LegacyApiRetired = true;
console.info(
  '[legacy] static/api.js — RETIRED.',
  'Backend: VITE_API_BASE_URL → FastAPI Railway.',
  'Ver docs/incidents/INCIDENT_STATIC_API_JS.md'
);

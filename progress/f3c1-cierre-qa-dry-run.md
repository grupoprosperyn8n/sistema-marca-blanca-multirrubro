# FASE 3C1 — CIERRE QA DRY-RUN AGENDA_SLOTS

**Fecha:** 2026-06-24  
**Rol:** QA Portal 3B (qaportal3b@bellezapro.test)  
**Frontend:** https://sistema-multirrubro-demo.surge.sh  
**Backend:** https://earnest-comfort-production-3d75.up.railway.app  

---

## Objetivo

Validar el flujo completo del modal "Reservar Turno" usando únicamente `AGENDA_SLOTS` como tabla canónica, sin crear `CITAS` reales ni modificar slots. Confirmar que:
1. El modal carga servicios, sucursales y slots correctamente
2. El dry-run (`POST /api/clientes/citas/dry-run`) funciona
3. El dry-run NO crea registros ni modifica estado

---

## 1. Bug Detectado y Corregido

**Bug:** El endpoint `/api/agenda-slots` responde con `{agenda_slots: [...]}`, pero el frontend leía `data.slots` → siempre vacío → 0 slots visibles.

**Fix:** Línea 86 de `ReservaTurnoModal.jsx`:
```js
// Antes:
const available = (data.slots || []).filter(...)
// Después:
const available = (data.agenda_slots || data.slots || []).filter(...)
```

**Deploy:** Surge `sistema-multirrubro-demo.surge.sh` con hash `index-DOQn4YcX.js`.

---

## 2. Slots Demo Creados

| Campo | Valor |
|---|---|
| Tabla | `AGENDA_SLOTS` |
| Servicio | COLORACION GLOBAL (`rec5N2yqnAO56xRGI`) |
| Sucursal | CENTRO_PELUQUERIA (`rec9eQyuzpZjlDrkY`) |
| Profesional | `rec0gxS62WYnfPR2e` |
| Fechas | 24, 25, 26 Jun 2026 |
| Horarios | 10:00, 11:00, 12:00, 15:00, 16:00 |
| Total | 15 slots |
| ESTADO_SLOT | `DISPONIBLE` |
| TIPO_SLOT | `DISPONIBLE` |
| PERMITE_RESERVA_WEB | `true` |
| ACTIVO | `true` |
| ACTIVO_WEB | `true` |
| CAPACIDAD_DISPONIBLE | `1` |
| OBSERVACIONES | `QA_DEMO_FASE_3C1` |
| ORIGEN | `WEB` |
| DURACION_MINUTOS | `60` |

IDs demo: `recNMXzYPWIpsrJMa`, `reckc07upcLZY0g3T`, `reckcnaPQXdfolXJO`, `rec19UJMx6XpCBwtn`, `recSsnO65WNlVUsr3`, `rec0C4pqmhUeJPaRU`, `rec8zqH7owaz66k5g`, `recfUjE9cgQ1YCdG5`, `recOkaV4HY9CaG7p9`, `recbnpPQYNMRN7xIL`, `recYPCYfEpW7u8tEY`, `recvyLfS8GopWQrf1`, `recCqc0f0KhivX4im`, `recQWl2hXEp1FOK1L`, `recNXl5mCfjB7W2zM`

---

## 3. Smoke Visual

| Paso | Resultado |
|---|---|
| Modal abre desde "📞 Reservar Turno" | ✅ |
| Paso 1: Servicios — COLORACION GLOBAL $8.000 visible | ✅ |
| Paso 2: Sucursales — CENTRO_PELUQUERIA visible | ✅ |
| Paso 3: Horarios — 28 slots visibles (13 existentes + 15 demo) | ✅ |
| Slots demo Jun 24-26 con horarios correctos | ✅ |

---

## 4. Dry-Run API

**Request:**
```
POST /api/clientes/citas/dry-run
{
  "slot_id": "recNMXzYPWIpsrJMa",
  "servicio_web_id": "rec5N2yqnAO56xRGI",
  "sucursal_id": "rec9eQyuzpZjlDrkY"
}
```

**Response (HTTP 200):**
```json
{
  "disponible": true,
  "dry_run": true,
  "mensaje": "Turno disponible. Listo para confirmar en la próxima etapa.",
  "nota": "Ningún registro fue creado ni modificado. Esto es un dry-run.",
  "errores": null,
  "detalle": {
    "cliente_id": "recE9NNLvCgpOFxZU",
    "servicio": {
      "id": "rec5N2yqnAO56xRGI",
      "nombre": "COLORACION GLOBAL",
      "precio_web": 8000,
      "servicio_canonico_id": "recHxSAbTxNVEymO5"
    },
    "slot": {
      "id": "recNMXzYPWIpsrJMa",
      "fecha": "2026-06-24",
      "hora_inicio": "10:00",
      "hora_fin": "11:00",
      "duracion_minutos": 60
    },
    "sucursal": {
      "id": "rec9eQyuzpZjlDrkY",
      "nombre": "SUCURSAL_CENTRO_PELUQUERIA_FICTICIA"
    }
  }
}
```

---

## 5. Validación Post Dry-Run

| Métrica | Pre Dry-Run | Post Dry-Run | Delta |
|---|---|---|---|
| CITAS | 10 | 10 | 0 ✅ |
| AGENDA_SLOTS | 32 | 32 | 0 ✅ |
| Slot recNMXz... ESTADO_SLOT | DISPONIBLE | DISPONIBLE | sin cambio ✅ |
| Slot recNMXz... CAPACIDAD_DISPONIBLE | 1 | 1 | sin cambio ✅ |
| CITAS vinculadas al slot | 0 | 0 | 0 ✅ |

---

## 6. Conclusión

✅ **FASE_3C1 CERRADA.** El flujo completo funciona:
- Modal carga servicios → sucursales → slots
- Dry-run valida disponibilidad sin efectos secundarios
- No se crean CITAS ni se modifican AGENDA_SLOTS
- Próximo paso: FASE_3C2 (confirmación real de turno)

---

## Notas Técnicas

- **React 18 production** no responde a `dispatchEvent` + `click()` nativo en divs con onClick JSX. Los `<button>` sí responden a `click()` nativo. Para automatización futura, usar `browser_click` de Playwright/Puppeteer o acceder a React internals vía fiber.
- El `fetchWithCookie` en el frontend usa `credentials: "include"` contra Railway. Surge y Railway son dominios diferentes, pero CORS + cookies están configurados correctamente.

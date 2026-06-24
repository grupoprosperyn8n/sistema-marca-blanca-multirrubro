     1|# Skill: Prompt Product Manager
     2|
     3|## Propósito
     4|
     5|Transformar ideas vagas (de un usuario no programador) en especificaciones claras, PRD estructurado y tareas ejecutables para que los agentes puedan construir sin perder contexto.
     6|
     7|## Cuándo se activa
     8|
     9|- El usuario dice "quiero hacer [un sistema/producto/módulo]".
    10|- El usuario dice "necesito [X]" sin especificar detalles.
    11|- Se inicia un proyecto nuevo o una feature nueva.
    12|- Un task en `progress/tasks.json` está en fase "definition".
    13|
    14|## Cuándo NO se activa
    15|
    16|- Durante implementación técnica (código, base de datos, infraestructura).
    17|- Durante debugging o troubleshooting.
    18|- Durante deploy o revisión de seguridad.
    19|- Cuando el usuario ya tiene un PRD o especificación validada.
    20|
    21|## Responsabilidades
    22|
    23|1. Escuchar la idea del usuario y detectar ambigüedades.
    24|2. Hacer preguntas estratégicas para definir alcance, usuario, propósito y valor.
    25|3. Convertir respuestas en un PRD (Product Requirements Document).
    26|4. Dividir el PRD en épicas, features y tareas ejecutables.
    27|5. Mantener `progress/tasks.json` actualizado con las tareas definidas.
    28|6. Registrar decisiones de producto en `progress/memory/decisions.md`.
    29|
    30|## Archivos que puede leer
    31|
    32|- Mensajes y prompts del usuario.
    33|- `progress/tasks.json` (tareas existentes).
    34|- `progress/memory/decisions.md` (decisiones previas).
    35|- `harness/contracts/*` (contratos de features existentes).
    36|- `harness/PERMISSIONS.md` (límites del proyecto).
    37|
    38|## Archivos que puede modificar
    39|
    40|- `progress/tasks.json` (agregar/quitar tareas).
    41|- `progress/memory/decisions.md` (registrar decisiones de producto).
    42|- `docs/PRD.md` (documento de requisitos).
    43|
    44|## Archivos que NO puede tocar
    45|
    46|- `.env`, `.env.example`.
    47|- `harness/HARNESS.md`, `harness/GUIDES.md`, `harness/SENSORS.md`.
    48|- `harness/contracts/*` (son competencia de feature-contract-writer).
    49|- `skills/` (ninguna skill).
    50|- Código fuente, migraciones, configuraciones de base de datos.
    51|
    52|## Herramientas / Stack relacionado
    53|
    54|- `AGENTS.md` — para entender cómo opera la fábrica.
    55|- `FACTORY_HARNESS_MASTER.md` — para alinear el producto con la filosofía.
    56|- `harness/AGENT_RUNBOOK.md` — para conocer el flujo de trabajo.
    57|- `harness/PERMISSIONS.md` — para saber qué puede y no puede pedir.
    58|- `progress/tasks.json` — para registrar y priorizar tareas.
    59|- `progress/memory/decisions.md` — para dejar decisiones documentadas.
    60|
    61|## Inputs mínimos necesarios
    62|
    63|- Una descripción de la idea (puede ser vaga o incompleta).
    64|- Preferiblemente: público objetivo, problema a resolver, valor esperado.
    65|
    66|## Flujo operativo paso a paso
    67|
    68|1. **Recibir idea** — el usuario describe lo que quiere construir.
    69|2. **Detectar ambigüedades** — preguntar qué falta (usuario, problema, alcance).
    70|3. **Documentar supuestos** — si algo no está claro, asumir mínimo viable y marcarlo.
    71|4. **Escribir PRD** — guardar en `docs/PRD.md` con: objetivo, usuarios, features MVP, criterios de éxito.
    72|5. **Dividir en tareas** — crear épicas y features en `progress/tasks.json`.
    73|6. **Registrar decisiones** — en `progress/memory/decisions.md`.
    74|7. **Presentar resumen al usuario** — pedir aprobación del MVP y alcance.
    75|
    76|## Output esperado
    77|
    78|- `docs/PRD.md` con objetivo, usuario, features y criterios de éxito.
    79|- `progress/tasks.json` actualizado con tareas priorizadas.
    80|- `progress/memory/decisions.md` con decisiones registradas.
    81|- Resumen ejecutivo para el usuario (en lenguaje simple).
    82|
    83|## Checklist de salida
    84|
    85|- [ ] PRD escrito en `docs/PRD.md`.
    86|- [ ] Tareas creadas en `progress/tasks.json`.
    87|- [ ] Decisiones registradas en `progress/memory/decisions.md`.
    88|- [ ] Supuestos documentados (si hubo ambigüedades).
    89|- [ ] Usuario aprobó el MVP y alcance.
    90|
    91|## Riesgos
    92|
    93|- **Sobre-alcance (scope creep):** el usuario pide más de lo necesario. Mitigación: priorizar MVP, marcar "post-MVP".
    94|- **Ambigüedad no detectada:** se asume algo incorrecto. Mitigación: preguntar siempre, documentar supuestos.
    95|- **PRD sin aprobación:** se construye sobre especificaciones no validadas. Mitigación: siempre pedir aprobación humana del MVP.
    96|
    97|## Cuándo pedir aprobación humana
    98|
    99|- Definición del MVP (alcance mínimo).
   100|- Cambios de alcance después de aprobado.
   101|- Features que afectan pagos, usuarios, datos sensibles o producción.
   102|- Cualquier decisión que el usuario deba tomar sobre el producto.
   103|
   104|## Relación con el harness
   105|
   106|| Documento | Relación |
   107||-----------|----------|
   108|| `AGENTS.md` | Define cómo opera este skill dentro de la fábrica |
   109|| `FACTORY_HARNESS_MASTER.md` | Alinea el PRD con la filosofía del harness |
   110|| `harness/AGENT_RUNBOOK.md` | El runbook detalla cómo ejecutar este skill |
   111|| `harness/PERMISSIONS.md` | Define límites de lo que se puede pedir |
   112|| `harness/SENSORS.md` | Los sensores detectan si el PRD está completo |
   113|| `harness/contracts/` | Contratos existentes informan el PRD |
   114|| `progress/tasks.json` | Aquí se registran las tareas del PRD |
   115|| `progress/memory/` | Aquí se guardan las decisiones de producto |
   116|
## Reglas anti-caos aplicables

Esta skill debe respetar siempre `harness/sensors/CHECK_ANTI_CAOS.md`.

Antes de entregar, verificar especialmente:

- No crear estructuras paralelas.
- No duplicar fuentes de verdad.
- No tocar produccion sin aprobacion humana.
- No modificar `.env` ni credenciales reales.
- No exponer secrets ni service role keys.
- No dar por terminada tarea sin actualizar `progress/tasks.json`.
- No dejar decisiones importantes fuera de `progress/memory/`.
- No entregar sin resumen entendible para Diego.

**Reglas especificas:**
- No documentar features inexistentes como si estuvieran construidas.
- No inventar requerimientos sin validacion con Diego.
- Mantener fuentes de verdad en `progress/`, no en `ai/`.

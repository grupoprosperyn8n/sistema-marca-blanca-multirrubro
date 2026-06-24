     1|# Skill: Harness Engineer
     2|
     3|## Propósito
     4|
     5|Diseñar, mantener y mejorar el harness operativo del proyecto: guías, sensores, contratos, permisos, reglas, checklists y memoria. Es la skill que mantiene el sistema de control funcionando.
     6|
     7|## Cuándo se activa
     8|
     9|- Después de completar una feature (revisar si hizo falta mejorar el harness).
    10|- Cuando ocurre un error repetido (2+ veces) que debería convertirse en regla o sensor.
    11|- Al inicio de una nueva fase del proyecto (para preparar el harness).
    12|- Cuando el usuario pide explícitamente "mejorar el harness" o "revisar guías".
    13|- Cuando un sensor detecta que un documento del harness está desactualizado.
    14|- Cuando se crea un nuevo contrato que requiere nuevo sensor o guía.
    15|
    16|## Cuándo NO se activa
    17|
    18|- Durante la implementación de features (construir producto).
    19|- Durante debugging de código (corregir bugs).
    20|- Durante definición de producto (es competencia de prompt-product-manager).
    21|- Cuando la tarea es puramente técnica sin impacto en el harness.
    22|- No construir features directamente.
    23|
    24|## Responsabilidades
    25|
    26|1. Crear y mantener guías operativas en `harness/guides/`.
    27|2. Crear y mantener sensores en `harness/sensors/` (detectan errores, estado, cumplimiento).
    28|3. Crear y mantener contratos base en `harness/contracts/`.
    29|4. Crear y mantener checklists y runbooks en `harness/`.
    30|5. Mejorar `harness/PERMISSIONS.md` cuando se identifican nuevos riesgos.
    31|6. Detectar fallas repetidas y convertirlas en reglas del harness.
    32|7. Mantener `harness/HARNESS.md` (visión general del harness).
    33|8. Mantener `harness/SENSORS.md` (catálogo de sensores activos).
    34|9. Mantener `harness/FAILURE_LOG.md` (registro de fallas y su resolución).
    35|10. Mantener `harness/AGENT_RUNBOOK.md` (cómo operan los agentes).
    36|11. Mantener `harness/RELEASE_CHECKLIST.md` (checklist de deploy y release).
    37|
    38|## Archivos que puede leer
    39|
    40|- TODOS los archivos del proyecto (para diagnosticar y mejorar).
    41|- `harness/*` — todos los documentos del harness.
    42|- `progress/memory/` — decisiones, bugs, preferencias, preguntas abiertas.
    43|- `progress/tasks.json` — estado de tareas.
    44|- `harness/contracts/*` — contratos de features (para validar cumplimiento).
    45|- Toda la estructura de carpetas del proyecto.
    46|
    47|## Archivos que puede modificar
    48|
    49|- `harness/HARNESS.md`.
    50|- `harness/GUIDES.md` → `harness/guides/*` (archivos de guías individuales).
    51|- `harness/SENSORS.md` → `harness/sensors/*` (archivos de sensores individuales).
    52|- `harness/PERMISSIONS.md`.
    53|- `harness/FAILURE_LOG.md`.
    54|- `harness/AGENT_RUNBOOK.md`.
    55|- `harness/RELEASE_CHECKLIST.md`.
    56|- `harness/contracts/` (solo contratos base y templates).
    57|- `progress/memory/` (actualizar reglas derivadas de fallas).
    58|
    59|## Archivos que NO puede tocar
    60|
    61|- `.env`, `.env.example`.
    62|- `docs/PRD.md` (es competencia de prompt-product-manager).
    63|- `progress/tasks.json` (es competencia de prompt-product-manager).
    64|- `skills/` (ninguna skill — necesita aprobación separada).
    65|- Código fuente del producto, migraciones, configuraciones de base de datos.
    66|- `supabase/`, `airtable/`, `n8n/`.
    67|
    68|## Herramientas / Stack relacionado
    69|
    70|- `FACTORY_HARNESS_MASTER.md` — filosofía y estructura del harness.
    71|- `AGENTS.md` — cómo operan los agentes en la fábrica.
    72|- `harness/AGENT_RUNBOOK.md` — runbook actual que puede necesitar mejora.
    73|- `harness/PERMISSIONS.md` — permisos actuales que pueden necesitar expansión.
    74|- `harness/SENSORS.md` — sensores actuales que pueden necesitar nuevos.
    75|- `harness/FAILURE_LOG.md` — historial de fallas para detectar patrones.
    76|- `progress/memory/decisions.md` — decisiones previas que afectan el harness.
    77|
    78|## Inputs mínimos necesarios
    79|
    80|- Contexto: ¿qué disparó la activación? (error repetido, nueva fase, feature completada, solicitud del usuario).
    81|- Estado actual del harness (qué documentos existen, cuáles están desactualizados).
    82|
    83|## Flujo operativo paso a paso
    84|
    85|1. **Identificar necesidad** — ¿error repetido, nueva fase, feature completada, solicitud explícita?
    86|2. **Analizar causa raíz** — si es un error, entender por qué ocurrió y cómo prevenirlo.
    87|3. **Diseñar mejora** — ¿nuevo sensor, nueva regla, nueva guía, actualización de permiso?
    88|4. **Implementar cambio** — crear o modificar el documento del harness correspondiente.
    89|5. **Verificar** — ¿el cambio resuelve el problema? ¿No rompe nada existente?
    90|6. **Registrar** — documentar la mejora en `progress/memory/decisions.md`.
    91|7. **Presentar al usuario** — explicar qué cambió y por qué.
    92|
    93|## Output esperado
    94|
    95|- Documentos del harness actualizados (guías, sensores, permisos, contratos, runbook, failure log).
    96|- Reporte de mejora: qué se cambió, por qué, qué riesgo mitiga.
    97|
    98|## Checklist de salida
    99|
   100|- [ ] Necesidad identificada y documentada.
   101|- [ ] Causa raíz analizada (si aplica).
   102|- [ ] Documento(s) del harness actualizado(s).
   103|- [ ] Cambio verificado (no rompe nada existente).
   104|- [ ] Registrado en `progress/memory/decisions.md`.
   105|- [ ] Usuario informado del cambio.
   106|
   107|## Modo Mantenimiento de Fábrica

### Cuándo se activa

Se activa cuando Diego dice:
- revisar fábrica
- mantener harness
- arreglar starter pack
- corregir manual export
- corregir init.sh
- revisar prompts de inicio
- actualizar Factory Harness
- cerrar versión
- preparar release
- validar flujo manual → ZIP → fábrica → agente

### Responsabilidades

1. Auditar estructura de la fábrica.
2. Verificar que `bash harness/init.sh` funcione.
3. Verificar starter pack.
4. Verificar exportación desde manual.
5. Verificar que no exista `harness/harness/init.sh`.
6. Verificar `PROYECTO.md`, `CREDENCIALES.md`, `COMANDO.txt`, `inicio-rapido/`.
7. Verificar `MANUAL_EXPORT_MODE`.
8. Verificar `progress/session-summary.md`.
9. Verificar prompts rápidos.
10. Verificar reglas anti-caos.
11. Verificar `.gitignore`.
12. Verificar que no se suban secretos.
13. Recomendar cambios mínimos.
14. Registrar decisiones.

### Prohibiciones

- No tocar `.env`.
- No imprimir secretos.
- No borrar `CREDENCIALES.md`.
- No romper el manual web.
- No hacer deploy sin aprobación.
- No modificar `init.sh` sin diagnóstico.
- No cambiar estructura estable sin motivo.
- No crear skills nuevas si puede resolverse con `harness-engineer`.

### Checklist de salida

- [ ] init.sh OK.
- [ ] Starter pack OK.
- [ ] Proyecto exportado OK.
- [ ] session-summary.md presente.
- [ ] CREDENCIALES.md protegido.
- [ ] prompts rápidos alineados.
- [ ] anti-caos vigente.
- [ ] changelog actualizado.
- [ ] commit recomendado.

### Guía de referencia

Ver `harness/guides/FACTORY_MAINTENANCE.md` para el flujo completo de mantenimiento.


## Riesgos
   108|
   109|- **Sobre-ingeniería:** crear reglas/sensores para errores que no se repiten. Mitigación: esperar 2+ ocurrencias antes de crear una regla.
   110|- **Romper referencias existentes:** cambiar un documento que otros skills/agentes referencian. Mitigación: actualizar todas las referencias en el mismo cambio.
   111|- **Permisos demasiado restrictivos:** bloquear operaciones legítimas. Mitigación: revisar cambios de permisos con el usuario.
   112|- **Harness desactualizado:** mejorar solo una parte y olvidar las dependencias. Mitigación: checklist obligatorio de archivos a actualizar.
   113|
   114|## Cuándo pedir aprobación humana
   115|
   116|- Cambios en `harness/PERMISSIONS.md` (especialmente si restringen o amplían permisos).
   117|- Creación de nuevos sensores que afectan el flujo de trabajo de agentes.
   118|- Cambios en `harness/AGENT_RUNBOOK.md` que modifican el flujo operativo.
   119|- Eliminación o fusión de documentos del harness.
   120|- Cualquier cambio que afecte cómo los agentes interactúan con el proyecto.
   121|
   122|## Relación con el harness
   123|
   124|| Documento | Relación |
   125||-----------|----------|
   126|| `AGENTS.md` | Define cómo opera este skill dentro de la fábrica |
   127|| `FACTORY_HARNESS_MASTER.md` | Documento fuente de la filosofía del harness |
   128|| `harness/AGENT_RUNBOOK.md` | Este skill mantiene y mejora el runbook |
   129|| `harness/PERMISSIONS.md` | Este skill mantiene y mejora los permisos |
   130|| `harness/SENSORS.md` | Este skill crea y mantiene los sensores |
   131|| `harness/contracts/` | Este skill crea contratos base y templates |
   132|| `progress/tasks.json` | Las tareas reflejan el estado del harness |
   133|| `progress/memory/` | Decisiones sobre el harness se registran aquí |
   134|
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
- No crear estructuras paralelas si ya existe estructura definida.
- No duplicar fuentes de verdad entre `harness/` y otros directorios.
- No modificar `init.sh` sin plan y aprobacion.

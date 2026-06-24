# 🔒 Revisión de Seguridad

Pega esto en tu agente desde la raíz del proyecto:

```
Ejecuta bash harness/init.sh.
Lee progress/session-summary.md si existe (contexto compacto).
Lee PROYECTO.md y harnees/PERMISSIONS.md.
Lee harnees/sensors/CHECK_ANTI_CAOS.md.
Revisa: secretos expuestos, service role key en frontend, RLS configurado, autenticación, errores en n8n.
Reporta hallazgos con severidad (crítico, alto, medio, bajo).
Propón plan de remediación.
Si existe CREDENCIALES.md, es sensible — NO muestres secretos.
Al terminar, actualizá progress/session-summary.md con resumen corto de estado, próxima tarea y riesgos.
```

# Verificación de producción — 2 de octubre de 2026

## Git y plataforma

- Repositorio remoto: https://github.com/dyann1984/machtia-adaptive-tutor
- El remoto ya contenía `9c910bf0829770139b092220cb9dae9478fb37b8` al comprobarlo mediante `git ls-remote`; push sin force devolvió `Everything up-to-date`.
- SHA final después de corregir el 404: `30b0b8e96e6e0d6e3f14bd51463c8d3f5af6b3df`.
- `HEAD`, `origin/main` y `refs/heads/main` remoto coinciden. El SHA final conserva `9c910bf` como ancestro.
- Servicio Render existente: `srv-datcvj2d0e5s73bjorbg`.
- Blueprint existente: `exs-datcud1srm7s7387k5hg`.
- Deployment final: `dep-davuslbtqb8s73dt10s0`, **Deploy succeeded | Live**, SHA `30b0b8e`, trigger Blueprint, duración 1m46s.
- El historial Render confirma despliegues anteriores de `5176f64` y `9ea48db`; Render sí era la plataforma existente.
- La cuenta Vercel conectada no tiene proyectos. Su URL documentada es un placeholder que devuelve 404 `DEPLOYMENT_NOT_FOUND`.

## Corrección

La URL existente devolvía `{"error":"Endpoint not found","path":"/"}` en `/?demo=judge` porque el blueprint arrancaba solamente MCP. Se actualizó el mismo servicio para construir Next.js y servir web, assets y MCP en `$PORT`, con URL MCP y CORS del dominio existente. No se creó otro proyecto, servicio ni dominio. No se realizó force push.

URL pública verificada: https://machtia-tutor-mcp-server.onrender.com/?demo=judge

## Validación

- Typecheck y build Next.js de producción: PASS.
- 67 tests existentes y dos tests nuevos de rutas web/MCP: PASS.
- HTTP público `/?demo=judge`: 200; `/health`: ok, 15 herramientas, protocolo 2025-11-25.
- MCP público: 24 llamadas comprobadas, handshake, listado de las 15 herramientas, diagnóstico, generación, asignación, contexto, inicio, error, pista, explicación alternativa, recuperación oral, cinco respuestas, finalización, recuperación de evidencia, progreso docente y rechazo IDOR. Resultado: 100% calculado.
- Navegador en producción: generación y asignación por Tutor IA, descubrimiento guiado con barras, comprensión de equivalencia, tres errores deliberados, recuperación y cinco ejercicios (tarjetas, chocolate, comparación, productos cruzados escritos y simplificación escrita).
- Resultado web observado: 52% → 100%, +48 puntos, 5/5 aciertos, ocho intentos, una pista y dos re-explicaciones. Evidencia docente muestra los mismos contadores y conceptos derivados de la práctica.
- Alexa+ en navegador: contexto remoto, inicio, respuesta “dos cuartos” y finalización con una respuesta correcta: 20%, sin aciertos adicionales prefabricados.
- Recarga directa de `?demo=judge`: vuelve a la vista docente y al escenario de demostración.
- Móvil 390×844: ancho de documento 385 px para viewport 390 px; imagen oficial cargada. Se restauró el viewport normal.
- Consola de navegador: sin errores ni warnings observados.

Comprobantes locales: `docs/evidence/production-mcp-smoke.json`, `production-teacher-evidence.jpg`, `production-mobile-judge.jpg`, `production-judge-ready.jpg` y `render-deployment-live.jpg`.

## Límites

No hay bloqueo externo de login, MFA o permisos. La URL se verificó en el servicio existente de Render; no se accedió al formulario del concurso para certificar qué URL se envió. La cuenta gratuita Render puede dormir por inactividad. La evidencia MCP permanece en memoria del servidor; el expediente web usa localStorage. La calidad audible de voz y un dispositivo físico Alexa no se certificaron.

Los cambios locales previos de documentación, imágenes y scripts se conservaron sin incluirlos en el commit de deployment. Este informe y los comprobantes son artefactos locales posteriores al despliegue.

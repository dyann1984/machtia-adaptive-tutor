# MACHTIA — informe final de producción

Fecha de verificación: 2026-10-05.

**SUBMISSION READY: NO**  
**JUDGE READY técnico: YES, dentro del alcance de demo sintética**  
**SCORE: 90/100 (estimación de esta revisión, no puntuación oficial del concurso).**

La reparación, publicación y verificación técnica están terminadas. El NO de submission corresponde a entregables externos y procedencia de assets aún no acreditados, no a un fallo observado del ciclo principal.

## Publicación y deployment

- Producción: https://machtia-tutor-mcp-server.onrender.com/?demo=judge
- Commit local, remoto y desplegado: `c2ea9d2a152ae112900daa5c0d754faa8a451d02`.
- Árbol publicado: `8ce35c241549e6c70ec3be08fc7a1e4c3ca0c7f5`.
- Exactamente 63 archivos publicados. Los cambios previos de artwork, docs/screenshots y scripts de captura excluidos permanecen intactos fuera del commit.
- El conector GitHub rechazó escritura con 403. La publicación se realizó con el Git ya instalado en el runtime de Codex; no se ampliaron permisos ni se desactivó Windows Application Control.
- CI: SUCCESS. https://github.com/dyann1984/machtia-adaptive-tutor/actions/runs/37383755447
- `/health` confirma versión 1.1.0, 15 tools, protocolo 2025-11-25, modo determinista y datos demo efímeros.
- Prueba de SHA y deployment: `production/deployment-verification.json`.

## Gates y pruebas reales

| Verificación | Resultado |
|---|---|
| npm ci | PASS |
| Lint | PASS |
| Typecheck | PASS |
| Suite final de unit/integration/security/MCP | 91 ejecutados, 91 PASS, 0 FAIL; nueve archivos |
| E2E compartido local | PASS |
| E2E compartido contra producción, con SDK oficial | PASS |
| Smoke funcional/adversarial de producción | 18 ejecutados, 18 PASS, 0 FAIL |
| Judge Flow visual de producción | PASS |
| Consola de navegador de producción | 0 errores, 0 advertencias observadas |
| Mobile de producción, 390 px | Siete pestañas visibles; documento 385 px, sin overflow horizontal |
| Build | PASS |
| CI Linux: instalación, lint, tipos, tests, E2E, audit runtime y build | Todos los pasos SUCCESS |

Los 91 casos y los 18 adicionales de producción son grupos distintos; los E2E y recorridos visuales se reportan como escenarios, sin inflar el conteo de Vitest ni duplicar las repeticiones de CI. Los fallos intermedios de contratos antiguos se corrigieron antes de estos gates finales.

## Consistencia comprobada en producción

Recorrido visual completo: docente asigna práctica nueva → alumna inicia → explicación interactiva → respuesta incorrecta → pista conceptual y apoyo solicitado → reintento → cinco ejercicios completados → evidencia guardada por servidor → docente consulta → MCP/Alexa simulada recupera el resultado.

| Canal | Resultado final |
|---|---:|
| WEB | 100% |
| TEACHER DASHBOARD | 100% |
| MCP get_practice_result | 100% |
| ALEXA+ SIMULATOR | 100% |

Evidencia del recorrido visual: `evi-4952ea24-e646-4eb0-adad-4f17c67207fa`. Baseline demo 52%, resultado 100%, delta +48 puntos, cinco aciertos, seis intentos, dos pistas/intervenciones. El docente y el simulador muestran ese resultado; las capturas auténticas están en `production/screenshots/`.

Además, el E2E de producción comparó TODOS los campos de los cuatro objetos de evidencia, no solamente el porcentaje. Su sesión independiente produjo `evi-a4fe6cc9-8160-4e0b-862c-bc37dcbd6eac`, con 100/100/100/100, seis intentos, dos pistas y `allFieldsEqual: true`. Esa sesión usó el cliente MCP oficial y queda registrada en `production-shared-evidence.json`. Los IDs diferentes corresponden a sesiones independientes, como exige el aislamiento.

El simulador también fue probado recorriendo sus cinco ejercicios completos antes de publicar, incluyendo error, pista, reintento y evidencia docente; la consulta de evidencia creada por la web fue probada nuevamente en producción. No se encontró una regresión P0/P1 tras el deployment.

## Seguridad y contrato MCP

Comprobaciones de producción rechazaron lectura protegida anónima; intercambio a teacher sin controlador juez; suplantación teacher/system en argumentos; lectura de evidencia de otro alumno; finalización forjada sin intentos; Origin hostil; Accept y JSON-RPC inválidos. Una práctica con QUINCE intentos incorrectos más flags `isCorrect: true` terminó en 0%, no en 100%. Una segunda finalización retornó el mismo evidenceId. Otra sesión juez conservó práctica pending y cero evidencias.

La suite final agrega casos de acceso a apoyos ajenos, IDs de ejercicios arbitrarios/fuera de secuencia, payloads anidados inválidos, body oversized, protocol version inválida, Host spoof sin confianza de Origin, contador de intentos impuesto por servidor, ausencia de baseline, scope de apoyo cuando se repiten IDs de ejercicios, reset de sesión y compatibilidad del SDK oficial.

Los tokens actor son capacidades opacas vinculadas en servidor a una sesión y persona. El controlador juez permite deliberadamente cambiar personas dentro de SU sandbox sintético. El endpoint público de bootstrap crea un sandbox nuevo: no permite acceder al sandbox de otro juez. Esto no constituye autenticación institucional para alumnos reales.

MCP real: 15 tools; Streamable HTTP con respuestas JSON; protocolo 2025-11-25; initialize/list/call verificados con SDK oficial. Accept requiere application/json y text/event-stream; notifications/initialized devuelve 202. GET /mcp devuelve 405 porque no hay stream de eventos no solicitados. Body limitado a 128 KiB. Origin usa lista explícita, sin wildcard ni confianza derivada del Host del cliente.

## P0 / P1 / P2 / P3

- **P0 técnicos corregidos:** autoridad server-side, IDOR/suplantación, aislamiento, calificación basada en intentos, rechazo de cierre incompleto, cierre idempotente, evidencia compartida, eliminación de resultados inventados/fallback de evidencia. **Pendientes detectados en el alcance demo: 0.**
- **P1 técnicos corregidos:** apoyos sin respuesta directa, scope de práctica activa, primera medición sin baseline ficticio, simulador completo, contrato MCP/SDK, dependencias corregibles, WASM seguro en Windows, errores visibles, navegación móvil, documentación y licencia del código. **Pendientes técnicos detectados en el alcance demo: 0.**
- **Pendiente de entrega:** acreditar procedencia/derechos de artwork conservado; está excluido del MIT hasta confirmación. Esto se documenta en `../ASSET_PROVENANCE.md` y no se inventó atribución.
- **P2:** siete hallazgos altos de la cadena DEV de braces/globs/Tailwind/ESLint, con riesgo y mitigación documentados; storage demo efímero de cuatro horas o hasta reinicio. Autenticación institucional y base durable quedan fuera del MVP actual.
- **P3:** refinamiento de microcopy, por ejemplo el botón «Guardar evidencia» cuando el cierre ya la persistió y el botón retorna al docente. No afecta los resultados verificados.

## Dependency audit y licencia

`npm audit --omit=dev`: **0 vulnerabilidades**. `npm audit` completo: **7 high**, concentradas en la cadena DEV a partir de braces 3.0.3; no se declara audit completo limpio. Next 15.5.27, React 19, Vitest 4.1.11, PostCSS 8.5.29. La instalación, suite y build se verificaron con alternativas WASM oficiales en Windows, sin desactivar políticas del sistema. El CI Linux independiente también terminó correctamente.

MIT cubre código y documentación propios; artwork/branding existente mantiene su tratamiento separado. La licencia del código no demuestra por sí sola derechos de todas las imágenes.

## REAL / SIMULATED / DEMO DATA / NOT IMPLEMENTED

- **REAL:** deployment verificado, servidor/15 tools MCP, SDK oficial, ejecución HTTP, publicación docente, normalización de texto oral, capacidades de sesión, intentos registrados, calificación, ledger y evidencia compartida.
- **SIMULATED:** experiencia conversacional Alexa+/Echo, voz por síntesis del navegador; no se afirma despliegue nativo Amazon.
- **DEMO DATA:** escuela, docente, alumnos, diagnósticos y baseline 52%.
- **NOT IMPLEMENTED:** Bedrock/LLM externo, Alexa+ nativa/Echo real, autenticación institucional, storage durable para datos reales. El tutor es determinista y utiliza banco didáctico; no se afirma eficacia educativa en un aula real.

## Judge Flow reproducible

1. Abrir la URL de producción con `?demo=judge`.
2. Crear/asignar práctica desde docente.
3. Entrar como alumno y completar explicación previa.
4. Elegir una opción incorrecta; pedir pista y reintentar.
5. Resolver TODOS los ejercicios y finalizar. También es posible cerrar un ejercicio sin acierto después de tres intentos registrados; ese ejercicio no se cuenta correcto.
6. Consultar evidencia y progreso docente.
7. Abrir Simulación Alexa+, seleccionar esa práctica completada y consultar “How did Mariana do?”.
8. Comparar resultado y evidenceId; para prueba programática reproducible usar el E2E de evidencia compartida.

Las sesiones son aisladas: no comparar un navegador con otro sandbox independiente como si compartieran registros. Un reinicio del servicio o una expiración elimina la sesión efímera; el modo demo puede reiniciarse explícitamente.

## Pendientes externos, separados de la reparación técnica

- **VIDEO:** guion inglés de 2:45 preparado en `../VIDEO_DEMO_SCRIPT.md`; grabación/publicación y enlace público menor a tres minutos no acreditados.
- **FEEDBACK AMAZON:** draft honesto preparado en `../AMAZON_FEEDBACK.md`; revisión y envío por participante pendientes. No se inventó uso de preview tooling.
- **DEVPOST:** borrador preparado en `../DEVPOST_SUBMISSION.md`; entrada final, enlaces y envío no acreditados.
- **OPEN SOURCE MINI CHALLENGE:** opcional y adicional a la submission principal; no se acredita una contribución/proyecto adicional calificante. El repo principal público con MIT no lo satisface automáticamente.
- **ASSETS:** confirmar derechos/procedencia antes de afirmar redistribución libre de todo el artwork.

Estos pendientes impiden declarar SUBMISSION READY: YES, aunque el ciclo técnico de demo esté verificado y publicado.

## Método del score

Funcionalidad 20/20; consistencia 20/20; seguridad/MCP del alcance demo 20/20; ingeniería/dependencias 10/12; UX/judge flow 10/10; documentación/entrega 10/18. Total 90/100. Es una estimación transparente de preparación, no certificación de seguridad ni resultado oficial de jueces.

Las evidencias post-deployment son artefactos locales generados DESPUÉS del commit c2ea9d2; se entregan junto al informe. No se añadieron a otro commit para alterar el SHA del deployment ya validado. El código del pase no cambió después de su publicación.

# MACHTIA — AMAZON BUILD, SHIP, SHAPE
# FINAL READINESS AUDIT

Fecha: 5 de octubre de 2026, America/Mexico_City. Auditoría del working tree, no solo de HEAD. No se modificó código de aplicación, arquitectura, tests, visibilidad de GitHub ni producción.

## 1. VERDICT

**NOT READY**.

Existe un prototipo web funcional y un servidor MCP ejecutable. Sin embargo, el resultado del alumno no se sincroniza al repositorio MCP, las calificaciones MCP aceptan aciertos suministrados por el cliente, el simulador solo resuelve el primer ejercicio, no hay autenticación real, falta licencia en un repositorio público y no consta video final.

Baseline: `L:\HACK DEV\MACHTIA TUTOR`; rama `main`; HEAD `aae547202c8b0d4c2a8514a4fc2778efffc20003`. Origin: `https://github.com/dyann1984/machtia-adaptive-tutor.git`. API pública de GitHub confirmó `private:false` y el mismo SHA en `main`. El baseline ya contenía 13 archivos modificados y 15 entradas no rastreadas, algunas directorios completos. Ver `baseline-status.txt` y `baseline-head.txt`. Las modificaciones locales previas no están acreditadas como publicadas.

`package.json`: machtia-adaptive-tutor 1.0.0. Versiones resueltas en lockfile: Next.js 14.2.35, React 18.3.1, TypeScript 5.9.3, Vitest 2.1.9, MCP SDK 1.30.1. Runtime usado: Node 22.23.2. App Router, Tailwind CSS; estructura `app/`, `components/`, `features/teacher/`, `features/student/`, `lib/{ai,data,learning,mcp,tools,context}/`, `mcp/server/`, `tests/`, `scripts/`, `docs/`, `public/`. Sin AGENTS.md encontrado en el inventario del repositorio ni en los ancestros consultados.

Configuración: `.env.example` disponible; no existen `.env` ni `.env.local` en la raíz. Modo mock no requiere credenciales. `NEXT_PUBLIC_MCP_URL` identifica el endpoint, `MCP_PORT`/`PORT` el puerto; `MCP_ALLOWED_ORIGINS`, `JUDGE_DEMO`, `NEXT_PUBLIC_JUDGE_DEMO` configuran demo/despliegue. También se consumen `MCP_HOST`, `MCP_URL`, `NEXT_PUBLIC_FORCE_REAL_MCP`. El adapter Amazon lee `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BEDROCK_API_KEY`, `AWS_BEDROCK_MODEL_ID`; el example usa incorrectamente `AMAZON_REGION`/`AMAZON_ACCESS_KEY_ID`/`AMAZON_SECRET_ACCESS_KEY`. Esas credenciales no habilitan una inferencia real en el código actual.

README e instrucciones presentes; LICENSE ausente. Render configurado mediante `render.yaml`: `npm ci --include=dev && npm run build`, `npm run start:render`, frontend y MCP en el mismo puerto. URL efectiva documentada: `https://machtia-tutor-mcp-server.onrender.com/?demo=judge`.

## 2. READINESS SCORE

**52/100**, estimación técnica, no puntuación oficial. Flujo 18/25; integración 13/20; seguridad 4/20; validación 9/15; submission 7/15; open source 1/5. Los bloqueos prevalecen sobre el número.

## 3. AMAZON/ALEXA+ INTEGRATION

| Elemento | Estado real | Evidencia |
|---|---|---|
| MCP autohospedado | REAL, conformidad parcial | `mcp/server/{index,transport,tools,schemas}.ts`; HTTP POST/GET `/mcp`, GET `/health`; 15 herramientas; cliente SDK oficial conectó y listó 15 |
| Llamadas web a MCP | REAL | `lib/mcp/client.ts`; respuestas HTTP y normalización comprobadas |
| Alexa+/Echo Show | SIMULATED | `components/AlexaPlusSimulatorModal.tsx`; frontend propio, sin SDK Amazon, hardware ni sesión nativa Alexa+ |
| Orquestación/LLM | MOCK | `lib/ai/providers.ts`, `lib/ai/tutor-agent.ts`: reglas y respuestas deterministas |
| Bedrock y Nebius | NOT IMPLEMENTED como inferencia | `AmazonProvider.decideToolCall` llama MockAIProvider; `generateResponse` concatena texto; no llamada SDK/API |
| Voz | DEMO-ONLY | Web Speech synthesis en el tutor web; simulador usa botones/texto de frases, sin reconocimiento de micrófono. Su rótulo de voz sintetizada no prueba audio en ese modal |
| Diagnósticos/alumnos | MOCK | `lib/data/mock-data.ts`: semilla escolar y evidencias iniciales |
| Intentos/pistas/resultado web | REAL sobre datos demo | Recorrido interactivo de esta auditoría: 5/5 aciertos, 6 intentos, 1 pista, 100% |

Tools reales: analyze_student_performance, find_students_needing_support, get_student_learning_gap, generate_adaptive_practice, assign_practice_to_student, get_student_progress, report_progress_to_teacher; get_student_context, get_assigned_practice, start_practice, submit_answer, get_hint, get_adaptive_explanation, complete_practice, get_practice_result.

Schemas rechazan campos extra y validan tipos superficiales, pero no certifican validación JSON Schema completa: no validan recursivamente los elementos de `answers`. Errores de herramientas se devuelven como `isError` dentro de HTTP 200; no son necesariamente HTTP 403. El cliente indica source mcp/local-fallback. Aunque forceRealMcp bloquea fallback dentro del cliente, el orquestador y el contexto todavía invocan fallback local en otros caminos.

Conformidad pendiente: cliente usa `x-mcp-protocol-version` y omite Accept requerido; transporte no verifica versión estándar, acepta mensajes sin jsonrpc, devuelve 204 a notifications/initialized y no rechaza Origin no permitido con 403. Pruebas locales registraron 200 para Origin externo, 204 para initialized y 200 sin jsonrpc. SSE existe, pero el cliente web usa principalmente POST; no demostrar streaming de respuestas de Alexa por mostrar un inspector. Ver `transport-probes.json` y [especificación MCP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).

El concurso acepta servidor MCP propio y simulación web; no exige acceso a herramientas Alexa+ de preview ni hardware. La falta de integración nativa no es, por sí misma, inelegibilidad. [FAQ oficial](https://amazonappdev2026.devpost.com/details/faqs).

Ejecución documentada: `npm install`, copiar `.env.example` a `.env.local`, `npm run dev:all`; o `npm run mcp:start` y `npm run dev`. El servidor Node independiente no carga automáticamente `.env.local`; valores adicionales deben suministrarse al proceso.

## 4. CORE LEARNING FLOW

**Teacher → Activity → Student → Explanation → Practice → Hint → Evidence: funcional en el mismo navegador; incompleto de extremo a extremo con MCP.**

Se verificaron dos recorridos locales con build de producción:

1. Docente consultó diagnóstico MCP, generó/asignó práctica; alumna completó descubrimiento visual, respondió mal, recibió pista, reintentó y terminó los cinco ejercicios. Evidencia docente: 52% → 100%, +48 puntos, 6 intentos, 1 pista. Ver `web-evidence.txt` y `web-evidence.png`.
2. Editor docente seleccionó Español/Comprensión lectora, generó borrador de un ejercicio, publicó, abrió como alumna, resolvió y devolvió evidencia 100%, primera medición, sin delta inventado. Ver `teacher-created-evidence.txt`. Es contenido de un banco determinista revisable, no generación por LLM.

Fallo reproducido: después del primer recorrido, el panel docente mostraba 100%, pero Consultar al Tutor «¿Mejoró Mariana?» devolvió 52% → 52% y «Aún no concluye la práctica». Web evalúa/guarda localmente (`tutor-context.tsx:391–414`); MCP consulta un singleton diferente en memoria. `refreshState` no sincroniza con el servidor. Ver `web-mcp-report.txt`.

Simulador: solo envía `targetPractice.exercises[0]`, siempre `attemptNumber:1`. Tras contestar correctamente «dos cuartos» y finalizar, calificó 20% sobre cinco ejercicios y guardó delta −32. No permite completar los otros cuatro por esa UI. Ver `simulator-result.txt`.

Las pistas básicas guían y el alumno elige. La afirmación absoluta «nunca entrega respuestas» es falsa: get_adaptive_explanation(step_by_step) devuelve guidedExample del banco, incluido texto con la solución exacta; el chat estudiantil es determinista y puede enumerar equivalencias. Adaptar una etiqueta de dificultad no acredita cambiar los siguientes reactivos del banco fijo.

Experiencia humana: docente y alumno tienen acciones claras en escritorio, acompañamiento visual y evidencia con intentos/apoyos. Para el juez perjudican los resultados contradictorios, «Alexa+ Ready», «TIEMPO REAL» con trazas predefinidas y texto Markdown sin renderizar. En viewport móvil observado, nav `hidden lg:flex` oculta las pestañas sin menú de navegación equivalente: dificulta llegar a prácticas/evidencias/progreso. El menú de opciones contiene landing, simulador y reset, no las pestañas.

## 5. SECURITY

**FAIL global; PASS limitado del barrido de secretos.**

Barrido por patrones: 163 archivos de trabajo inventariados, 11 commits locales alcanzables, 203 blobs históricos únicos, 284 textos escaneados; 0 candidatos. `.env.example` es el único `.env*` rastreado. `.gitignore` excluye `.env` y `.env*.local`, pero no todas las variantes posibles (.env.production/.env.staging). No se mostraron secretos. No equivale a certificar infraestructura, historia remota eliminada, imágenes o toda clave posible. Ver `secrets-scan.json` y `scan-secrets.cjs`.

Comprobaciones adversariales aisladas, solo locales (`local-probes.json`): lectura sin autenticación aceptada; autoatribuirse requesterRole teacher aceptado; finalizar con cinco respuestas incorrectas no enviadas y isCorrect true produjo 100%. MCP no verifica Authorization ni deriva identidad de una sesión confiable. Las siete herramientas docentes tampoco pasan por enforceTenantAndRole. Los ocho casos positivos/negativos del E2E solo validan payloads cooperativos.

`npm audit --omit=dev`: FAIL, dos paquetes afectados, Next critical y PostCSS high (máxima severidad por paquete; múltiples avisos, no dos exploits demostrados). Ver `npm-audit.json`. Next 14.2.35 entra en el rango del [aviso crítico Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36); es relevante para ejecución local Windows, no prueba RCE en Render Linux. `images.unoptimized:true` reduce aplicabilidad del aviso AVIF del optimizador. No se atacó producción ni se demostró explotación. Actualizar Next requiere migración y validación; no se aplicó upgrade mayor automático.

Datos escolares provienen de fixtures; no se identificó conexión a expedientes reales. Publicar código no introduce por sí mismo secretos encontrados, pero el servicio actual no es apto para datos reales de alumnos. Derechos sobre todos los assets no acreditados.

## 6. OPEN SOURCE READINESS

**FAIL**. GitHub público, README, lockfile, example y comandos existen; LICENSE no existe. Falta resolver derechos/licencia de los assets y reproducibilidad de la suite en entorno limpio.

El Mini Challenge pide proyecto/contribución adicional público durante el periodo, licencia, contribution URL, repo URL, username y descripción. Hacer público el proyecto principal no acredita por sí solo este requisito; no se encontró contribución adicional documentada. [Requisitos oficiales](https://amazonappdev2026.devpost.com/).

## 7. TEST RESULTS

| Check | Estado | Resultado real |
|---|---|---|
| npm run lint | PASS | Exit 0, 0 warnings/errors |
| npm run typecheck | PASS | Exit 0 |
| npm test | BLOCKED | Exit 1 al arrancar Rollup; Windows Application Control bloquea rollup.win32-x64-msvc.node. Repetido fuera de sandbox: mismo bloqueo. 0 tests ejecutados, 0 tests acreditados como passed |
| Unit/integration Vitest | BLOCKED | 8 archivos de suites en tests; sin resultados actuales por bloqueo anterior |
| npm run test:e2e | PASS limitado | Fuera de sandbox: exit 0; 11 pasos HTTP 200, 8/8 checks internos, evidencia 80%, +28. Inicialmente bloqueado por userInfo ENOMEM en sandbox |
| Navegador, fracciones | PASS parcial | 5/5, 100%, 6 intentos, 1 pista; evidencia local visible; consulta MCP posterior contradictoria |
| Navegador, creación Español | PASS | 1/1, 100%, primera medición visible en evidencia docente |
| Cliente oficial SDK | PASS | Conectó y tools/list devolvió 15 |
| Autenticación e integridad adversarial | FAIL | 3/3 fallos reproducidos; son vulnerabilidades confirmadas, no checks aprobados |
| Transporte, 3 probes | FAIL de contrato | Origin externo 200, initialized 204, mensaje sin jsonrpc 200 |
| npm run build | PASS | Exit 0, compilación/estáticos completos. Warning EPERM de caché Webpack; no impidió build |
| npm audit --omit=dev | FAIL | 2 paquetes afectados: 1 critical, 1 high |
| Producción smoke de lectura | PASS | 5/5 HTTP 200 |
| E2E mutante de producción | SKIPPED | No asignar/calificar/resetear producción |
| Instalación limpia npm ci | SKIPPED | No reemplazar node_modules/lockfile del usuario durante auditoría |

Importante: test:e2e es un script de evidencia; inyecta cuatro flags correctos y uno incorrecto al finalizar, aunque no envió cinco respuestas a submit_answer. No contiene aserciones que hagan fallar el proceso ante todos los resultados incorrectos. Su exit 0 y 80% no certifican integridad, browser dashboard ni cinco intentos reales. No afirmar 51/51 o 53/53 hoy. Ver copia `real-http-session-evidence.json`.

## 8. PRODUCTION

**Disponible; readiness integral no acreditada.** `/`, `/?demo=judge`, `/health`, initialize y tools/list respondieron 200; health declara 2025-11-25/Streamable HTTP/15 tools. Interfaz visible, robot cargado, hoja CSS referenciada; consola capturada de carga inicial sin warnings/errors. Cold start mostró interstitial de Render antes de la app. Ver `production-smoke.json`, `production-page.txt/png`.

`render.yaml` coincide estructuralmente con frontend+MCP en el mismo dominio. No se verificó configuración viva de Render ni SHA desplegado: health expone 1.0.0 sin commit. GitHub main sí coincide con HEAD local, pero eso no certifica deployment ni cambios no commiteados. El enlace Vercel del draft es placeholder pendiente; no usarlo como producción confirmada.

## 9. SUBMISSION REQUIREMENTS

| Requirement | Status | Evidence | Action |
|---|---|---|---|
| What we built / why it matters / how it works | PARTIAL | README y Devpost draft | Precisar alcance demo y corregir resultados/seguridad simulados |
| Alexa+ vía MCP/simulación permitida | PARTIAL | Servidor y simulador ejecutables | Corregir contrato MCP y simulador; mostrar trabajo real en video |
| GitHub accesible con fuente/assets/instrucciones | PARTIAL | Repo público; main=HEAD | Publicar cambios finales revisados; comprobar clean clone |
| Licencia para repo público | FAIL | Sin LICENSE | Elegir licencia compatible con titularidad/assets y añadir archivo |
| Video público en inglés <3 min | PENDING | Draft marca pendiente, solo guion | Grabar/subir y añadir URL definitiva |
| Feedback herramientas/API/SDK | PENDING | Checklist tiene comentarios parciales MCP | Feedback real sobre uso, aciertos, fricción, onboarding, decisión de reutilizar; tiempo/costo no documentado |
| Trabajo durante periodo | PARTIAL | 11 commits 27 sep–2 oct; mapa local no rastreado | Anclar antes/después a commits; mapa no prueba por sí mismo qué existía antes del concurso |
| Track y mini challenges | PENDING | Alexa+ mencionado; no formulario verificado | Declarar Alexa+; no atribuir uso AWS inexistente |
| Open Source Mini Challenge | FAIL | Sin licencia ni contribution URL adicional | Preparar/documentar proyecto o contribución adicional elegible |
| Demo completa | FAIL | MCP=52 tras web=100; simulador=20 | Corregir sincronización, sesión y evidencia |
| Submission Devpost final | PENDING | Ningún envío acreditado | Completar campos y revisión humana final |

Fuente oficial: [overview](https://amazonappdev2026.devpost.com/) y [FAQ](https://amazonappdev2026.devpost.com/details/faqs). Overview exige video público inglés <3 min, feedback y repositorio público con licencia o privado compartido. Hosting no obligatorio según FAQ; su falta no sería P0. Rules directas quedaron tras verificación anti-bot; no se certificaron todos los términos legales ni elegibilidad personal del participante. No se completó CAPTCHA.

## 10. P0

1. **Repositorio público sin licencia requerida para esa modalidad de submission.** No se modifica visibilidad ni se elige licencia legal por el usuario.
2. **Control de acceso MCP evadible.** Lectura sin identidad y rol teacher autoatribuido aceptados; no se puede afirmar seguridad/aislamiento escolar. P0 de seguridad; datos actuales demo reducen daño observado.
3. **Integridad de evidencia MCP comprometida.** complete_practice confía isCorrect del cliente; cinco respuestas incorrectas no enviadas producen 100%. Bloquea claim central de evidencia verificable.

No secretos expuestos encontrados en el alcance auditado. No se etiqueta automáticamente cada aviso npm como exploit P0 de producción.

## 11. P1

1. **Web/MCP desincronizados:** web 100%; reporte MCP 52%, práctica no terminada. Establecer origen autoritativo y verificar ciclo completo sin fallback oculto.
2. **Simulador incompleto:** primer ejercicio y intento 1 permanentes; termina cinco ejercicios con una respuesta (20%). Mantener sesión/índice/intentos y bloquear finalización incompleta.
3. **MCP no conforme plenamente:** Origin, headers, initialized y JSON-RPC. Corregir transporte y validación; compatibilidad SDK básica no acredita conformidad.
4. **Dependencias afectadas:** Next/PostCSS; revisar aplicabilidad y actualizar con pruebas, sin npm audit fix --force.
5. **Video obligatorio no acreditado:** falta enlace público inglés <3 min. El guion no lo sustituye.
6. **Feedback incompleto:** falta relato verificable de onboarding, esfuerzo/costo solicitado y reutilización; no inventar experiencia usando SDK/API Amazon no utilizados.
7. **Documentación con claims incorrectos/desactualizados:** 51/51 vs 53/53, seguridad certificada, inferencia Amazon, SSE/Alexa nativa, URLs pendientes y herramientas reales vs nominales. Sincronizar docs después de arreglos.
8. **Tests actuales no acreditados:** runner bloqueado por Windows; ejecutar suite intacta en entorno permitido/CI limpio. E2E de evidencia no reemplaza aserciones ni todos los intentos.
9. **Apoyo que entrega solución:** guidedExample del banco servido por get_adaptive_explanation puede revelar resultado exacto; usar ejemplos distintos del reactivo evaluado.
10. **Navegación móvil incompleta:** faltan pestañas accesibles bajo lg. Corregir acceso a vistas antes de ofrecer demo móvil.

Auth, sincronización y migración de Next no son arreglos localizados de bajo riesgo con validación actual disponible. No se aplicó refactor ni parche parcial que pretendiera resolverlos. Solo se añadieron archivos de auditoría y se actualizó evidencia generada por el E2E autorizado; baseline previo conservado.

## 12. P2/P3

**P2:** documentar nombres AWS correctos sin insinuar inferencia; explicar suministro de env al MCP standalone; marcar evidencias seed como demo; evitar llamar «Progreso moderado» a delta negativo; ocultar/renderizar Markdown técnico en chats; identificar commit en health/deployment; revisar ignored .env variantes; evitar ids derivados solo de cuatro dígitos de timestamp y colisiones de ejercicios compartidos; mejorar medición de dominio (acierto después de ayuda no acredita aprendizaje independiente).

**P3:** almacenamiento duradero y cuentas reales; integración nativa Alexa/ASR y Bedrock solo si se desarrolla; mayor catálogo y adaptación efectiva de dificultad. No son requisitos automáticos para un prototipo del track.

## 13. WHAT WE CAN SAFELY CLAIM TO JUDGES

- Prototipo educativo web con profesor central y ejercicios interactivos que explican, guían errores y registran resultado/apoyos en el mismo navegador.
- Editor docente con banco revisable de cinco materias; creación/asignación/resolución Español verificada.
- MCP propio con 15 tools, llamadas HTTP reales y compatibilidad básica probada con SDK oficial.
- Simulación visual propia de Alexa+ inspirada en Echo Show; texto de frases normalizado en español, sobre datos escolares demo.
- Puntuación web calculada desde elecciones: esta sesión dio 100%, no un 80% fijo.
- Build, lint y typecheck pasan; endpoints de producción accesibles en smoke de lectura.
- 11 commits locales registrados durante septiembre/octubre; la autoría/alcance previo fuera de Git requiere evidencia adicional.

## 14. WHAT WE MUST NOT CLAIM

- Integración nativa Alexa+, hardware Echo Show, reconocimiento real de micrófono o inferencia AWS/Bedrock/Nebius.
- Autenticación real, RBAC/multi-tenant robusto, datos de alumnos reales protegidos o repositorio MCP de evidencia resistente a manipulación.
- Sincronización universal navegador-servidor-dispositivo, persistencia cloud durable o aislamiento de sesiones.
- Simulador con cinco ejercicios completables, escalado automático de intentos o flujo de voz completo.
- Conformidad estricta MCP 2025-11-25 solo por declarar ese string; SSE del diálogo real solo por abrir un stream.
- Tutor que nunca entrega la solución, resultados educativos comprobados experimentalmente o avance garantizado 52→80.
- Suite actual 51/51 o 53/53, cero vulnerabilidades, Open Source Mini Challenge cumplido o deployment del working tree exacto.
- Video publicado, feedback completo o envío Devpost realizado sin evidencia.

## 15. FINAL CHECKLIST

- [ ] Repository — falta cierre/versionado de cambios y licencia
- [x] Secrets — sin candidatos en alcance revisado
- [ ] README — corregir claims y configuración
- [ ] License
- [ ] Alexa+ — cerrar simulación; nativo no requerido
- [ ] MCP — contrato/integridad/control de acceso pendientes
- [x] Teacher flow — creación/asignación local verificadas
- [x] Student flow — resolución local verificada
- [x] Hint flow — error/pista/reintento local verificados
- [ ] Evidence — visible local; integridad y sincronización MCP fallan
- [ ] Tests — Vitest bloqueado
- [x] Build
- [ ] Production — smoke PASS; trazabilidad y flujo integral pendientes
- [ ] Open Source Mini Challenge
- [ ] Amazon feedback
- [ ] Demo readiness

**SUBMISSION READY: NO** — faltan licencia, integridad/control de acceso MCP, sincronización del flujo, simulador completo, validación de tests, revisión de dependencias, video y feedback final verificable.

# Auditoría MACHTIA — 2 de octubre de 2026

Estado: correcciones y validación local realizadas; producción bloqueada por identificación/acceso al alojamiento existente.

## Publicación

- La documentación local indica `https://machtia-tutor.vercel.app`, marcada como pendiente de vinculación. La comprobación HTTP externa devuelve 404.
- La integración Vercel conectada devuelve cero proyectos para el equipo disponible de dyann1984.
- No se pudo confirmar la URL enviada al concurso. Se solicitó la URL exacta y la cuenta/plataforma de alojamiento.
- No se creó un proyecto nuevo ni se cambió un dominio. No se desplegó ni se verificó producción.

## Estado inicial

HEAD inicial: `9ea48db`. Había 33 archivos rastreados modificados y múltiples archivos nuevos: descubrimiento, ejercicios, Alexa+, voz, MCP y documentación. Se conservaron las implementaciones heredadas. Las capturas y herramientas de depuración heredadas permanecen sin incluir en el commit de correcciones.

## Correcciones

- Asset oficial copiado sin alterar a `public/machtia-tutor-official.png`; SHA-256 idéntico al adjunto: `4E4918A2B0B0931A4E9421667F339B6A6496182276FA04EDDE34592450DC1997`. Avatar con object-contain.
- Descubrimiento: elimina el título anticipado 2/4, exige resolver observación para avanzar, mantiene manipulación y comparación, y elimina indicaciones que revelaban la elección.
- Ejercicios: conserva tarjetas visuales, chocolate y comparación; convierte productos cruzados y simplificación en respuestas numéricas escritas con retroalimentación.
- Primer error: pista. Segundo: explicación alternativa. Tercero y siguientes: guía concreta y posibilidad de reintentar, sin mostrar una solución automática.
- Resultados: conceptos dominados y pendientes derivados de los ejercicios realmente resueltos. Contadores de intentos, pistas y re-explicaciones guardados en evidencia.
- Evidencia docente: reemplaza conceptos y observaciones fijos por la evidencia real. Muestra también deltas negativos correctamente.
- MCP: protección frente a respuestas null, undefined y ejercicios malformados; conserva práctica existente y fallback.
- Alexa+: descubre el ID remoto de práctica, muestra errores reales, registra respuestas realizadas y sincroniza la evidencia devuelta al expediente local.
- Elimina 80% por defecto al finalizar una sesión Alexa+ sin respuestas y elimina etiquetas de mejora fija +28 del simulador.
- Voz: conserva prioridad es-MX, selección femenina cuando existe, fallback, rate 0.92, pitch 1.05 y normalización de fracciones. Los listeners de carga de voces ya no se sobrescriben entre componentes.
- Responsive: corrige overflow del encabezado a 390 px, permite envolver pasos y cabeceras, mantiene proporción del robot.
- Movimiento: celebración breve del robot, confetti desactivado con movimiento reducido y protección CSS global.

## Validación

- Typecheck: PASS.
- Lint: PASS, cero warnings de ESLint.
- Vitest: 67 tests PASS en seis archivos.
- Build de producción Next.js: PASS.
- HTTP E2E: initialize, tools/list (15 herramientas), contexto, asignación, inicio, error, pista, explicación, respuesta oral, finalización y evidencia: PASS.
- Matriz HTTP de aislamiento/IDOR: ocho comprobaciones PASS.
- Navegador local en build de producción, puerto explícito 3017: acceso directo y recarga de modo juez, generación/asignación, descubrimiento, tres errores deliberados, recuperación, cinco ejercicios y evidencia docente comprobados.
- Resultado observado del recorrido web: 52% → 100%, +48 puntos, ocho intentos, una pista y dos intervenciones de re-explicación. El historial y el panel docente coinciden.
- Alexa+ visual: contexto, ID remoto, start_practice, normalización “dos cuartos” → 2/4 y evidencia sin aciertos prefabricados comprobados. Una respuesta correcta de cinco produce 20%, con los otros conceptos pendientes.
- Consola observada: cero errores y warnings del navegador en los recorridos inspeccionados. No se observó hydration mismatch ni excepción de runtime.
- Resoluciones inspeccionadas: 390×844, 768×1024, 1440×900 y 1920×1080. En las vistas medidas, scrollWidth no excedió innerWidth después de la corrección. No se ejecutó una matriz exhaustiva de cada vista en cada resolución.

## Límites pendientes

- Falta identificar y acceder al alojamiento real del concurso; el smoke/E2E público está pendiente.
- Se invocó voz y se validaron funciones de selección/normalización; no se certificó la calidad audible de la voz instalada en el dispositivo del juez.
- Alexa+ es un simulador de interfaz respaldado por MCP real; no es certificación de un dispositivo Amazon.
- Persistencia web mediante localStorage; el servidor MCP conserva datos en memoria. La evidencia HTTP certifica persistencia durante la sesión, no durabilidad tras reiniciar el servidor.
- La finalización MCP acepta resultados de ejercicios mediante su contrato de entrada; la comprobación de seguridad aquí cubre las defensas de tenant/IDOR existentes, no una auditoría de autenticación de producción completa.

No se declara «PRODUCCIÓN ACTUALIZADA Y VERIFICADA» porque no se realizó un despliegue público verificable.

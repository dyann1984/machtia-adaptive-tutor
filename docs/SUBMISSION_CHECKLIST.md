# Lista de Verificación de Entrega (Submission Checklist)

**Hackathon Amazon / Alexa+ Developer Hackathon**  
**Proyecto:** MACHTIA Adaptive Tutor

---

## Estado de Verificación Técnica

- [ ] **Frontend público desplegado:** Aplicación Next.js accesible en URL pública (ej. Vercel).
- [ ] **Servidor MCP público desplegado:** Servidor Streamable HTTP en URL accesible (ej. Render / ECS).
- [ ] **Endpoint `/health` responde:** Devuelve HTTP 200 con `status: "ok"` y `toolsCount: 7`.
- [ ] **MCP Connected real:** El frontend muestra la píldora verde `MCP Connected` confirmada por handshake HTTP.
- [ ] **Flujo pedagógico completo probado:** Profesor detecta rezago → prescribe práctica → Alumna recibe andamiaje con FractionBarVisualizer → pistas formativas → evidencia antes (52%) vs después (80%).
- [ ] **Judge Demo funciona:** Soporte de variable `JUDGE_DEMO=true` con grupo 3° B cargado, Mariana 52%, Luis 58% y 0 prácticas previas.
- [ ] **Reiniciar Demo funciona:** El botón "Reiniciar demostración" restaura de inmediato el estado inicial sin dejar residuos.
- [ ] **README final:** Redactado con estructura para jurado no técnico en las primeras secciones.
- [ ] **DEVPOST_SUBMISSION listo:** Borrador completo con problema, solución, integración MCP y aprendizajes.
- [ ] **Arquitectura lista:** Diagramas y documentación técnica en `docs/AMAZON_MCP_ARCHITECTURE.md`.
- [ ] **Video grabado:** Video de 2:30 a 2:50 minutos siguiendo el guion estructurado.
- [ ] **Video público/no listado:** Enlace de YouTube o Vimeo listo para Devpost.
- [ ] **Screenshots preparadas:** 6 capturas clave en alta resolución (1920x1080 / 1440x900).
- [ ] **Repositorio listo:** Código limpio, sin archivos temporales ni carpetas `.next` o `node_modules` en Git.
- [ ] **Ningún secreto expuesto:** `.gitignore` verificado, sin tokens ni credenciales de AWS en el repositorio.
- [ ] **Pruebas PASS:** Vitest reporta 100% de pruebas aprobadas sin fallos.
- [ ] **Lint PASS:** `npm run lint` reporta 0 errores y 0 advertencias de ESLint.
- [ ] **Typecheck PASS:** `npm run typecheck` (`tsc --noEmit`) sin errores de tipos.
- [ ] **Build PASS:** `npm run build` genera la compilación estática y SSR de producción con éxito.

# Lista de Verificación de Entrega (Submission Checklist)

**Hackathon Amazon / Alexa+ Developer Hackathon**  
**Proyecto:** MACHTIA Adaptive Tutor

---

## Estado de Verificación Técnica

- [ ] **Frontend público desplegado:** Aplicación Next.js accesible en URL pública (ej. Vercel). *(Pendiente vinculación Vercel)*
- [ ] **Servidor MCP público desplegado:** Servidor Streamable HTTP en URL accesible (ej. Render / ECS). *(Pendiente vinculación Render)*
- [x] **Endpoint `/health` responde:** Devuelve HTTP 200 con `status: "ok"` y `toolsCount: 7`. *(Verificado localmente y en suite automatizada)*
- [x] **MCP Connected real:** El frontend muestra la píldora verde `MCP Connected` confirmada por handshake HTTP y cambia a `MCP Offline • Modo Demo Activo` ante fallo sin romper la UI.
- [x] **Flujo pedagógico completo probado:** Profesor detecta rezago → prescribe práctica → Alumna recibe andamiaje con FractionBarVisualizer → pistas formativas → evidencia antes (52%) vs después (80%).
- [x] **Judge Demo funciona:** Soporte de variable `JUDGE_DEMO=true` con grupo 3° B cargado, Mariana 52%, Luis 58% y 0 prácticas previas.
- [x] **Reiniciar Demo funciona:** El botón "Reiniciar demostración" restaura de inmediato el estado inicial sin dejar residuos.
- [x] **README final:** Redactado con estructura para jurado no técnico en las primeras secciones.
- [x] **DEVPOST_SUBMISSION listo:** Borrador completo con problema, solución, integración MCP y aprendizajes.
- [x] **Arquitectura lista:** Diagramas y documentación técnica en `docs/AMAZON_MCP_ARCHITECTURE.md`.
- [ ] **Video grabado:** Video de 2:30 a 2:50 minutos siguiendo el guion estructurado. *(Pendiente grabación por usuario)*
- [ ] **Video público/no listado:** Enlace de YouTube o Vimeo listo para Devpost. *(Pendiente grabación por usuario)*
- [x] **Screenshots preparadas:** 6 capturas clave en alta resolución en `docs/screenshots/` (01 a 06).
- [x] **Repositorio listo:** Código limpio, sin archivos temporales ni carpetas `.next` o `node_modules` en Git.
- [x] **Ningún secreto expuesto:** `.gitignore` verificado, sin tokens ni credenciales en el repositorio.
- [x] **Pruebas PASS:** Vitest reporta 25/25 pruebas aprobadas sin fallos.
- [x] **Lint PASS:** `npm run lint` reporta 0 errores y 0 advertencias de ESLint.
- [x] **Typecheck PASS:** `npm run typecheck` (`tsc --noEmit`) sin errores de tipos.
- [x] **Build PASS:** `npm run build` genera la compilación estática y SSR de producción con éxito.

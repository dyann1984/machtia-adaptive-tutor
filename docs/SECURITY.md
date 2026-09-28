# Auditoría de Seguridad: MACHTIA Adaptive Tutor

Este documento certifica el análisis de seguridad y las salvaguardas implementadas en **MACHTIA Adaptive Tutor** para su despliegue y evaluación en el marco del hackathon Amazon / Alexa+.

---

## 1. Gestión de Variables de Entorno y Secretos
- **`.env` Ignorado:** `.gitignore` excluye explícitamente `.env`, `.env.local`, `.env*.local`, `.env.development.local` y `.env.production.local`.
- **Secretos fuera del control de versiones:** Ningún archivo de configuración contiene claves de API reales, contraseñas ni tokens de AWS. `.env.example` solo expone nombres de variables sin valores asignados.
- **Sin tokens hardcodeados:** Se realizó un barrido exhaustivo del código fuente verificando la ausencia total de tokens o credenciales incrustadas en cadenas de texto. El sistema opera de manera predeterminada en modo `AI_PROVIDER=mock`, el cual es 100% autónomo y no requiere claves de terceros.

---

## 2. Aislamiento y Alcance del Servidor MCP
- **Sin acceso al sistema de archivos (Filesystem Isolation):** Las herramientas del servidor MCP no implementan lectura ni escritura arbitraria en disco (`fs.readFile`, `fs.writeFile`, etc.). Toda la persistencia educativa se gestiona mediante repositorios de datos en memoria y adaptadores controlados.
- **Sin ejecución de comandos de sistema:** Ninguna herramienta invoca subprocesos (`child_process.exec`, `child_process.spawn`, `eval`, o equivalentes).
- **Herramientas estrictamente limitadas al dominio educativo:** El catálogo del servidor MCP contiene únicamente 7 herramientas pedagógicas:
  1. `analyze_student_performance`
  2. `find_students_needing_support`
  3. `get_student_learning_gap`
  4. `generate_adaptive_practice`
  5. `assign_practice_to_student`
  6. `get_student_progress`
  7. `report_progress_to_teacher`
- **Validación rigurosa de entradas mediante Schemas:** Cada herramienta valida sus parámetros de entrada contra esquemas JSON estrictos definidos en `mcp/server/schemas.ts`. Las solicitudes con parámetros faltantes, tipos inválidos o propiedades no autorizadas son rechazadas con códigos de error JSON-RPC (`-32602`).

---

## 3. Seguridad de Red, CORS y Transporte
- **CORS Configurable:** El servidor HTTP MCP admite la variable `MCP_ALLOWED_ORIGINS` para restringir las llamadas entrantes exclusivamente a los orígenes autorizados (ej. `https://machtia-tutor.vercel.app`), previniendo ataques de Cross-Origin Request Forgery.
- **Protocolo Estándar 2025-11-25:** La comunicación se rige por la especificación oficial de Model Context Protocol (Streamable HTTP y JSON-RPC 2.0).
- **Superficie de ataque mínima:** Solo se exponen las rutas necesarias:
  - `POST /mcp`: JSON-RPC para inicialización y llamadas a herramientas.
  - `GET /mcp`: Stream SSE unidireccional con eventos de heartbeat.
  - `GET /health`: Endpoint ligero de verificación de estado.
  Cualquier otra ruta devuelve `404 Not Found`.

---

## 4. Manejo de Errores y Protección de Telemetría
- **Ocultamiento de Stack Traces:** En caso de excepción, el servidor MCP devuelve respuestas JSON-RPC con códigos de error estándar (`-32603`, `-32602`, `-32700`) y mensajes descriptivos seguros, sin exponer trazas de pila completas (*stack traces*) ni rutas internas del servidor.
- **Endpoint `/health` Seguro:** El endpoint `/health` expone únicamente metadatos operativos públicos:
  - Versión del protocolo (`2025-11-25`)
  - Transporte (`Streamable HTTP`)
  - Nombre del servidor (`machtia-tutor-mcp-server`)
  - Conteo de herramientas (`7`)
  No revela variables de entorno, tokens, direcciones de memoria ni información de infraestructura subyacente.

---

## 5. Resumen de Cumplimiento

| Criterio de Seguridad | Estado | Evidencia |
|---|---|---|
| `.env` ignorado en Git | **CUMPLE** | `.gitignore` líneas 27–33 |
| Secretos fuera del repositorio | **CUMPLE** | `.env.example` sin credenciales |
| Sin tokens hardcodeados | **CUMPLE** | Verificación estática con 0 coincidencias |
| Sin acceso al filesystem desde MCP | **CUMPLE** | `mcp/server/tools.ts` desacoplado de `fs` |
| Sin ejecución de comandos arbitrarios | **CUMPLE** | 0 llamadas a `child_process` en tools |
| Herramientas limitadas al ámbito educativo | **CUMPLE** | 7 tools pedagógicas exclusivas |
| Schemas validan inputs | **CUMPLE** | Validado en `tests/mcp-server.test.ts` (Test 4) |
| CORS configurable | **CUMPLE** | `mcp/server/transport.ts` cabecera `corsOrigin` |
| Errores sin stack trace en producción | **CUMPLE** | JSON-RPC standard error wrappers |
| Sin endpoints innecesarios | **CUMPLE** | Solo `/mcp` y `/health` activos |
| `/health` libre de datos sensibles | **CUMPLE** | Solo telemetría de protocolo y conteo |

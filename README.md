# MACHTIA Adaptive Tutor 🤖📚
> **Tutor IA Educativo Adaptativo • MVP para Hackathon Amazon / Alexa+ & Nebius / NVIDIA**

![MACHTIA Adaptive Tutor Logo](/public/machtia-logo.jpg)

---

## 1. Qué es MACHTIA Adaptive Tutor

**MACHTIA Adaptive Tutor** es un sistema de tutoría educativa inteligente basado en agentes de IA y compatible con el protocolo estándar **Model Context Protocol (MCP)** versión **2025-11-25**.

Conecta de manera fluida el ecosistema pedagógico:
```
Profesor ➔ Tutor IA Orquestador ➔ Alumno ➔ Evidencia de Aprendizaje Medible
```

Permite a los docentes supervisar grupos escolares, diagnosticar patrones de error individuales en tiempo real, prescribir prácticas interactivas con ajuste dinámico de dificultad y comprobar el progreso cuantitativo (**Antes vs. Después**) de cada estudiante.

---

## 2. Amazon Alexa+ Hackathon Integration

### 2.1. ¿Por qué MACHTIA Adaptive Tutor encaja en Alexa+?
- **Asistencia Docente Manos Libres:** En el aula, el profesor puede consultar a un dispositivo Alexa+: *“Alexa, ¿qué alumnos necesitan apoyo en matemáticas?”* y recibir un diagnóstico preciso con datos en tiempo real.
- **Multimodalidad y Pantallas Inteligentes (Echo Show):** Alexa+ combina la interacción por voz con interfaces visuales interactivas para mostrar barras de fracciones de chocolate al estudiante y gráficos de progreso al docente.
- **Tutoría Adaptativa en el Hogar:** Los alumnos pueden interactuar conversacionalmente con el tutor adaptativo para resolver sus tareas escolares con pistas progresivas (Nivel 1: Pista, Nivel 2: Explicación alternativa con analogía, Nivel 3: Ejemplo guiado paso a paso).

### 2.2. Arquitectura de Integración MCP

```
Teacher / Alexa+
       ↓
MACHTIA Adaptive Tutor UI
       ↓
Tutor Agent Orchestrator
       ↓
MCP Client
       ↓  (JSON-RPC 2.0 / Streamable HTTP)
MACHTIA Tutor MCP Server (Puerto 3100)
       ↓
Educational Tools Registry
       ↓
Learning Data Repository
```

Ver documento detallado en: [`docs/AMAZON_MCP_ARCHITECTURE.md`](docs/AMAZON_MCP_ARCHITECTURE.md).

### 2.3. Especificación MCP Implementada
- **Versión del Protocolo:** `2025-11-25`
- **Transporte:** **Streamable HTTP** con soporte Server-Sent Events (SSE) y JSON-RPC 2.0.
- **Servidor MCP Ejecutable:** Implementado en `mcp/server/index.ts`, configurable en puerto `3100`.
- **Endpoints del Servidor:**
  - `POST http://localhost:3100/mcp`: Endpoint JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`, `ping`).
  - `GET  http://localhost:3100/mcp`: Streaming SSE con heartbeat y eventos de estado.
  - `GET  http://localhost:3100/health`: Health check con versión del protocolo y conteo de herramientas.

### 2.4. Herramientas MCP Expuestas

| Herramienta | Entrada JSON Schema | Salida Estructurada |
|---|---|---|
| `analyze_student_performance` | `{ groupId, subjectId }` | Métricas grupales y tema con mayor rezago. |
| `find_students_needing_support` | `{ groupId, subjectId?, threshold? }` | Lista de alumnos con rendimiento < 65% y evidencia de rezago. |
| `get_student_learning_gap` | `{ studentId, subjectId?, topicId? }` | Diagnóstico de error recurrente y evidencia empírica. |
| `generate_adaptive_practice` | `{ studentId, topicId, initialDifficulty?, exerciseCount? }` | Práctica de 5 reactivos con estado `"pending"`. |
| `assign_practice_to_student` | `{ practiceId, studentId }` | Asignación confirmada en el expediente del alumno. |
| `get_student_progress` | `{ studentId, subjectId? }` | Historial comparativo de evaluaciones y prácticas. |
| `report_progress_to_teacher` | `{ studentId, practiceId?, subjectId? }` | Reporte antes/después (+28% delta) con conceptos dominados. |

---

## 3. Modos de Ejecución

### Modo Demo (Default - Offline & Hackathon Safe)
- Activado por defecto con `AI_PROVIDER=mock`.
- Utiliza inferencia local determinista y ejecuta herramientas contra el servidor MCP real o fallback local.
- **No requiere credenciales externas ni tarjetas de crédito.**

### Modo Amazon (`AI_PROVIDER=amazon`)
- Preparado para conectarse con **Amazon Bedrock** (Claude 3.5 Sonnet / Amazon Nova Pro).
- Configuración mediante variables de entorno en `.env.local` (ver `.env.example`):
  ```bash
  AI_PROVIDER=amazon
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=tu_access_key
  AWS_SECRET_ACCESS_KEY=tu_secret_key
  AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
  ```
- Si las credenciales no están presentes, conmuta automáticamente al proveedor seguro sin romper la aplicación.

---

## 4. Scripts y Comandos de Ejecución

```bash
# Iniciar servidor MCP y Frontend simultáneamente
npm run dev:all

# Iniciar únicamente el servidor MCP real (puerto 3100)
npm run mcp

# Iniciar únicamente el frontend Next.js (puerto 3000)
npm run dev

# Ejecutar suite de 20 pruebas automatizadas (Pedagogía + MCP Real)
npm test

# Validar tipos TypeScript
npm run typecheck

# Validar linter ESLint
npm run lint

# Compilar versión de producción
npm run build
```

---

## 5. Flujo Pedagógico Completo (Demostración)

1. **Profesor entra al Dashboard:** Pulsa *"1. ¿Quién necesita apoyo en matemáticas?"*.
2. **Actividad del Agente:**
   - `AGENT`: Analizando desempeño grupal...
   - `MCP`: Conectado a MACHTIA Tutor Server (Streamable HTTP 2025-11-25).
   - `TOOL`: `find_students_needing_support()` y `get_student_learning_gap()`.
   - `RESULT`: Detecta a Mariana López (52%) y Luis Hernández (58%).
3. **Prescripción Docente:** El profesor pulsa *"Crear práctica de apoyo"* para Mariana. Se ejecuta `generate_adaptive_practice()` y `assign_practice_to_student()`.
4. **Alumno:** Mariana abre su portal, ve su nueva práctica asignada con tutor disponible.
5. **Tutor IA:** Enseña con barras de fracciones interactivas antes de preguntar; si comete un error, brinda soporte formativo progresivo (Pista ➔ Explicación alternativa con pizza/chocolate ➔ Ejemplo guiado).
6. **Resultados Reales:** Mariana resuelve 4 de 5 reactivos y obtiene **80% de calificación**.
7. **Cierre de Ciclo:** El profesor consulta *"¿Mariana mejoró?"* y recibe el reporte consolidado: **52% ➔ 80% (+28% de delta)**.

---

**MACHTIA** • *Inteligencia Educativa para todos los niños y niñas.*

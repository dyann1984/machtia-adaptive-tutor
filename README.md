# MACHTIA Adaptive Tutor

> **Un agente educativo que transforma evidencia de desempeño en apoyo personalizado para cada estudiante.**

Built for Amazon Alexa+ Developer Hackathon • Powered by Model Context Protocol (MCP 2025-11-25)

---

## The Problem

En un aula típica de primaria, un docente atiende diariamente entre 25 y 35 alumnos. Aunque las evaluaciones diagnósticas revelan con claridad qué estudiantes presentan rezago o calificaciones bajas (por ejemplo, un 52% en fracciones), **convertir esa información en apoyo individualizado consume un tiempo extraordinario**.

Cada estudiante tropieza por motivos pedagógicos distintos:
- Un alumno asume erróneamente que a mayor denominador mayor es la fracción.
- Otro comete fallos de simplificación al omitir factores comunes.
- El docente rara vez dispone de horas libres para diseñar una práctica interactiva específica con andamiaje para cada error conceptual, acompañar al alumno paso a paso y volver a medir si el concepto fue efectivamente asimilado.

Como resultado, los rezagos iniciales se acumulan y se convierten en barreras permanentes de aprendizaje.

---

## The Solution

**MACHTIA Adaptive Tutor** es un agente pedagógico inteligente que cierra el ciclo entre diagnóstico docente y aprendizaje real del alumno:

1. **Detecta brechas específicas:** Identifica patrones de error conceptuales en lugar de limitarse a promedios numéricos fríos.
2. **Genera práctica adaptada:** Diseña reactivos calibrados con andamiaje cognitivo dirigidos exactamente al error del estudiante.
3. **Acompaña al alumno con pedagogía activa:** El tutor enseña visualmente antes de preguntar, ofrece pistas sin regalar respuestas y reformula explicaciones con ejemplos cotidianos si el alumno vuelve a fallar.
4. **Devuelve evidencia verificable al profesor:** Calcula el resultado a partir de las respuestas reales y presenta una comparativa cuantitativa y cualitativa (**Antes vs. Después**).

---

## Demo Flow

El flujo principal conecta armónicamente al docente y al estudiante en una experiencia pedagógica continua:

```
Profesor
   ↓ (Consulta: "¿Quién necesita apoyo en matemáticas?")
Detecta quién necesita apoyo (Mariana López: 52%, Luis Hernández: 58%)
   ↓
Identifica materia y tema específico (Matemáticas → Fracciones equivalentes)
   ↓
Genera práctica de apoyo (5 reactivos adaptativos con apoyo visual)
   ↓
Asigna práctica al estudiante
   ↓
Alumno
   ↓
Recibe práctica en su portal
   ↓
Tutor explica antes de preguntar (Comprensión visual con barras fraccionarias)
   ↓
Tutor da pistas si hay error (Nivel 1: pista formativa sin revelar respuesta)
   ↓
Tutor cambia la explicación si el alumno no entiende (Nivel 2: analogía cotidiana / pizza)
   ↓
Alumno completa práctica
   ↓
Sistema calcula resultado real (80% obtenido en respuestas auténticas)
   ↓
Profesor
   ↓
Ve evidencia antes vs después (52% → 80% • +28 puntos porcentuales)
```

---

## Why Alexa+ / MCP

Los modelos de lenguaje por sí solos son conversadores pasivos; para transformar el aula requieren la capacidad de **ejecutar acciones reales en el mundo educativo**.

- **El rol de Model Context Protocol (MCP):**  
  Implementado bajo la especificación oficial `2025-11-25`, MCP actúa como el puente estandarizado entre el agente conversacional (Alexa+ / LLM) y las herramientas pedagógicas especializadas. A través de transporte **Streamable HTTP** y JSON-RPC 2.0, el agente consulta expedientes escolares, calibra reactivos, asigna tareas y guarda evidencias auditables de aprendizaje.

- **La visión de Amazon Alexa+:**  
  Permite una asistencia docente multimodal y manos libres. En el aula, el profesor interactúa por voz (*"Alexa, ¿quién necesita apoyo en fracciones?"*), mientras que pantallas inteligentes (Echo Show) proyectan visualizadores interactivos de barras fraccionarias para el alumno y tableros comparativos antes/después para el maestro.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│             Amazon Alexa+ / Web Experience               │
│        (Docente manos libres & Alumno interactivo)       │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                 Tutor Agent Orchestrator                 │
│         (Orquestación pedagógica y andamiaje)            │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼ Streamable HTTP / JSON-RPC 2.0
┌──────────────────────────────────────────────────────────┐
│             MACHTIA Tutor MCP Server (Port 3100)          │
│                 Protocol Version: 2025-11-25             │
│        Endpoints: POST /mcp • GET /mcp • GET /health     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                Educational Tools Registry                │
│  • analyze_student_performance   • generate_practice     │
│  • find_students_needing_support • assign_practice       │
│  • get_student_learning_gap      • report_progress       │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│               Learning Evidence Repository               │
│        (Expedientes, Intentos, Brechas y Métricas)        │
└──────────────────────────────────────────────────────────┘
```

---

## MCP Tools

El servidor MCP expone 7 herramientas pedagógicas con schemas tipados y validados:

| Herramienta | Entrada Schema | Propósito Pedagógico |
|---|---|---|
| `analyze_student_performance` | `{ groupId, subjectId }` | Diagnostica el rendimiento global del grupo e identifica el tema de mayor rezago. |
| `find_students_needing_support` | `{ groupId, subjectId?, threshold? }` | Filtra alumnos con desempeño inferior al umbral (ej. 65%) y extrae su evidencia. |
| `get_student_learning_gap` | `{ studentId, subjectId?, topicId? }` | Diagnostica el patrón de error específico (ej. comparación errónea de denominadores). |
| `generate_adaptive_practice` | `{ studentId, topicId, initialDifficulty?, exerciseCount? }` | Genera una batería de 5 ejercicios calibrados con soporte visual y 3 niveles de andamiaje. |
| `assign_practice_to_student` | `{ practiceId, studentId }` | Asocia la práctica generada al expediente del alumno con estado `pending`. |
| `get_student_progress` | `{ studentId, subjectId? }` | Recupera el historial de evaluaciones previas y prácticas realizadas. |
| `report_progress_to_teacher` | `{ studentId, practiceId?, subjectId? }` | Emite la comparativa antes vs después con delta porcentual y conceptos dominados. |

---

## Demo

La aplicación cuenta con un modo de demostración integral diseñado para evaluación de jurado:

- **Landing de bienvenida:** Presentación clara del valor educativo y acceso con un clic a la demostración.
- **Rol Profesor (Prof. Carlos Vega):** Diagnóstico en vivo de 3° B con detección de Mariana López (52%) y Luis Hernández (58%), prescripción de práctica con herramientas MCP y visualización de telemetría sin exceso de JSON técnico.
- **Rol Alumna (Mariana López):** Interfaz interactiva donde el Tutor IA explica con barras fraccionarias antes de preguntar, guía los errores con pistas y analogías cotidianas, y evalúa en tiempo real.
- **Evidencia Antes vs Después:** Comparativa que demuestra el avance de 52% a 80% (+28 puntos porcentuales) generado de respuestas reales.
- **Botón "Reiniciar demostración":** Restaura de inmediato el estado inicial sin dejar residuos de demostraciones previas.

---

## Local Setup

### Requisitos previos
- Node.js 18+ (recomendado 20+)
- npm o pnpm

### Pasos de instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   ```
   *(Por defecto opera en modo seguro con servidor MCP local y fallback determinista; no requiere credenciales de pago).*

3. **Ejecutar la suite completa (Frontend + Servidor MCP):**
   ```bash
   npm run dev:all
   ```
   - Frontend Next.js: `http://localhost:3000`
   - Servidor MCP: `http://localhost:3100/mcp`
   - Health Check MCP: `http://localhost:3100/health`

4. **Ejecutar servicios de forma independiente (opcional):**
   ```bash
   # Terminal 1: Iniciar servidor MCP
   npm run mcp:start
   # (o también: npm run mcp)

   # Terminal 2: Iniciar frontend Next.js
   npm run dev
   ```

---

## Tests

El proyecto cuenta con una batería de pruebas automatizadas con Vitest que cubren tanto el flujo pedagógico como la conformidad con el protocolo MCP:

```bash
# Ejecutar pruebas automatizadas
npm test

# Verificación de tipos TypeScript
npm run typecheck

# Análisis estático de código
npm run lint

# Compilación de producción
npm run build
```

---

## Hackathon

- **Competición:** Amazon / Alexa+ Developer Hackathon
- **Pista Principal:** Conversational Agents & Autonomous Multi-Tool Orchestration
- **Tecnologías Clave:** Model Context Protocol (MCP 2025-11-25), Next.js 14, Tailwind CSS, TypeScript, Canvas Confetti.
- **Compromiso Ético:** Sin resultados inventados o fijos en caliente; el cálculo final del alumno refleja estrictamente las interacciones y respuestas realizadas durante la sesión de práctica.

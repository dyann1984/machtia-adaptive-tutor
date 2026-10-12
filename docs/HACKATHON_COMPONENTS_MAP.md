# Mapa de Componentes de MACHTIA Adaptive Tutor — Hackathon Build, Ship, Shape (Amazon Developer)

Este documento certifica con claridad qué componentes del sistema existían antes del hackathon y cuáles fueron creados o sustancialmente modificados durante el mismo.

---

## 1. Componentes Existentes Previo al Hackathon (Línea Base MACHTIA)

| Componente | Ruta en Repositorio | Propósito Original |
|---|---|---|
| **Estructura Base del Proyecto** | `package.json`, `tsconfig.json`, `app/layout.tsx` | Configuración base Next.js 14 con TypeScript y Tailwind CSS. |
| **Repositorio de Datos Simulado** | `lib/data/mock-data.ts`, `lib/data/repository.ts` | Entidades escolares (`Student`, `Teacher`, `Group`, `Subject`, `LearningGap`) y persistencia en memoria. |
| **Panel del Docente Básico** | `features/teacher/TeacherDashboard.tsx`, `GroupView.tsx` | Vistas iniciales de tablero para visualizar promedios y lista de alumnos. |
| **Visualizador Simple de Barras** | `components/FractionBarVisualizer.tsx` | Componente estático para comparar dos barras de fracciones numéricas. |
| **Navbar y Layout General** | `components/Navbar.tsx`, `LandingView.tsx` | Encabezado institucional y pantalla de bienvenida con roles. |

---

## 2. Componentes Creados o Sustancialmente Modificados Durante el Hackathon

### A. Robot Tutor Acompañante e Inteligencia Visual
| Componente | Tipo | Descripción de la Modificación / Creación |
|---|---|---|
| `components/TutorRobotAvatar.tsx` | **Modificado / Potenciado** | Integración del avatar oficial en alta definición (`/machtia-tutor-official.png`), 6 estados emocionales reactivos (`normal`, `speaking`, `success`, `hint`, `celebrating`), halos luminosos dinámicos y badges visuales con micro-animaciones. |
| `components/SpeechAudioButton.tsx` | **Creado** | Módulo de síntesis de voz pedagógica con controles accesibles, soporte de repetición y retroalimentación auditiva natural para niños de primaria. |
| `lib/hooks/use-speech.ts` | **Creado** | Hook reactivo para control de Web Speech API con cancelación global y fallback seguro. |

### B. Prácticas Interactivas Didácticas del Alumno
| Componente | Tipo | Descripción |
|---|---|---|
| `components/InteractiveFractionDiscovery.tsx` | **Creado** | Módulo de descubrimiento guiado en 4 pasos (*Observa → Pinta 1/2 → Pinta 2/4 → Compara y Descubre*) con andamiaje visual, confeti y retroalimentación inmediata del Robot. |
| `components/exercises/FractionCardInteractive.tsx` | **Creado** | Reactivo 1 interactivo con mini-barras visuales dinámicas integradas en cada tarjeta de opción para comparación directa. |
| `components/exercises/ChocolateBarInteractive.tsx` | **Creado** | Manipulador interactivo de barra de chocolate de 6 trozos donde el alumno toca directamente para comer trozos y descubre la equivalencia con 1/3. |
| `components/exercises/RelationalComparisonInteractive.tsx` | **Creado** | Tablero relacional interactivo con barras paralelas y puente de amplificación (factor ×2 en numerador y denominador). |
| `components/exercises/CrossProductInteractive.tsx` | **Creado** | Calculadora paso a paso de productos cruzados (`3×8=24` y `4×6=24`), permitiendo al alumno probar y verificar la regla matemática. |
| `components/exercises/SimplificationInteractive.tsx` | **Creado** | Constructor guiado de simplificación por divisor común (3) con cajas de cálculo interactivo para numerador y denominador. |
| `features/student/InteractivePracticeRunner.tsx` | **Modificado Integralmente** | Orquestador pedagógico del alumno en 2 columnas (zona interactiva + Robot Tutor activo), barra de progresión de 5 pasos, cálculo auténtico de puntaje (+28 puntos delta) y registro de evidencia. |

### C. Arquitectura MCP y Preparación Técnica Amazon Alexa+
| Componente | Tipo | Descripción |
|---|---|---|
| `mcp/server/index.ts` | **Creado** | Servidor MCP autohospedado ejecutable en Node.js, compatible con la especificación `2025-11-25`. |
| `mcp/server/transport.ts` | **Creado** | Capa de transporte Streamable HTTP y Server-Sent Events (SSE) con endpoints `/mcp` y `/health`. |
| `mcp/server/schemas.ts` | **Creado / Ampliado** | Schemas formales JSON Schema para validación estricta de parámetros de entrada de las 15 herramientas MCP. |
| `mcp/server/tools.ts` | **Creado / Ampliado** | Registro de 15 herramientas pedagógicas (7 docentes + 8 Alexa+ conversacionales). |
| `mcp/server/alexa-service.ts` | **Creado** | Implementación de las 8 herramientas conversacionales Alexa+, interceptor `enforceTenantAndRole` (aislamiento multi-tenant y defensa IDOR). |
| `lib/tools/oral-normalizer.ts` | **Creado** | Motor de normalización fonética y semántica de respuestas orales en español para niños de primaria. |
| `components/AlexaPlusSimulatorModal.tsx` | **Creado** | Simulador visual interactivo de dispositivo Echo Show / Alexa+ con inspector JSON-RPC 2.0 y pruebas de seguridad en vivo. |
| `lib/mcp/client.ts` | **Creado / Ampliado** | Cliente MCP Streamable HTTP en Next.js con autodescubrimiento, control de latencia, wrappers de conveniencia y fallback local transparente para las 15 herramientas. |
| `docs/AMAZON_MCP_ARCHITECTURE.md` | **Creado / Ampliado** | Especificación técnica formal de la arquitectura Alexa+, servidor MCP Streamable HTTP, diagramas, esquemas, seguridad y cURL. |
| `docs/HACKATHON_ISSUE_LOG.md` | **Creado / Ampliado** | Registro de 7 incidencias técnicas reales diagnosticadas y resueltas durante el hackathon. |

### D. Pruebas y Validación E2E
| Archivo | Tipo | Cobertura |
|---|---|---|
| `tests/tutor-flow.test.ts` | **Creado / Consolidado** | 9 pruebas unitarias del flujo pedagógico docente-alumno y andamiaje progresivo. |
| `tests/judge-demo-submission.test.ts` | **Creado / Ampliado** | 7 pruebas de reproducibilidad de demostración, reset, catálogo de 15 herramientas y fallback local. |
| `tests/mcp-server.test.ts` | **Creado** | 11 pruebas de endpoints HTTP, JSON-RPC 2.0, SSE y schemas del servidor MCP. |
| `tests/alexa-mcp-flow.test.ts` | **Creado** | 16 pruebas del recorrido conversacional completo en servidor Streamable HTTP real (puerto 3199), normalización oral, rechazo multi-tenant y rechazo IDOR. |
| `tests/didactic-interactive-exercises.test.ts` | **Creado** | 8 pruebas de interactividad didáctica, manipuladores y andamiaje del Robot Tutor. |
| `scripts/capture-interactive-screenshots.mjs` | **Creado** | Suite de automatización E2E en Edge Headless (CDP) que captura el recorrido completo en resoluciones de escritorio (1440x900) y móvil (390x844). |
| **Total Cobertura Automatizada** | **5 Suites** | **51 / 51 pruebas automatizadas pasando al 100%.** |

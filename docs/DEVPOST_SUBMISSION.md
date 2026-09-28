# Devpost Submission Draft: MACHTIA Adaptive Tutor

### PROJECT NAME
MACHTIA Adaptive Tutor

---

### TAGLINE
Detecta quién necesita ayuda, crea la práctica adecuada y acompaña al alumno hasta comprobar si aprendió.

---

### PROBLEM
En las aulas de educación básica, un maestro atiende a más de 30 estudiantes al mismo tiempo. Aunque las evaluaciones diagnósticas evidencian rápidamente que algunos alumnos tienen dificultades en temas fundamentales (como fracciones con puntajes de 52%), identificar la raíz cognitiva de cada error individual y diseñar una intervención personalizada consume horas que los docentes simplemente no tienen. 

Como consecuencia, los alumnos que tropiezan con conceptos específicos (por ejemplo, confundir denominadores o cometer errores al simplificar) quedan rezagados sin un andamiaje formativo que les explique el porqué antes de exigirles respuestas.

---

### SOLUTION
MACHTIA Adaptive Tutor es un agente educativo inteligente que une el diagnóstico docente con el acompañamiento activo del alumno. En lugar de limitarse a calificar o sugerir respuestas, el tutor:
1. Detecta brechas conceptuales concretas mediante herramientas especializadas.
2. Prescribe ejercicios interactivos adaptados con andamiaje visual progresivo.
3. Enseña antes de preguntar, proporcionando pistas formativas sin regalar la respuesta y reformulando explicaciones con analogías cotidianas si el alumno vuelve a fallar.
4. Calcula el desempeño real y devuelve al profesor una evidencia clara de avance (Antes vs. Después) que demuestra la asimilación del aprendizaje.

---

### WHAT IT DOES
- **Para el Profesor:** Permite supervisar al grupo (3° B en Matemáticas), consultar en lenguaje natural quién necesita apoyo, recibir un desglose de brechas específicas (Mariana López con 52% por confusión en comparación de denominadores), generar prácticas de refuerzo con un solo clic y auditar la evidencia de progreso posterior (+28 puntos porcentuales de mejora).
- **Para el Alumno:** Ofrece un entorno seguro y estimulante donde el Tutor IA explica visualmente con barras de fracciones proporcionales antes de comenzar. Si el alumno se equivoca, recibe apoyo en 3 niveles (Nivel 1: Pista orientadora sin revelar la respuesta; Nivel 2: Explicación alternativa con analogía cotidiana; Nivel 3: Ejemplo guiado paso a paso).
- **Para el Ecosistema Educativo:** Registra evidencias auditables con conceptos dominados y pendientes, calculados estrictamente a partir de las respuestas auténticas del estudiante.

---

### HOW IT WORKS
1. **Detección:** El profesor pregunta al agente orquestador quién requiere refuerzo. El agente invoca las herramientas MCP `analyze_student_performance` y `find_students_needing_support`, identificando a los estudiantes bajo el umbral de 65%.
2. **Diagnóstico Conceptual:** Con `get_student_learning_gap`, el agente extrae la causa raíz del rezago de Mariana López: comete errores recurrentes en comparación de denominadores.
3. **Prescripción:** Se ejecuta `generate_adaptive_practice` y `assign_practice_to_student`, calibrando 5 ejercicios interactivos con barras fraccionarias y andamiaje cognitivo.
4. **Tutoría Interactiva:** La alumna ingresa a su portal. Antes del reactivo 1, el tutor presenta una explicación gráfica de por qué 1/2 y 2/4 cubren la misma porción del entero. Durante los ejercicios, evalúa mediante `evaluate_answer`, ajusta la dificultad con `adapt_difficulty` y ofrece pistas sin entregar la respuesta directa.
5. **Comprobación:** Al concluir los reactivos, el sistema calcula la calificación real (80%), almacena la evidencia mediante `save_learning_evidence` y genera la comparativa antes (52%) vs después (80%) con `report_progress_to_teacher`.

---

### HOW WE BUILT IT
- **Frontend y Experiencia de Usuario:** Desarrollado con Next.js 14 (App Router), React 18, TypeScript y Tailwind CSS, optimizado para visualizaciones pedagógicas nítidas a resoluciones de 1440x900 y 1920x1080.
- **Protocolo de Herramientas:** Implementación estricta de la especificación Model Context Protocol (MCP) versión `2025-11-25`, con transporte Streamable HTTP, Server-Sent Events (SSE) y JSON-RPC 2.0.
- **Componentes Pedagógicos:** Diseñamos el `FractionBarVisualizer` interactivo y un motor de andamiaje progresivo en 3 niveles que garantiza que el alumno razone en lugar de memorizar.
- **Testing y Fiabilidad:** Suite integral de 20+ pruebas automatizadas en Vitest que validan tanto el flujo pedagógico como la conformidad de los esquemas y endpoints del servidor MCP.

---

### ALEXA+ / MCP INTEGRATION
La visión de Alexa+ transforma la interacción en el aula y el hogar al conectar el diálogo por voz con acciones tangibles en el mundo real. Gracias al Model Context Protocol (MCP 2025-11-25) y su transporte Streamable HTTP:
- Alexa+ no solo responde preguntas; ejecuta herramientas concretas para auditar expedientes de clase, calibrar prácticas y registrar progresos verificables.
- Permite experiencias multimodales en dispositivos como Echo Show, donde la voz del tutor se complementa en pantalla con barras interactivas de fracciones y gráficos de desempeño para el maestro.
- El servidor MCP expone endpoints estandarizados (`/mcp` para JSON-RPC y streaming SSE, y `/health` para telemetría activa), permitiendo que cualquier cliente compatible orqueste herramientas pedagógicas con seguridad y aislamiento.

---

### CHALLENGES
- **Pedagogía frente a la tentación de "resolver":** Los modelos de lenguaje tienden naturalmente a dar la respuesta correcta inmediata. Diseñar un sistema de andamiaje estricto donde el tutor formule pistas orientadoras y explicaciones alternativas sin revelar la solución fue uno de los mayores retos pedagógicos.
- **Conformidad con la especificación MCP 2025-11-25:** Implementar el transporte Streamable HTTP con JSON-RPC 2.0 y SSE compatible con Node.js y navegadores, manteniendo resiliencia de fallback local cuando el servidor no esté en línea.
- **Cálculo de resultados auténticos:** Evitar resultados fijos o artificiales, garantizando que el delta de mejora provenga directamente de los reactivos respondidos por la alumna.

---

### ACCOMPLISHMENTS
- Creamos un agente educativo que demuestra un flujo completo, reproducible y pedagógicamente sólido de 5 etapas: Detección → Diagnóstico → Prescripción → Tutoría → Evidencia.
- Logramos una arquitectura MCP transparente con telemetría en tiempo real accesible tanto para usuarios no técnicos como para jurados técnicos mediante el botón "Ver detalles técnicos".
- 25/25 pruebas automatizadas pasando con análisis estático, verificación de tipos y compilación limpia de producción.

---

### WHAT WE LEARNED
- La personalización educativa no requiere generar contenido infinito, sino calibrar el apoyo en el momento exacto en que ocurre el error cognitivo.
- Model Context Protocol (MCP) es el estándar ideal para desacoplar el cerebro del agente de la lógica pedagógica y los datos institucionales.

---

### WHAT'S NEXT
- Conexión nativa con skills y widgets multimodales para dispositivos Amazon Echo Show.
- Expansión del catálogo curricular a fracciones heterogéneas, álgebra introductoria y comprensión lectora.
- Integración con Google Classroom y Microsoft Teams para sincronización automática de evidencias docentes.

---

### TECH STACK
- **Framework:** Next.js 14, React 18
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS
- **Protocolo de Agentes:** Model Context Protocol (MCP) versión 2025-11-25 (Streamable HTTP, SSE, JSON-RPC 2.0)
- **Testing:** Vitest (25/25 passing)
- **Efectos e Interactividad:** Lucide React, Canvas Confetti

---

### SCREENSHOTS & EVIDENCE GALLERY
1. **01 - Landing & MCP Telemetry:** `docs/screenshots/01-landing-and-mcp-status.png`  
   *Presentación de la propuesta de valor y estado de conexión en vivo con el servidor MCP.*
2. **02 - Diagnóstico Docente & Prescripción Adaptativa:** `docs/screenshots/02-teacher-alert-and-prescription.png`  
   *Detección de Mariana López (52%), consulta de causas cognitivas raíz y generación de práctica de apoyo.*
3. **03 - Explicación Previa Guiada:** `docs/screenshots/03-student-pre-explanation.png`  
   *El tutor enseña visualmente mediante `FractionBarVisualizer` antes de formular preguntas.*
4. **04 - Pistas Adaptativas Nivel 1:** `docs/screenshots/04-student-adaptive-hints.png`  
   *Andamiaje formativo tras error en reactivo 2 sin regalar la solución.*
5. **05 - Resultado Auténticamente Calculado:** `docs/screenshots/05-student-result-calculated.png`  
   *Calificación final real (80%, 4/5 reactivos, +28 puntos porcentuales de mejora).*
6. **06 - Evidencia de Aprendizaje Antes vs. Después:** `docs/screenshots/06-teacher-before-after-evidence.png`  
   *Tarjeta de evidencia comparativa en el panel docente (Antes 52% → Después 80%).*

---

### LINKS
- **FRONTEND DEPLOYMENT:** `https://machtia-tutor.vercel.app` *(Pendiente vinculación Vercel)*
- **MCP SERVER DEPLOYMENT:**
  - Health Check: `https://machtia-tutor-mcp-server.onrender.com/health` *(Pendiente vinculación Render)*
  - Endpoint MCP: `https://machtia-tutor-mcp-server.onrender.com/mcp`
- **REPOSITORY URL:** `https://github.com/dyann1984/machtia-adaptive-tutor`
- **VIDEO DEMO:** *(Pendiente de grabación por el usuario; guion estructurado en `docs/VIDEO_DEMO_SCRIPT.md`)*

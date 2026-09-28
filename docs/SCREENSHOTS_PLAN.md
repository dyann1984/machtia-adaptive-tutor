# Plan de Capturas de Pantalla (Screenshots Guide)

**MACHTIA Adaptive Tutor — Hackathon Amazon / Alexa+**  
**Resoluciones recomendadas:** 1920x1080 o 1440x900 en navegador maximizado (modo claro, SaaS limpio).

---

### Captura 1: Landing
- **Ruta:** `/` (Estado inicial al cargar la página)
- **Elementos clave a encuadrar:**
  - Header con logo nítido de MACHTIA y descriptor *"Adaptive Tutor"*.
  - Badges: *"Built for Amazon Alexa+ Developer Hackathon"* y *"Powered by Model Context Protocol"*.
  - Tagline destacada: *“Detecta quién necesita ayuda, crea la práctica adecuada y acompaña al alumno hasta comprobar si aprendió.”*
  - Botón principal: *“Iniciar demostración”*.
  - Flujo visual de 5 pasos en la parte inferior.

---

### Captura 2: Profesor — Detección de Alumnos
- **Ruta:** `/` (Rol Profesor → Pestaña *Alumnos con rezago* o *Dashboard*)
- **Elementos clave a encuadrar:**
  - Grupo: 3° B • Materia: Matemáticas.
  - Alerta de 2 alumnos que necesitan apoyo: Mariana López (52%) y Luis Hernández (58%).
  - Brecha conceptual visible: *Comparación de denominadores*.
  - Botón de acción: *“Generar práctica personalizada”*.

---

### Captura 3: Agent Activity + MCP Connected
- **Ruta:** `/` (Rol Profesor → Pestaña *Tutor IA (Agente)*)
- **Elementos clave a encuadrar:**
  - Píldora de estado en verde brillante: **`MCP: Connected (Streamable HTTP 2025-11-25)`**.
  - Badge de *Alexa+ Experience Simulation*.
  - Conversación con el agente mostrando ejecución de herramientas MCP (`find_students_needing_support`, `get_student_learning_gap`).
  - Columna derecha con telemetría de herramientas y botón *“Ver detalles técnicos”*.

---

### Captura 4: Mariana — Práctica Asignada
- **Ruta:** `/` (Rol Alumna → Pestaña *Mis Prácticas*)
- **Elementos clave a encuadrar:**
  - Tarjeta de práctica activa: *“Fracciones equivalentes — Refuerzo guiado por Tutor IA”*.
  - Estado: *“Asignada / Pendiente”* con 5 reactivos calibrados.
  - Botón: *“Comenzar práctica interactiva”*.

---

### Captura 5: Tutor Explicando Fracciones
- **Ruta:** `/` (Rol Alumna → Ejecución de práctica → Fase 1: Explicación)
- **Elementos clave a encuadrar:**
  - Progresión visual de 5 etapas: `1. Explicación → 2. Práctica → 3. Pista → 4. Nueva explicación → 5. Evidencia`.
  - Frase pedagógica: *“Antes de empezar, vamos a entender por qué 1/2 y 2/4 representan la misma cantidad.”*
  - Componente **FractionBarVisualizer** mostrando las barras proporcionales coloreadas.
  - Consejo del tutor con el secreto del denominador.

---

### Captura 6: Comparación 52% → 80% (Evidencia Docente)
- **Ruta:** `/` (Rol Profesor → Pestaña *Progreso Antes/Después*)
- **Elementos clave a encuadrar:**
  - Tarjeta de auditoría docente:
    - **Estudiante:** Mariana López
    - **ANTES:** `52%` (Diagnóstico inicial)
    - **DESPUÉS:** `80%` (Práctica con Tutor IA)
    - **MEJORA:** `+28 puntos porcentuales`
    - **Dominado:** Identificación de equivalencias
    - **Pendiente:** Simplificación
  - Leyenda al pie: *“Resultado generado a partir de la práctica realizada.”*

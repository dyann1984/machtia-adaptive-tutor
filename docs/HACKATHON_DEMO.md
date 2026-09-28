# Guion de Video Demo: MACHTIA Adaptive Tutor

**Competición:** Amazon / Alexa+ Developer Hackathon  
**Objetivo de duración:** 2:30 a 2:50 minutos  
**Formato:** Grabación de pantalla con voz en off (1920x1080 o 1440x900)  

---

## Estructura Minuto a Minuto

### 0:00 – 0:15 | El Problema
- **Audio (Voz en off):**  
  *“Un profesor puede saber que un alumno va mal, pero saber exactamente qué necesita y darle atención individual toma tiempo.”*
- **Pantalla:**  
  Vista de la Landing inicial de MACHTIA Adaptive Tutor. Mostrar el descriptor nítido y la propuesta pedagógica: *"Detecta quién necesita ayuda, crea la práctica adecuada y acompaña al alumno hasta comprobar si aprendió."*

---

### 0:15 – 0:30 | La Solución
- **Audio (Voz en off):**  
  *“MACHTIA Adaptive Tutor convierte esa evidencia en intervención personalizada. Es un agente educativo impulsado por Model Context Protocol que detecta brechas conceptuales, prescribe ejercicios adaptativos y acompaña al estudiante con andamiaje activo.”*
- **Pantalla:**  
  Clic en el botón **“Iniciar demostración”**. Transición fluida al Panel del Profesor (Prof. Carlos Vega, Grupo 3° B).

---

### 0:30 – 1:05 | Diagnóstico con el Agente (Rol Profesor)
- **Audio (Voz en off):**  
  *“En el aula, el docente consulta al agente orquestador: '¿Quién necesita apoyo en matemáticas?'. A través de herramientas MCP en tiempo real, el agente examina el desempeño del grupo, detecta que fracciones equivalentes es el tema crítico e identifica a dos alumnos con rezago: Mariana López con 52% y Luis Hernández con 58%. Además, diagnostica la brecha concreta: Mariana confunde denominadores al comparar fracciones.”*
- **Pantalla:**  
  - En la pestaña **Tutor IA**, hacer clic en el botón de acción rápida:  
    `"1. ¿Quién necesita apoyo en matemáticas?"`
  - Mostrar en pantalla:
    - **Agent Activity:** Badges limpios de `AGENT`, `MCP`, `TOOL` (`find_students_needing_support`, `get_student_learning_gap`) y `RESULT`.
    - Indicador de estado real: **MCP: Connected (Streamable HTTP 2025-11-25)**.
    - Datos diagnósticos de Mariana López (52%) y Luis Hernández (58%).

---

### 1:05 – 1:25 | Prescripción Adaptativa mediante MCP
- **Audio (Voz en off):**  
  *“Con un solo clic, el profesor solicita: 'Crear práctica de apoyo'. El agente invoca las herramientas MCP `generate_adaptive_practice` y `assign_practice_to_student`, calibrando cinco ejercicios con andamiaje visual dirigidos específicamente al error de Mariana, asignándolos de inmediato a su expediente.”*
- **Pantalla:**  
  - Clic en el botón: `"Crear práctica de apoyo (5 reactivos)"`.
  - Se visualizan las llamadas MCP con duración en milisegundos y la notificación de práctica asignada en estado `pending`.

---

### 1:25 – 2:05 | Acompañamiento y Tutoría Activa (Rol Alumna)
- **Audio (Voz en off):**  
  *“Cambiamos al rol de la alumna. Mariana recibe la práctica asignada. Pero antes de preguntar, el Tutor IA enseña: muestra una barra interactiva explicando visualmente por qué 1/2 y 2/4 representan exactamente la misma porción del entero.  
  Al iniciar los ejercicios, Mariana comete un primer error: el tutor no regala la respuesta, sino que activa una pista formativa. En un segundo intento con explicación alternativa cotidiana, Mariana comprende la relación y resuelve correctamente. El tutor adapta la dificultad en vivo.”*
- **Pantalla:**  
  - Clic en el encabezado superior: **Rol: Alumna (Mariana)**.
  - Mostrar la progresión visual superior:  
    `1. Explicación → 2. Práctica → 3. Pista → 4. Nueva explicación → 5. Evidencia`.
  - **FractionBarVisualizer** mostrando las barras de 1/2 y 2/4.
  - En el ejercicio: seleccionar opción incorrecta en intento 1 → ver tarjeta de **Pista del Tutor (Nivel 1)**.
  - Pulsar *"Intentar de nuevo con la pista"* → seleccionar opción correcta → ver retroalimentación positiva y avance adaptativo.
  - Completar los reactivos y presenciar la celebración con confeti.

---

### 2:05 – 2:30 | Evidencia Comprobada Antes vs. Después (Rol Profesor)
- **Audio (Voz en off):**  
  *“Al terminar la práctica, el sistema no inventa números: calcula el puntaje auténtico de las respuestas obtenidas. Mariana logra un 80%, superando su diagnóstico de 52%.  
  Regresamos al panel docente: el profesor tiene evidencia clara e indiscutible: 52% inicial a 80% final, una mejora de +28 puntos porcentuales, con conceptos dominados y recomendaciones para la siguiente sesión.”*
- **Pantalla:**  
  - Clic en *"Guardar evidencia y regresar al Panel del Profesor"*.
  - Mostrar la tarjeta de auditoría pedagógica en **Progreso Antes/Después**:
    - **Mariana López**
    - **ANTES:** `52%`
    - **DESPUÉS:** `80%`
    - **MEJORA:** `+28 puntos porcentuales`
    - **Materia:** Matemáticas • **Tema:** Fracciones equivalentes
    - **Dominado:** Identificación de equivalencias
    - **Pendiente:** Simplificación
    - Leyenda: *“Resultado generado a partir de la práctica realizada.”*

---

### 2:30 – 2:45 | Arquitectura y Conexión Alexa+ / MCP
- **Audio (Voz en off):**  
  *“Esta experiencia está construida sobre una arquitectura abierta y robusta:  
  Alexa+ Experience → Tutor Agent Orchestrator → Model Context Protocol (Streamable HTTP 2025-11-25) → Educational Tools.  
  El docente puede pulsar 'Ver detalles técnicos' en cualquier momento para inspeccionar la salud del endpoint `/health`, esquemas validados y tiempos de ejecución del servidor.”*
- **Pantalla:**  
  - En la pestaña **Tutor IA**, activar el botón **“Ver detalles técnicos”**.
  - Mostrar el panel de salud `/health` (Protocolo 2025-11-25, Streamable HTTP, 7 Tools registradas, latencia en ms, JSON de entrada y salida).

---

### 2:45 – 2:50 | Cierre
- **Audio (Voz en off):**  
  *“MACHTIA Adaptive Tutor: detecta, interviene, acompaña y demuestra aprendizaje.”*
- **Pantalla:**  
  Logo central de MACHTIA Adaptive Tutor con la leyenda:  
  *Built for Amazon Alexa+ Developer Hackathon • Powered by Model Context Protocol*.

---

## Consejos para la Grabación
1. **Resolución sugerida:** 1920x1080 a 60 fps o 1440x900.
2. **Audio:** Micrófono claro, sin ruido de fondo y dicción pausada.
3. **Repetición limpia:** Si se desea repetir una toma, utilizar el botón **"Reiniciar demostración"** en el banner superior; este restaura los datos instantáneamente sin dejar residuos.

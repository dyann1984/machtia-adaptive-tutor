# Guion de Demostración: MACHTIA Adaptive Tutor (3 Minutos)

**Hackathon Amazon / Alexa+ & Nebius / NVIDIA**  
**Proyecto:** MACHTIA Adaptive Tutor  
**Flujo Principal:** Profesor → Tutor IA → Alumno → Evidencia de Aprendizaje

---

## 🎯 Objetivo de la Demostración
Demostrar en vivo cómo un Agente Tutor con arquitectura MCP y razonamiento pedagógico adaptativo detecta rezagos curriculares específicos en un grupo de primaria (3° B en Fracciones Equivalentes), prescribe una práctica interactiva paso a paso para el alumno, adapta la dificultad en tiempo real y devuelve al profesor una evidencia cuantitativa y cualitativa de mejora (**52% → 80%**).

---

## ⏱️ Minuto a Minuto (Duración total: 2:45 min)

### 0:00 - 0:35 | Introducción y Detección con el Agente (Rol Profesor)
1. **Pantalla inicial:** Dashboard del Profesor (Prof. Carlos Vega, Grupo 3° B).
2. **Explicación del problema:** *"En un aula con 30 alumnos, el profesor no tiene tiempo de crear una práctica personalizada para cada error conceptual recurrente."*
3. **Acción en vivo:**
   - Hacer clic en el botón superior o escribir en la pantalla de **Tutor IA**:  
     `"¿Quién necesita apoyo en matemáticas?"`
4. **Lo que ve el jurado:**
   - Animación de razonamiento y telemetría de herramientas MCP:  
     `✓ Consultó desempeño (analyze_student_performance)`  
     `✓ Detectó patrones (find_students_needing_support)`  
     `✓ Identificó brechas (get_student_learning_gap)`
   - El Tutor responde:  
     *"He detectado 2 alumnos que necesitan refuerzo en fracciones equivalentes: Mariana López (52%) y Luis Hernández (58%)."*
   - Muestra la evidencia: *Mariana presenta dificultad al comparar denominadores.*

---

### 0:35 - 1:15 | Prescripción y Generación Adaptativa
1. **Acción en vivo:**
   - El profesor selecciona a **Mariana López** y pulsa:  
     `"Generar práctica personalizada"`
2. **Lo que ve el jurado:**
   - El agente ejecuta `generate_adaptive_practice()` y `assign_practice_to_student()`.
   - Genera 5 ejercicios calibrados con soporte visual (barras de fracciones proporcionales) dirigidos específicamente a corregir su confusión de denominadores.
   - La práctica queda asignada instantáneamente al portal del alumno.

---

### 1:15 - 2:05 | Experiencia del Alumno y Resolución Guiada (Rol Alumna)
1. **Acción en vivo:**
   - Cambiar de rol en la barra superior al botón: **Rol: Alumna (Mariana)**.
2. **Lo que ve el jurado:**
   - Mariana ve la notificación: *"Nueva práctica asignada: Fracciones equivalentes"*.
   - Pulsa *"Comenzar práctica ahora"*.
3. **Paso A - Explicación interactiva:**
   - El Tutor IA saluda: *"¡Hola Mariana! Antes de comenzar, te explicaré una forma sencilla de identificar fracciones equivalentes con barras de chocolate..."*
   - Muestra la barra interactiva demostrando que `1/2 = 2/4` porque ocupan el mismo espacio gráfico.
4. **Paso B - Ejercicios interactivos con pistas:**
   - Ejercicio 1: Selecciona `2/4`. El Tutor valida y refuerza positivamente.
   - En caso de error simulado en intento 1: El Tutor no castiga; ofrece una **pista formativa** y permite un **segundo intento**, adaptando la dificultad del siguiente ejercicio.
5. **Paso C - Finalización y Celebración:**
   - Termina los 5 reactivos.
   - Explosión de confeti en pantalla. Calificación: **80%** (4 de 5 aciertos).
   - Conceptos dominados: *Equivalencia visual de 1/2* y *Amplificación por factor 2*.
   - Mariana pulsa: *"Guardar evidencia y regresar al Panel del Profesor"*.

---

### 2:05 - 2:45 | Cierre: Evidencia de Aprendizaje y Comparativa (Rol Profesor)
1. **Acción en vivo:**
   - El sistema regresa al panel del profesor (o pestaña **Progreso Antes/Después**).
   - El profesor consulta: `"¿Mejoró Mariana López?"`
2. **Lo que ve el jurado:**
   - Tarjeta comparativa con métricas reales:
     - **ANTES (Diagnóstico inicial):** `52%`
     - **DESPUÉS (Práctica con Tutor):** `80%`
     - **DELTA:** `+28%`
     - **ESTADO:** `Mejora detectada`
   - Auditoría cualitativa: Conceptos dominados vs. conceptos pendientes para el siguiente ciclo.
3. **Cierre de impacto (Discurso final):**
   *"Con MACHTIA Adaptive Tutor cerramos la brecha educativa. No es solo un chatbot; es un agente orquestador compatible con MCP que diagnostica, prescribe, enseña interactivamente y demuestra el progreso medible de cada niño."*

---

## 🛠️ Plan de Contingencia / Tips para el Presentador
- **Botón de Reinicio Rápido:** Si deseas repetir la demo desde cero, pulsa el botón **"Reiniciar Demo"** ubicado en el encabezado superior derecho.
- **Botones de un clic:** Toda la secuencia cuenta con botones de acción rápida precargados en la pantalla del Tutor IA para evitar errores de escritura durante el video o presentación en vivo.

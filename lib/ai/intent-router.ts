/**
 * MACHTIA Adaptive Tutor - Educational Intent Router & Curricular Knowledge Engine (v2.0)
 *
 * Directs student questions with strict pedagogical boundaries:
 * 1. "practice_hint" & "practice_evaluation": Only triggered when asking specifically
 *    about the current exercise, a hint, or checking answers.
 * 2. "history_culture": History, discoveries, pre-hispanic cultures, Mexican & world history.
 *    Specifically addresses: "¿Quién descubrió América?", Cristóbal Colón (1492),
 *    and the original indigenous civilizations (Taínos, Mayas, Mexicas, Incas).
 * 3. "math_concept": General mathematics outside current practice (fractions, fractions comparison,
 *    multiplication, division, geometry, percentages).
 * 4. "reformulation": When the student says "no entendí", "explícamelo de otra manera", or "otro ejemplo",
 *    adapts the previous turn's topic using a completely different, simpler analogy (coins, toys, food).
 * 5. "science_nature": Space, universe, dinosaurs, light/sky, rain, volcanoes, plants, biology.
 * 6. "general_curiosity": Daily life, technology, study habits, languages (English/Spanish).
 */

export type StudentIntent =
  | "practice_hint"
  | "practice_direct_answer"
  | "practice_error_help"
  | "reformulation"
  | "diagnostic_inquiry"
  | "history_america"
  | "history_mexico"
  | "math_fractions_concept"
  | "math_general"
  | "science_space"
  | "science_dinosaurs"
  | "science_nature"
  | "language_english"
  | "technology_coding"
  | "general_curiosity";

export interface IntentClassification {
  intent: StudentIntent;
  confidence: number;
  extractedTopic: string;
  isEvaluatingExercise: boolean;
}

export function cleanPrompt(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Classifies the student's prompt into a precise educational intent.
 * Crucially, if the user asks a history or general question, it NEVER
 * classifies it as a practice hint, even if the student is currently practicing!
 */
export function classifyStudentIntent(
  rawPrompt: string,
  isInPracticeMode: boolean = false,
  hasActiveExercise: boolean = false
): IntentClassification {
  const q = cleanPrompt(rawPrompt);

  // 1. Diagnostic / Performance queries
  if (
    q.includes("diagnostico") ||
    q.includes("calificacion") ||
    q.includes("mi progreso") ||
    q.includes("como voy") ||
    q.includes("brecha") ||
    (q.includes("mariana") && (q.includes("rezago") || q.includes("apoyo") || q.includes("nivel")))
  ) {
    return {
      intent: "diagnostic_inquiry",
      confidence: 0.95,
      extractedTopic: "Diagnóstico Pedagógico",
      isEvaluatingExercise: false,
    };
  }

  // 2. Explicit History Questions (America, Columbus, Indigenous peoples)
  if (
    (q.includes("descubr") && (q.includes("america") || q.includes("continente") || q.includes("tierra"))) ||
    q.includes("cristobal colon") ||
    q.includes("colon") && (q.includes("carabela") || q.includes("barco") || q.includes("1492") || q.includes("viaje")) ||
    q.includes("quien descubrio") ||
    q.includes("descubrimiento de america") ||
    q.includes("llegada a america")
  ) {
    return {
      intent: "history_america",
      confidence: 0.98,
      extractedTopic: "Historia · La llegada a América y Pueblos Originarios",
      isEvaluatingExercise: false,
    };
  }

  // 3. Mexican and ancient civilizations history
  if (
    q.includes("azteca") ||
    q.includes("mexica") ||
    q.includes("maya") ||
    q.includes("piramide") ||
    q.includes("tenochtitlan") ||
    q.includes("independencia") ||
    q.includes("revolucion") ||
    q.includes("hidalgo") ||
    q.includes("zapata") ||
    q.includes("mexico antiguo")
  ) {
    return {
      intent: "history_mexico",
      confidence: 0.95,
      extractedTopic: "Historia de México",
      isEvaluatingExercise: false,
    };
  }

  // 4. Reformulation requests ("no entendí", "explícamelo de otra manera")
  if (
    q.includes("no entendi") ||
    q.includes("de otra manera") ||
    q.includes("de otra forma") ||
    q.includes("otro ejemplo") ||
    q.includes("mas facil") ||
    q.includes("mas sencillo") ||
    q.includes("no me quedo claro") ||
    q.includes("sigo sin entender") ||
    q.includes("no le entiendo")
  ) {
    return {
      intent: "reformulation",
      confidence: 0.95,
      extractedTopic: "Explicación Alternativa Adaptativa",
      isEvaluatingExercise: false,
    };
  }

  // 5. Practice-specific questions (ONLY when actively in a practice AND asking about the exercise)
  if (hasActiveExercise || isInPracticeMode) {
    // A) Asking for the direct answer/letter
    if (
      q.includes("dime la respuesta") ||
      q.includes("cual es la respuesta") ||
      q.includes("cual es la a") ||
      q.includes("cual es la b") ||
      q.includes("cual es la c") ||
      q.includes("cual es la d") ||
      q.includes("cual elijo") ||
      q.includes("que letra pongo") ||
      q.includes("dame la solucion")
    ) {
      return {
        intent: "practice_direct_answer",
        confidence: 0.95,
        extractedTopic: "Andamiaje Socrático · Protección de Respuesta",
        isEvaluatingExercise: true,
      };
    }

    // B) Reporting an error on the exercise
    if (
      q.includes("me equivoque") ||
      q.includes("salio mal") ||
      q.includes("por que esta mal") ||
      q.includes("falle") ||
      q.includes("no era") ||
      q.includes("incorrecto")
    ) {
      return {
        intent: "practice_error_help",
        confidence: 0.92,
        extractedTopic: "Reflexión Formativa de Error",
        isEvaluatingExercise: true,
      };
    }

    // C) Explicitly asking for a hint or help with the exercise
    if (
      q.includes("pista") ||
      q.includes("ayuda con este ejercicio") ||
      q.includes("como resuelvo este") ||
      q.includes("no se que hacer aqui") ||
      q.includes("ayudame con mi ejercicio") ||
      q.includes("que hago aqui")
    ) {
      return {
        intent: "practice_hint",
        confidence: 0.9,
        extractedTopic: "Pista Didáctica del Ejercicio",
        isEvaluatingExercise: true,
      };
    }
  }

  // 6. Math Concepts: Fractions explanation (un medio, un cuarto, fracciones equivalentes)
  if (
    q.includes("un medio") ||
    q.includes("un cuarto") ||
    q.includes("1 2") ||
    q.includes("1 4") ||
    q.includes("que es una fraccion") ||
    q.includes("explicame las fracciones") ||
    q.includes("fraccion equivalente") ||
    q.includes("numerador y denominador") ||
    q.includes("denominador") ||
    q.includes("numerador")
  ) {
    return {
      intent: "math_fractions_concept",
      confidence: 0.92,
      extractedTopic: "Matemáticas · Concepto de Fracciones",
      isEvaluatingExercise: false,
    };
  }

  // 7. General Math (multiplication, tables, addition, geometry)
  if (
    q.includes("tabla") ||
    q.includes("multiplic") ||
    q.includes("division") ||
    q.includes("dividir") ||
    q.includes("sumar") ||
    q.includes("restar") ||
    q.includes("geometria") ||
    q.includes("figura")
  ) {
    return {
      intent: "math_general",
      confidence: 0.88,
      extractedTopic: "Matemáticas y Operaciones",
      isEvaluatingExercise: false,
    };
  }

  // 8. Science & Universe (space, black holes, solar system)
  if (
    q.includes("agujero negro") ||
    q.includes("espacio") ||
    q.includes("planeta") ||
    q.includes("sol") ||
    q.includes("luna") ||
    q.includes("estrella") ||
    q.includes("marte") ||
    q.includes("astronauta")
  ) {
    return {
      intent: "science_space",
      confidence: 0.9,
      extractedTopic: "Ciencias · Astronomía y el Espacio",
      isEvaluatingExercise: false,
    };
  }

  // 9. Science: Dinosaurs & fossils
  if (
    q.includes("dinosaurio") ||
    q.includes("t rex") ||
    q.includes("fosil") ||
    q.includes("velociraptor") ||
    q.includes("extincion")
  ) {
    return {
      intent: "science_dinosaurs",
      confidence: 0.92,
      extractedTopic: "Paleontología · Dinosaurios",
      isEvaluatingExercise: false,
    };
  }

  // 10. Science & Nature (sky color, rain, volcanoes, animals)
  if (
    (q.includes("cielo") && q.includes("azul")) ||
    q.includes("lluvia") ||
    q.includes("volcan") ||
    q.includes("animal") ||
    q.includes("planta") ||
    q.includes("agua")
  ) {
    return {
      intent: "science_nature",
      confidence: 0.88,
      extractedTopic: "Ciencias Naturales y la Tierra",
      isEvaluatingExercise: false,
    };
  }

  // 11. Language: English / Vocabulary
  if (
    q.includes("ingles") ||
    q.includes("como se dice") ||
    q.includes("dog") ||
    q.includes("cat")
  ) {
    return {
      intent: "language_english",
      confidence: 0.9,
      extractedTopic: "Inglés y Vocabulario",
      isEvaluatingExercise: false,
    };
  }

  // 12. Technology: Programming & Robots
  if (
    q.includes("programacion") ||
    q.includes("programar") ||
    q.includes("codigo") ||
    q.includes("robot") ||
    q.includes("computadora")
  ) {
    return {
      intent: "technology_coding",
      confidence: 0.9,
      extractedTopic: "Tecnología y Programación",
      isEvaluatingExercise: false,
    };
  }

  // Default fallback: General curiosity
  return {
    intent: "general_curiosity",
    confidence: 0.7,
    extractedTopic: "Curiosidad y Aprendizaje General",
    isEvaluatingExercise: false,
  };
}

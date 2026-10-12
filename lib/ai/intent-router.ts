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
  | "greeting"
  | "colors_primary"
  | "math_arithmetic_calc"
  | "out_of_catalog"
  | "general_curiosity";

export interface IntentClassification {
  intent: StudentIntent;
  confidence: number;
  extractedTopic: string;
  isEvaluatingExercise: boolean;
}

export interface ArithmeticOperation {
  op: "mult" | "add" | "sub" | "div";
  a: number;
  b: number;
  res: number;
  expression: string;
}

export function cleanPrompt(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[×*]/g, " por ")
    .replace(/[÷]/g, " entre ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects common friendly child and student greetings
 */
export function isGreeting(text: string): boolean {
  const q = cleanPrompt(text);
  if (!q) return false;
  const directGreetings = [
    "hola",
    "hola mia",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "hola amiga",
    "que tal",
    "que onda",
    "como estas",
    "como te va",
    "saludos",
    "hey mia",
    "buen dia",
    "hola tutora",
    "hola companera",
    "hola como estas",
    "hola que haces",
    "hola quien eres",
  ];
  if (directGreetings.includes(q)) return true;
  if (q.startsWith("hola") && q.split(" ").length <= 4) {
    if (
      !q.includes("explic") &&
      !q.includes("fraccion") &&
      !q.includes("america") &&
      !q.includes("por que") &&
      !q.includes("cuanto") &&
      !q.includes("color") &&
      !q.includes("tarea")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Elementary school arithmetic expression parser (multiplication tables, additions, subtractions, divisions)
 */
export function parseArithmetic(text: string): ArithmeticOperation | null {
  if (!text) return null;
  const norm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[×*]/g, " por ")
    .replace(/[÷]/g, " entre ")
    .replace(/\+/g, " mas ")
    .replace(/\-/g, " menos ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Multiplicaciones: 8 x 7, 8 * 7, 8 por 7, cuanto es 8 x 7, multiplica 8 por 7
  const mult = norm.match(/(?:cuanto es\s+|multiplica\s+)?(\d+)\s+(?:por|x|veces|multiplicado por)\s+(\d+)/);
  if (mult) {
    const a = parseInt(mult[1], 10);
    const b = parseInt(mult[2], 10);
    if (!isNaN(a) && !isNaN(b)) {
      return { op: "mult", a, b, res: a * b, expression: `${a} × ${b}` };
    }
  }

  // Sumas: 12 + 15, suma 12 y 15, cuanto es 12 mas 15
  const add = norm.match(/(?:cuanto es\s+|suma\s+)?(\d+)\s+(?:mas|sumado a)\s+(\d+)/);
  if (add) {
    const a = parseInt(add[1], 10);
    const b = parseInt(add[2], 10);
    if (!isNaN(a) && !isNaN(b)) {
      return { op: "add", a, b, res: a + b, expression: `${a} + ${b}` };
    }
  }

  // Restas: 20 - 5, cuanto es 20 menos 5
  const sub = norm.match(/(?:cuanto es\s+|resta\s+)?(\d+)\s+(?:menos|restale)\s+(\d+)/);
  if (sub) {
    const a = parseInt(sub[1], 10);
    const b = parseInt(sub[2], 10);
    if (!isNaN(a) && !isNaN(b)) {
      return { op: "sub", a, b, res: a - b, expression: `${a} - ${b}` };
    }
  }

  // Divisiones: 20 entre 4, divide 20 entre 4, cuanto es 20 entre 4
  const div = norm.match(/(?:cuanto es\s+|divide\s+)?(\d+)\s+(?:entre|dividido entre)\s+(\d+)/);
  if (div) {
    const a = parseInt(div[1], 10);
    const b = parseInt(div[2], 10);
    if (!isNaN(a) && !isNaN(b) && b !== 0) {
      return { op: "div", a, b, res: Math.round((a / b) * 100) / 100, expression: `${a} ÷ ${b}` };
    }
  }

  return null;
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

  // 0. Greetings ("Hola MIA", "Hola", "Buenos días")
  if (isGreeting(rawPrompt)) {
    return {
      intent: "greeting",
      confidence: 0.99,
      extractedTopic: "Saludo y Bienvenida",
      isEvaluatingExercise: false,
    };
  }

  // 0.1 Primary colors query ("¿Cuáles son los colores primarios?")
  if (
    (q.includes("color") && (q.includes("primario") || q.includes("basico") || q.includes("pintura") || q.includes("luz"))) ||
    q.includes("colores primarios") ||
    q.includes("color primario")
  ) {
    return {
      intent: "colors_primary",
      confidence: 0.98,
      extractedTopic: "Arte y Ciencias · Colores Primarios",
      isEvaluatingExercise: false,
    };
  }

  // 0.2 Arithmetic calculation ("¿Cuánto es 8 × 7?", "8 por 7")
  if (parseArithmetic(rawPrompt)) {
    return {
      intent: "math_arithmetic_calc",
      confidence: 0.99,
      extractedTopic: "Matemáticas · Operación Aritmética",
      isEvaluatingExercise: false,
    };
  }

  // 0.3 Water cycle / Rain queries ("¿Por qué llueve?")
  if (
    q.includes("lluvia") ||
    q.includes("ciclo del agua") ||
    (q.includes("por que") && q.includes("llueve")) ||
    q.includes("como llueve") ||
    q.includes("nubes de lluvia")
  ) {
    return {
      intent: "science_nature",
      confidence: 0.96,
      extractedTopic: "Ciencias Naturales · El Ciclo del Agua",
      isEvaluatingExercise: false,
    };
  }

  // 0.4 Dinosaurs queries ("¿Qué es un dinosaurio?")
  if (
    q.includes("dinosaurio") ||
    q.includes("t rex") ||
    q.includes("fosil") ||
    q.includes("paleontol") ||
    q.includes("velociraptor")
  ) {
    return {
      intent: "science_dinosaurs",
      confidence: 0.96,
      extractedTopic: "Paleontología · Dinosaurios",
      isEvaluatingExercise: false,
    };
  }

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

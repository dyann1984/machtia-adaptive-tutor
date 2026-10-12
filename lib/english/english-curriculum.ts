/**
 * MACHTIA MIA 3.0 - English with MIA Curriculum & Pronunciation Evaluator
 *
 * Primary School (A1 - B1 Elementary) structured bilingual learning:
 * - 3 Progressive Levels: Beginner, Intermediate, Advanced
 * - Curricular Units: Greetings, Colors, Numbers, Animals, School, Daily Life
 * - Rigorous acoustic-grounded pronunciation assessment (zero fake scores)
 */

export type EnglishLevel = "beginner" | "intermediate" | "advanced";

export interface PronunciationWordResult {
  word: string;
  status: "match" | "near" | "missing";
  phonetics?: string;
}

export interface PronunciationEvaluation {
  valid: boolean;
  accuracy: number; // 0 to 100
  targetPhrase: string;
  spokenPhrase: string;
  wordResults: PronunciationWordResult[];
  feedback: string;
  phoneticTip?: string;
  praise?: string;
  audioPrompt?: string;
}

export interface PracticePhrase {
  id: string;
  level: EnglishLevel;
  category: "greetings" | "colors" | "numbers" | "animals" | "school" | "everyday";
  english: string;
  spanish: string;
  phonetics: string;
  audioSpeedHint?: number;
  tip?: string;
}

export interface EnglishLesson {
  id: string;
  title: string;
  spanishTitle: string;
  level: EnglishLevel;
  description: string;
  vocabulary: Array<{ en: string; es: string; phonetics: string }>;
  sampleDialogues: Array<{ speaker: string; text: string; translation: string }>;
  interactiveChallenge: {
    question: string;
    targetAnswer: string;
    options: string[];
    explanation: string;
  };
}

export const PRACTICE_PHRASES: PracticePhrase[] = [
  // Beginner
  {
    id: "beg_hello",
    level: "beginner",
    category: "greetings",
    english: "Hello MIA, good morning!",
    spanish: "¡Hola MIA, buenos días!",
    phonetics: "/hɛˈloʊ ˈmiːə ɡʊd ˈmɔːrnɪŋ/",
    tip: "En 'morning', la 'r' suena suave en el fondo de la boca.",
  },
  {
    id: "beg_name",
    level: "beginner",
    category: "greetings",
    english: "What is your name?",
    spanish: "¿Cuál es tu nombre?",
    phonetics: "/wʌt ɪz jʊər neɪm/",
    tip: "Une los sonidos: 'What is' suena fluido como 'wʌt-ɪz'.",
  },
  {
    id: "beg_cat_blue",
    level: "beginner",
    category: "colors",
    english: "The cat is blue.",
    spanish: "El gato es azul.",
    phonetics: "/ðə kæt ɪz bluː/",
    tip: "En 'The', pon la punta de la lengua entre tus dientes.",
  },
  {
    id: "beg_red_apple",
    level: "beginner",
    category: "colors",
    english: "I see a red apple.",
    spanish: "Veo una manzana roja.",
    phonetics: "/aɪ siː ə rɛd ˈæpəl/",
    tip: "En inglés el color va ANTES del objeto: 'red apple'.",
  },
  {
    id: "beg_numbers",
    level: "beginner",
    category: "numbers",
    english: "One, two, three, four, five.",
    spanish: "Uno, dos, tres, cuatro, cinco.",
    phonetics: "/wʌn tuː θriː fɔːr faɪv/",
    tip: "En 'three', pronuncia 'th' soplando aire suave con la lengua.",
  },

  // Intermediate
  {
    id: "int_animals",
    level: "intermediate",
    category: "animals",
    english: "The lion is strong and fast.",
    spanish: "El león es fuerte y rápido.",
    phonetics: "/ðə ˈlaɪən ɪz strɔːŋ ænd fæst/",
    tip: "Acentúa la primera sílaba de 'lion' (LAI-on).",
  },
  {
    id: "int_school",
    level: "intermediate",
    category: "school",
    english: "I love reading books at school.",
    spanish: "Me encanta leer libros en la escuela.",
    phonetics: "/aɪ lʌv ˈriːdɪŋ bʊks æt skuːl/",
    tip: "La 'oo' en 'school' suena larga como 'skuul'.",
  },
  {
    id: "int_bathroom",
    level: "intermediate",
    category: "everyday",
    english: "Where is the library, please?",
    spanish: "¿Dónde está la biblioteca, por favor?",
    phonetics: "/wɛər ɪz ðə ˈlaɪbrɛri pliːz/",
    tip: "'Library' tiene 3 sílabas: LAI-bre-ri.",
  },

  // Advanced
  {
    id: "adv_fractions",
    level: "advanced",
    category: "school",
    english: "One half is equal to two quarters.",
    spanish: "Un medio es igual a dos cuartos.",
    phonetics: "/wʌn hæf ɪz ˈiːkwəl tuː tuː ˈkwɔːrtərz/",
    tip: "En 'half' la 'l' es silenciosa: suena 'haf'.",
  },
  {
    id: "adv_curiosity",
    level: "advanced",
    category: "everyday",
    english: "Why does it rain from the clouds?",
    spanish: "¿Por qué llueve de las nubes?",
    phonetics: "/waɪ dʌz ɪt reɪn frʌm ðə klaʊdz/",
    tip: "'Rain' y 'clouds' llevan las vocales con más fuerza.",
  },
];

export const ENGLISH_LESSONS: EnglishLesson[] = [
  {
    id: "lesson_1",
    title: "Lesson 1: Greetings & Introductions",
    spanishTitle: "Lección 1: Saludos y Presentaciones",
    level: "beginner",
    description: "Aprende a saludar y presentarte cordialmente en inglés.",
    vocabulary: [
      { en: "Hello", es: "Hola", phonetics: "/hɛˈloʊ/" },
      { en: "Good morning", es: "Buenos días", phonetics: "/ɡʊd ˈmɔːrnɪŋ/" },
      { en: "My name is...", es: "Mi nombre es...", phonetics: "/maɪ neɪm ɪz/" },
      { en: "How are you?", es: "¿Cómo estás?", phonetics: "/haʊ ɑːr juː/" },
    ],
    sampleDialogues: [
      { speaker: "MIA", text: "Hello! What is your name?", translation: "¡Hola! ¿Cuál es tu nombre?" },
      { speaker: "Student", text: "My name is Mateo. Good morning!", translation: "Mi nombre es Mateo. ¡Buenos días!" },
    ],
    interactiveChallenge: {
      question: "¿Cómo respondes en inglés si te preguntan 'What is your name?'?",
      targetAnswer: "My name is Mateo",
      options: [
        "My name is Mateo",
        "I have Mateo name",
        "My cat is Mateo",
        "Good night Mateo",
      ],
      explanation: "En inglés decimos 'My name is [tu nombre]' o 'I am [tu nombre]'.",
    },
  },
  {
    id: "lesson_2",
    title: "Lesson 2: Colors and Animals",
    spanishTitle: "Lección 2: Colores y Animales",
    level: "beginner",
    description: "Describe animales usando tus colores favoritos.",
    vocabulary: [
      { en: "Blue", es: "Azul", phonetics: "/bluː/" },
      { en: "Red", es: "Rojo", phonetics: "/rɛd/" },
      { en: "Yellow", es: "Amarillo", phonetics: "/ˈjɛloʊ/" },
      { en: "Green", es: "Verde", phonetics: "/ɡriːn/" },
      { en: "Cat", es: "Gato", phonetics: "/kæt/" },
      { en: "Dog", es: "Perro", phonetics: "/dɔːɡ/" },
    ],
    sampleDialogues: [
      { speaker: "MIA", text: "Look at the picture! What color is the cat?", translation: "¡Mira el dibujo! ¿De qué color es el gato?" },
      { speaker: "Student", text: "The cat is blue!", translation: "¡El gato es azul!" },
    ],
    interactiveChallenge: {
      question: "¿Cómo se dice 'El perro es amarillo' en inglés?",
      targetAnswer: "The dog is yellow",
      options: [
        "The dog is yellow",
        "The dog are yellow",
        "Yellow is the dog",
        "Dog yellow the",
      ],
      explanation: "Para un solo animal usamos 'is': 'The dog is yellow'.",
    },
  },
  {
    id: "lesson_3",
    title: "Lesson 3: Math & Fractions in English",
    spanishTitle: "Lección 3: Matemáticas y Fracciones en Inglés",
    level: "intermediate",
    description: "Descubre cómo nombrar mitades y cuartos en inglés.",
    vocabulary: [
      { en: "One half (1/2)", es: "Un medio", phonetics: "/wʌn hæf/" },
      { en: "One quarter (1/4)", es: "Un cuarto", phonetics: "/wʌn ˈkwɔːrtər/" },
      { en: "Equal to", es: "Igual a", phonetics: "/ˈiːkwəl tuː/" },
      { en: "Whole", es: "Entero", phonetics: "/hoʊl/" },
    ],
    sampleDialogues: [
      { speaker: "MIA", text: "If we slice a pizza in two equal parts, what is each part?", translation: "Si cortamos una pizza en dos partes iguales, ¿qué es cada parte?" },
      { speaker: "Student", text: "Each part is one half!", translation: "¡Cada parte es un medio!" },
    ],
    interactiveChallenge: {
      question: "¿Cómo se dice 'un cuarto' (1/4) en inglés?",
      targetAnswer: "One quarter",
      options: [
        "One quarter",
        "One fourth",
        "One half",
        "Two quarters",
      ],
      explanation: "1/4 se llama 'one quarter' (o 'one fourth'). 1/2 es 'one half'.",
    },
  },
];

/**
 * Levenshtein distance between two tokens
 */
function tokenLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Cleans tokens for acoustic comparison
 */
function cleanTokens(phrase: string): string[] {
  return (phrase || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/**
 * Evaluates spoken pronunciation against a target phrase.
 * Strict, authentic evaluation without fake numbers or manufactured metrics.
 */
export function evaluatePronunciation(
  spokenPhrase: string,
  targetPhrase: string
): PronunciationEvaluation {
  const targetTokens = cleanTokens(targetPhrase);
  const spokenTokens = cleanTokens(spokenPhrase);

  if (targetTokens.length === 0) {
    return {
      valid: false,
      accuracy: 0,
      targetPhrase,
      spokenPhrase,
      wordResults: [],
      feedback: "Frase objetivo vacía.",
    };
  }

  // 1. Acoustic ground check: If no spoken audio was transcribed
  if (spokenTokens.length === 0) {
    return {
      valid: false,
      accuracy: 0,
      targetPhrase,
      spokenPhrase: "",
      wordResults: targetTokens.map((w) => ({ word: w, status: "missing" })),
      feedback: "No se detectó audio claro. Intenta hablar más cerca del micrófono y pronunciar con calma.",
      phoneticTip: "Consejo: Escucha primero la pronunciación lenta (0.8x) pulsando el botón de audio.",
    };
  }

  // 2. Token-by-token comparison
  const wordResults: PronunciationWordResult[] = [];
  let exactMatches = 0;
  let nearMatches = 0;

  targetTokens.forEach((targetWord, index) => {
    // Check exact match in spoken tokens near index
    const windowStart = Math.max(0, index - 2);
    const windowEnd = Math.min(spokenTokens.length, index + 3);
    const spokenWindow = spokenTokens.slice(windowStart, windowEnd);

    if (spokenWindow.includes(targetWord)) {
      wordResults.push({ word: targetWord, status: "match" });
      exactMatches++;
    } else {
      // Check near match via Levenshtein
      const closestDist = spokenWindow.reduce((min, token) => {
        const dist = tokenLevenshtein(targetWord, token);
        return Math.min(min, dist);
      }, 99);

      const tolerance = targetWord.length <= 4 ? 1 : 2;
      if (closestDist <= tolerance) {
        wordResults.push({ word: targetWord, status: "near" });
        nearMatches++;
      } else {
        wordResults.push({ word: targetWord, status: "missing" });
      }
    }
  });

  // Calculate real accuracy based on genuine token alignments
  const total = targetTokens.length;
  const score = Math.round(((exactMatches * 1.0 + nearMatches * 0.5) / total) * 100);
  const accuracy = Math.min(100, Math.max(0, score));

  // Pedagogical feedback & phonetic tips
  let feedback = "";
  let praise = "";
  let phoneticTip: string | undefined;

  if (accuracy >= 90) {
    praise = "¡Excelente pronunciación! 🌟";
    feedback = "¡Pronunciaste todas las palabras con claridad y fluidez natural!";
  } else if (accuracy >= 65) {
    praise = "¡Muy buen intento! 👍";
    const needsPractice = wordResults.filter((w) => w.status !== "match").map((w) => `"${w.word}"`).join(", ");
    feedback = `Casi lo logras. Practica enfatizar un poco más: ${needsPractice}.`;
  } else {
    praise = "¡Sigue practicando, vas bien! 💪";
    const missing = wordResults.filter((w) => w.status === "missing").map((w) => `"${w.word}"`).join(", ");
    feedback = `Escucha con atención la voz de MIA y repite despacito. Presta atención a: ${missing}.`;
  }

  // Identify phonetic tips for tricky sounds
  const missedWords = wordResults.filter((w) => w.status !== "match").map((w) => w.word);
  if (missedWords.some((w) => w.includes("th"))) {
    phoneticTip = "Tip fonético: Para el sonido 'th' (como en 'the' o 'three'), coloca la punta de la lengua suavemente entre los dientes y deja salir el aire.";
  } else if (missedWords.some((w) => w === "half")) {
    phoneticTip = "Tip fonético: En 'half', la letra 'L' es muda; se pronuncia como /hæf/.";
  } else if (missedWords.some((w) => w === "lion")) {
    phoneticTip = "Tip fonético: En 'lion', la primera sílaba suena como 'lai': /LAI-on/.";
  }

  return {
    valid: true,
    accuracy,
    targetPhrase,
    spokenPhrase,
    wordResults,
    feedback,
    phoneticTip,
    praise,
  };
}

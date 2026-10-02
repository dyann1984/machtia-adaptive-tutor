/**
 * MACHTIA Adaptive Tutor - Oral Answer Normalizer for Amazon Alexa+
 * Translates spoken, transcribed, conversational, and abbreviated student answers
 * into the canonical option string expected by the pedagogical evaluation engine.
 */

import { Exercise } from "@/types";

const SPANISH_NUMBERS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

const SPANISH_DENOMINATORS: Record<string, number> = {
  medio: 2,
  medios: 2,
  mitad: 2,
  tercio: 3,
  tercios: 3,
  cuarto: 4,
  cuartos: 4,
  quinto: 5,
  quintos: 5,
  sexto: 6,
  sextos: 6,
  septimo: 7,
  séptimo: 7,
  septimos: 7,
  séptimos: 7,
  octavo: 8,
  octavos: 8,
  noveno: 9,
  novenos: 9,
  decimo: 10,
  décimo: 10,
  decimos: 10,
  décimos: 10,
};

/**
 * Normalizes an oral or spoken string to plain lowercase without accents.
 */
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[.,;:¿?¡!]/g, "") // remove punctuation
    .trim();
}

/**
 * Parses spoken fraction expressions like "dos cuartos", "dos sobre cuatro", "2 sobre 4".
 */
function parseSpokenFraction(raw: string): string | null {
  const cleaned = cleanText(raw);

  // Pattern A: "X/Y" e.g. "2/4"
  const slashMatch = cleaned.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) {
    return `${slashMatch[1]}/${slashMatch[2]}`;
  }

  // Pattern B: "X sobre Y" e.g. "dos sobre cuatro" or "2 sobre 4"
  const sobreMatch = cleaned.match(/(.+?)\s+sobre\s+(.+)/);
  if (sobreMatch) {
    const rawNum = sobreMatch[1].trim();
    const rawDen = sobreMatch[2].trim();
    const num = SPANISH_NUMBERS[rawNum] ?? parseInt(rawNum, 10);
    const den = SPANISH_NUMBERS[rawDen] ?? SPANISH_DENOMINATORS[rawDen] ?? parseInt(rawDen, 10);
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      return `${num}/${den}`;
    }
  }

  // Pattern C: "dos cuartos", "un medio", "tres sextos"
  const words = cleaned.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const wNum = words[i];
    const wDen = words[i + 1];
    const num = SPANISH_NUMBERS[wNum] ?? parseInt(wNum, 10);
    const den = SPANISH_DENOMINATORS[wDen];
    if (!isNaN(num) && den !== undefined) {
      return `${num}/${den}`;
    }
  }

  // Pattern D: "la mitad" -> 1/2
  if (cleaned.includes("la mitad")) {
    return "1/2";
  }

  return null;
}

/**
 * Normalizes any spoken response from Alexa+ to the exact matching option in the exercise.
 * @param studentRawAnswer Raw speech or text transcript received from Alexa+.
 * @param exercise Current exercise with options list and correctAnswer.
 * @returns Canonical option string if recognized, or trimmed raw answer as fallback.
 */
export function normalizeOralAnswer(studentRawAnswer: string, exercise: Exercise): string {
  if (!studentRawAnswer) return "";
  const cleaned = cleanText(studentRawAnswer);

  // 1. Direct letter matching: "A", "opción A", "la A", "letra A"
  const letterMatch = cleaned.match(/\b(opcion|letra|la)?\s*([a-d])\b/);
  if (letterMatch && letterMatch[2]) {
    const letterIndex = letterMatch[2].charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1
    if (letterIndex >= 0 && letterIndex < exercise.options.length) {
      return exercise.options[letterIndex];
    }
  }

  // 2. Exact match with any option (case & accent insensitive)
  for (const opt of exercise.options) {
    if (cleanText(opt) === cleaned) {
      return opt;
    }
  }

  // 3. Spoken fraction normalization: e.g. "dos cuartos" -> "2/4"
  const parsedFraction = parseSpokenFraction(cleaned);
  if (parsedFraction) {
    for (const opt of exercise.options) {
      if (opt.includes(parsedFraction) || cleanText(opt).includes(parsedFraction)) {
        return opt;
      }
    }
  }

  // 4. Chocolate pieces pattern: "dos partes", "2 partes", "dos trozos", "dos partes de seis"
  if (cleaned.includes("parte") || cleaned.includes("trozo")) {
    const numMatch = cleaned.match(/\b(un|uno|una|dos|tres|cuatro|\d+)\b/);
    if (numMatch) {
      const count = SPANISH_NUMBERS[numMatch[1]] ?? parseInt(numMatch[1], 10);
      if (!isNaN(count)) {
        const found = exercise.options.find((opt) => opt.startsWith(`${count} parte`));
        if (found) return found;
      }
    }
  }

  // 5. Cross product pattern: "24", "iguales", "mismo valor", "3 por 8"
  if (
    cleaned.includes("24") ||
    cleaned.includes("mismo valor") ||
    cleaned.includes("iguales") ||
    cleaned.includes("3 por 8") ||
    cleaned.includes("3x8")
  ) {
    const found = exercise.options.find(
      (opt) => opt.includes("24") || opt.toLowerCase().includes("mismo valor")
    );
    if (found) return found;
  }

  // 6. Affirmative / factor multiplier pattern: "si", "multiplicar por 2", "factor 2"
  if (
    cleaned.startsWith("si") ||
    cleaned.includes("multiplicamos por 2") ||
    cleaned.includes("multiplicar por 2")
  ) {
    const found = exercise.options.find((opt) => opt.toLowerCase().startsWith("sí") || opt.toLowerCase().startsWith("si"));
    if (found) return found;
  }

  // 7. Simplification pattern: "dos tercios", "2/3"
  if (cleaned.includes("dos tercios") || cleaned.includes("2/3")) {
    const found = exercise.options.find((opt) => opt.includes("2/3"));
    if (found) return found;
  }

  // Fallback: substring matching across options
  for (const opt of exercise.options) {
    const cleanOpt = cleanText(opt);
    if (cleanOpt.includes(cleaned) || cleaned.includes(cleanOpt)) {
      return opt;
    }
  }

  // Default: return trimmed input
  return studentRawAnswer.trim();
}

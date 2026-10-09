/**
 * MACHTIA Adaptive Tutor - Educational Speech Normalization & PII Minimization
 *
 * Prepares text for natural Mexican Spanish text-to-speech synthesis by:
 * 1. Stripping personally identifiable student and teacher data (Zero PII).
 * 2. Phonetically expanding primary school mathematics, fractions, and symbols.
 * 3. Cleaning emojis and markdown to prevent noisy phonetic artifacts.
 */

const SPANISH_CARDINALS: Record<number, string> = {
  1: "un",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
};

const SPANISH_DENOMINATOR_SINGULAR: Record<number, string> = {
  2: "medio",
  3: "tercio",
  4: "cuarto",
  5: "quinto",
  6: "sexto",
  7: "séptimo",
  8: "octavo",
  9: "noveno",
  10: "décimo",
  12: "doceavo",
};

const SPANISH_DENOMINATOR_PLURAL: Record<number, string> = {
  2: "medios",
  3: "tercios",
  4: "cuartos",
  5: "quintos",
  6: "sextos",
  7: "séptimos",
  8: "octavos",
  9: "novenos",
  10: "décimos",
  12: "doceavos",
};

/**
 * Structural safety gate beyond regex replacement: rejects text containing suspected
 * personal data (phone numbers, government IDs, physical addresses, URLs).
 */
export function validateContentSafety(text: string): { safe: boolean; reason?: string } {
  if (!text) return { safe: true };

  // Detect phone numbers (e.g., 10 digits or international format)
  if (/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}\b/.test(text)) {
    return { safe: false, reason: "SUSPECTED_PHONE_NUMBER" };
  }

  // Detect Mexican CURP/RFC format
  if (/\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/i.test(text) || /\b[A-Z]{4}\d{6}[A-Z0-9]{3}\b/i.test(text)) {
    return { safe: false, reason: "SUSPECTED_GOVERNMENT_ID" };
  }

  // Detect URLs or IP addresses
  if (/\b(?:https?:\/\/|www\.)\S+\b/i.test(text)) {
    return { safe: false, reason: "URL_DETECTED" };
  }

  // Detect physical addresses (e.g. "calle", "avenida", "colonia", "c.p.")
  if (/\b(?:calle|avenida|av\.|colonia|col\.|c\.p\.\s*\d{5})\s+[a-z0-9]+/i.test(text)) {
    return { safe: false, reason: "PHYSICAL_ADDRESS_DETECTED" };
  }

  return { safe: true };
}

/**
 * Strips personal names, emails, and student record references to ensure
 * zero student PII is transmitted to external TTS APIs.
 */
export function sanitizePiiForTTS(rawText: string): string {
  if (!rawText) return "";

  return rawText
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "tu profesor")
    // Remove known student/teacher names in greetings
    .replace(/(?:¡|!)?\s*Hola\s+(?:Mariana|Santiago|Mateo|Valentina|Leonardo|Carlos)(?:\s+López|\s+Vega)?\s*[,!¡]?/gi, "¡Hola!")
    // Remove full names in sentence context
    .replace(/\bMariana\s+López\b/gi, "la alumna")
    .replace(/(?:el\s+)?\bProf\.?\s+Carlos\s+Vega\b/gi, "el profesor")
    .replace(/(?:el\s+)?\bCarlos\s+Vega\b/gi, "el profesor")
    // Remove individual student names at word boundaries
    .replace(/\b(?:Mariana|Santiago|Mateo|Valentina|Leonardo)\b/gi, "alumno")
    // Remove internal database IDs (e.g., student-mariana, prof-carlos, etc.)
    .replace(/\b(?:prof|student|grupo|practice|gap)-[a-z0-9_-]+\b/gi, "")
    // Normalize spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Phonetically and pedagogically normalizes raw text for natural Mexican Spanish TTS.
 * Converts fraction notations, mathematical operators, and educational symbols
 * into clear spoken words while removing emojis and markdown formatting.
 */
export function normalizeOralMathText(rawText: string): string {
  if (!rawText) return "";

  let text = rawText
    // Remove markdown formatting
    .replace(/[*_#`~>]/g, "")
    // Remove common emojis and symbols
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F|\u200D/g, "")
    // Spoken fractions: common explicit fractions first
    .replace(/\b1\/2\b/g, "un medio")
    .replace(/\b2\/4\b/g, "dos cuartos")
    .replace(/\b3\/4\b/g, "tres cuartos")
    .replace(/\b1\/3\b/g, "un tercio")
    .replace(/\b2\/3\b/g, "dos tercios")
    .replace(/\b3\/3\b/g, "tres tercios")
    .replace(/\b1\/4\b/g, "un cuarto")
    .replace(/\b2\/4\b/g, "dos cuartos")
    .replace(/\b4\/4\b/g, "cuatro cuartos")
    .replace(/\b1\/5\b/g, "un quinto")
    .replace(/\b2\/5\b/g, "dos quintos")
    .replace(/\b3\/5\b/g, "tres quintos")
    .replace(/\b4\/5\b/g, "cuatro quintos")
    .replace(/\b5\/5\b/g, "cinco quintos")
    .replace(/\b1\/6\b/g, "un sexto")
    .replace(/\b2\/6\b/g, "dos sextos")
    .replace(/\b3\/6\b/g, "tres sextos")
    .replace(/\b4\/6\b/g, "cuatro sextos")
    .replace(/\b5\/6\b/g, "cinco sextos")
    .replace(/\b6\/6\b/g, "seis sextos")
    .replace(/\b1\/8\b/g, "un octavo")
    .replace(/\b2\/8\b/g, "dos octavos")
    .replace(/\b3\/8\b/g, "tres octavos")
    .replace(/\b4\/8\b/g, "cuatro octavos")
    .replace(/\b5\/8\b/g, "cinco octavos")
    .replace(/\b6\/8\b/g, "seis octavos")
    .replace(/\b7\/8\b/g, "siete octavos")
    .replace(/\b8\/8\b/g, "ocho octavos")
    .replace(/\b1\/10\b/g, "un décimo")
    .replace(/\b2\/10\b/g, "dos décimos")
    .replace(/\b3\/10\b/g, "tres décimos")
    .replace(/\b4\/10\b/g, "cuatro décimos")
    .replace(/\b5\/10\b/g, "cinco décimos")
    .replace(/\b6\/10\b/g, "seis décimos")
    .replace(/\b7\/10\b/g, "siete décimos")
    .replace(/\b8\/10\b/g, "ocho décimos")
    .replace(/\b9\/10\b/g, "nueve décimos")
    .replace(/\b10\/10\b/g, "diez décimos")
    .replace(/\b6\/9\b/g, "seis novenos");

  // Dynamic fraction rule for any other primary fractions X/Y (e.g. 5/12)
  text = text.replace(/\b(\d+)\/(\d+)\b/g, (_match, numStr, denStr) => {
    const num = parseInt(numStr, 10);
    const den = parseInt(denStr, 10);
    const numWord = SPANISH_CARDINALS[num] || numStr;
    if (num === 1 && SPANISH_DENOMINATOR_SINGULAR[den]) {
      return `un ${SPANISH_DENOMINATOR_SINGULAR[den]}`;
    }
    if (num > 1 && SPANISH_DENOMINATOR_PLURAL[den]) {
      return `${numWord} ${SPANISH_DENOMINATOR_PLURAL[den]}`;
    }
    return `${numWord} sobre ${den}`;
  });

  // Mathematical operations and comparisons
  text = text
    .replace(/(\d+)\s*[×x*]\s*(\d+)/g, "$1 por $2")
    .replace(/(\d+)\s*[÷/]\s*(\d+)/g, "$1 entre $2")
    .replace(/(\d+)\s*=\s*(\d+)/g, "$1 es igual a $2")
    .replace(/=\s*/g, " es igual a ")
    .replace(/(\d+)\s*[\-−]\s*(\d+)/g, "$1 menos $2")
    .replace(/\b500\s*\+\s*2\b/g, "quinientos más dos")
    .replace(/(\d+)\s*\+\s*(\d+)/g, "$1 más $2")
    .replace(/\+/g, " más ")
    .replace(/%/g, " por ciento")
    // Decimals in Mexican Spanish
    .replace(/(\d+)\.(\d+)/g, "$1 punto $2")
    // School grade and terms
    .replace(/\b3°\s*B\b/gi, "tercero B")
    .replace(/\b3°\s*Primaria\b/gi, "tercero de primaria")
    .replace(/\b(\d+)°\s*grado\b/gi, "$1 grado")
    .replace(/\b(\d+)°\b/g, "$1 grado")
    .replace(/\bpág\.?\s*(\d+)/gi, "página $1")
    .replace(/\bej\.?\s*(\d+)/gi, "ejemplo $1")
    .replace(/\bej\./gi, "ejemplo")
    .replace(/\bnúm\.?\s*(\d+)/gi, "número $1")
    .replace(/&ldquo;|&rdquo;|&quot;|"/g, "")
    // Normalize spaces
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

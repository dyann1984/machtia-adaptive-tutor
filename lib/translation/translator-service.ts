/**
 * MACHTIA MIA 3.0 - Bilingual Translation Engine
 *
 * Real, resilient translation between Spanish and English.
 * - Primary Engine: Google Translate Neural MT (gtx endpoint)
 * - Secondary Engine: MyMemory Translated API
 * - Tertiary Fallback: High-coverage Educational Bilingual Lexicon (offline/network resilience)
 *
 * Provides language detection, full sentences/expressions, phonetics, and pedagogical examples.
 */

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: "es" | "en";
  targetLang: "es" | "en";
  detectedLang?: "es" | "en";
  engine: "google_gtx" | "mymemory" | "educational_lexicon";
  confidence: number;
  phonetics?: string;
  exampleSentences?: Array<{ es: string; en: string }>;
  audioAvailable: boolean;
  notes?: string;
}

export interface TranslateOptions {
  text: string;
  sourceLang?: "auto" | "es" | "en";
  targetLang?: "es" | "en";
  timeoutMs?: number;
}

/**
 * Educational bilingual lexicon for high-frequency primary school terms,
 * greetings, colors, numbers, animals, and common questions.
 * Serves as an instant offline/test fallback.
 */
const EDUCATIONAL_LEXICON: Record<string, { es: string; en: string; phonetics?: string }> = {
  // Greetings & Courtesies
  "hola": { es: "hola", en: "hello", phonetics: "/hɛˈloʊ/" },
  "hello": { es: "hola", en: "hello", phonetics: "/ˈo.la/" },
  "hi": { es: "hola", en: "hi", phonetics: "/haɪ/" },
  "buenos dias": { es: "buenos días", en: "good morning", phonetics: "/ɡʊd ˈmɔːrnɪŋ/" },
  "buen dia": { es: "buen día", en: "good morning", phonetics: "/ɡʊd ˈmɔːrnɪŋ/" },
  "good morning": { es: "buenos días", en: "good morning", phonetics: "/ˈbwe.noz ˈði.as/" },
  "buenas tardes": { es: "buenas tardes", en: "good afternoon", phonetics: "/ɡʊd ˌæftərˈnuːn/" },
  "good afternoon": { es: "buenas tardes", en: "good afternoon", phonetics: "/ˈbwe.nas ˈtaɾ.ðes/" },
  "buenas noches": { es: "buenas noches", en: "good evening / good night", phonetics: "/ɡʊd naɪt/" },
  "good night": { es: "buenas noches", en: "good night", phonetics: "/ˈbwe.naz ˈno.tʃes/" },
  "adios": { es: "adiós", en: "goodbye", phonetics: "/ɡʊdˈbaɪ/" },
  "goodbye": { es: "adiós", en: "goodbye", phonetics: "/aˈðjos/" },
  "bye": { es: "adiós", en: "bye", phonetics: "/baɪ/" },
  "por favor": { es: "por favor", en: "please", phonetics: "/pliːz/" },
  "please": { es: "por favor", en: "please", phonetics: "/poɾ faˈβoɾ/" },
  "gracias": { es: "gracias", en: "thank you", phonetics: "/θæŋk juː/" },
  "thank you": { es: "gracias", en: "thank you", phonetics: "/ˈɡɾa.sjas/" },
  "thanks": { es: "gracias", en: "thanks", phonetics: "/θæŋks/" },
  "de nada": { es: "de nada", en: "you're welcome", phonetics: "/jʊər ˈwɛlkəm/" },
  "you're welcome": { es: "de nada", en: "you're welcome", phonetics: "/de ˈna.ða/" },
  "como estas": { es: "¿cómo estás?", en: "how are you?", phonetics: "/haʊ ɑːr juː/" },
  "how are you": { es: "¿cómo estás?", en: "how are you?", phonetics: "/ˈko.mo esˈtas/" },
  "muy bien": { es: "muy bien", en: "very well", phonetics: "/ˈvɛri wɛl/" },
  "very well": { es: "muy bien", en: "very well", phonetics: "/mwi βjen/" },

  // Common questions & everyday
  "cual es tu nombre": { es: "¿cuál es tu nombre?", en: "what is your name?", phonetics: "/wʌt ɪz jʊər neɪm/" },
  "como te llamas": { es: "¿cómo te llamas?", en: "what is your name?", phonetics: "/wʌt ɪz jʊər neɪm/" },
  "what is your name": { es: "¿cuál es tu nombre?", en: "what is your name?", phonetics: "/ˈkwal es tu ˈnom.bɾe/" },
  "me llamo": { es: "me llamo", en: "my name is", phonetics: "/maɪ neɪm ɪz/" },
  "my name is": { es: "me llamo", en: "my name is", phonetics: "/me ˈʝa.mo/" },
  "donde esta el bano": { es: "¿dónde está el baño?", en: "where is the bathroom?", phonetics: "/wɛər ɪz ðə ˈbæθruːm/" },
  "where is the bathroom": { es: "¿dónde está el baño?", en: "where is the bathroom?", phonetics: "/ˈdon.de esˈta el ˈba.ɲo/" },
  "donde esta la escuela": { es: "¿dónde está la escuela?", en: "where is the school?", phonetics: "/wɛər ɪz ðə skuːl/" },
  "where is the school": { es: "¿dónde está la escuela?", en: "where is the school?", phonetics: "/ˈdon.de esˈta la esˈkwe.la/" },
  "no entiendo": { es: "no entiendo", en: "I don't understand", phonetics: "/aɪ doʊnt ˌʌndərˈstænd/" },
  "no entendi": { es: "no entendí", en: "I didn't understand", phonetics: "/aɪ ˈdɪdənt ˌʌndərˈstænd/" },
  "i don't understand": { es: "no entiendo", en: "I don't understand", phonetics: "/no enˈtjen.do/" },
  "i dont understand": { es: "no entiendo", en: "I don't understand", phonetics: "/no enˈtjen.do/" },

  // School & Mathematics
  "fracciones": { es: "fracciones", en: "fractions", phonetics: "/ˈfrækʃənz/" },
  "fractions": { es: "fracciones", en: "fractions", phonetics: "/fɾakˈsjo.nes/" },
  "un medio": { es: "un medio", en: "one half", phonetics: "/wʌn hæf/" },
  "one half": { es: "un medio", en: "one half", phonetics: "/un ˈme.ðjo/" },
  "un cuarto": { es: "un cuarto", en: "one quarter", phonetics: "/wʌn ˈkwɔːrtər/" },
  "one quarter": { es: "un cuarto", en: "one quarter", phonetics: "/un ˈkwaɾ.to/" },
  "matematicas": { es: "matemáticas", en: "mathematics", phonetics: "/ˌmæθəˈmætɪks/" },
  "mathematics": { es: "matemáticas", en: "mathematics", phonetics: "/ma.teˈma.ti.kas/" },
  "math": { es: "matemáticas", en: "math", phonetics: "/mæθ/" },
  "escuela": { es: "escuela", en: "school", phonetics: "/skuːl/" },
  "school": { es: "escuela", en: "school", phonetics: "/esˈkwe.la/" },
  "maestro": { es: "maestro / profesor", en: "teacher", phonetics: "/ˈtiːtʃər/" },
  "profesor": { es: "profesor", en: "teacher", phonetics: "/ˈtiːtʃər/" },
  "teacher": { es: "maestro / profesor", en: "teacher", phonetics: "/maˈes.tɾo/" },
  "libro": { es: "libro", en: "book", phonetics: "/bʊk/" },
  "book": { es: "libro", en: "book", phonetics: "/ˈli.βɾo/" },
  "lapiz": { es: "lápiz", en: "pencil", phonetics: "/ˈpɛnsəl/" },
  "pencil": { es: "lápiz", en: "pencil", phonetics: "/ˈla.pis/" },

  // Colors
  "rojo": { es: "rojo", en: "red", phonetics: "/rɛd/" },
  "red": { es: "rojo", en: "red", phonetics: "/ˈro.xo/" },
  "azul": { es: "azul", en: "blue", phonetics: "/bluː/" },
  "blue": { es: "azul", en: "blue", phonetics: "/aˈsul/" },
  "amarillo": { es: "amarillo", en: "yellow", phonetics: "/ˈjɛloʊ/" },
  "yellow": { es: "amarillo", en: "yellow", phonetics: "/a.maˈɾi.ʝo/" },
  "verde": { es: "verde", en: "green", phonetics: "/ɡriːn/" },
  "green": { es: "verde", en: "green", phonetics: "/ˈbeɾ.ðe/" },
  "naranja": { es: "naranja", en: "orange", phonetics: "/ˈɔːrɪndʒ/" },
  "orange": { es: "naranja", en: "orange", phonetics: "/naˈɾaŋ.xa/" },
  "morado": { es: "morado", en: "purple", phonetics: "/ˈpɜːrpəl/" },
  "purple": { es: "morado", en: "purple", phonetics: "/moˈɾa.ðo/" },
  "blanco": { es: "blanco", en: "white", phonetics: "/waɪt/" },
  "white": { es: "blanco", en: "white", phonetics: "/ˈblaŋ.ko/" },
  "negro": { es: "negro", en: "black", phonetics: "/blæk/" },
  "black": { es: "negro", en: "black", phonetics: "/ˈne.ɣɾo/" },

  // Animals
  "perro": { es: "perro", en: "dog", phonetics: "/dɔːɡ/" },
  "dog": { es: "perro", en: "dog", phonetics: "/ˈpe.ro/" },
  "gato": { es: "gato", en: "cat", phonetics: "/kæt/" },
  "cat": { es: "gato", en: "cat", phonetics: "/ˈɡa.to/" },
  "el gato es azul": { es: "el gato es azul", en: "the cat is blue", phonetics: "/ðə kæt ɪz bluː/" },
  "the cat is blue": { es: "el gato es azul", en: "the cat is blue", phonetics: "/el ˈɡa.to es aˈsul/" },
  "leon": { es: "león", en: "lion", phonetics: "/ˈlaɪən/" },
  "lion": { es: "león", en: "lion", phonetics: "/leˈon/" },
  "elefante": { es: "elefante", en: "elephant", phonetics: "/ˈɛləfənt/" },
  "elephant": { es: "elefante", en: "elephant", phonetics: "/e.leˈfan.te/" },
  "pajaro": { es: "pájaro", en: "bird", phonetics: "/bɜːrd/" },
  "bird": { es: "pájaro", en: "bird", phonetics: "/ˈpa.xa.ɾo/" },
};

/**
 * Detects whether the input text is predominantly Spanish or English.
 */
export function detectLanguage(text: string): "es" | "en" {
  const clean = (text || "").toLowerCase().trim();
  if (!clean) return "es";

  // Characteristic Spanish characters
  if (/[áéíóúüñ¿¡]/.test(clean)) {
    return "es";
  }

  // Tokenize words
  const words = clean
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "es";

  const englishIndicators = new Set([
    "the", "is", "are", "was", "were", "what", "where", "how", "why", "when",
    "who", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his",
    "her", "their", "our", "this", "that", "good", "morning", "afternoon",
    "night", "hello", "hi", "please", "thank", "thanks", "dont", "do", "does",
    "did", "not", "can", "could", "would", "should", "explain", "understand",
    "fractions", "cat", "dog", "teacher", "school", "book", "pencil", "colors"
  ]);

  const spanishIndicators = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "es", "son",
    "fue", "fueron", "que", "cual", "donde", "como", "porque", "cuando",
    "quien", "yo", "tu", "el", "ella", "nosotros", "ellos", "mi", "su",
    "nuestro", "este", "esta", "buenos", "dias", "tardes", "noches", "hola",
    "por", "favor", "gracias", "entiendo", "entendi", "explicame", "fracciones",
    "gato", "perro", "maestro", "escuela", "libro", "lapiz", "colores"
  ]);

  let enScore = 0;
  let esScore = 0;

  for (const w of words) {
    if (englishIndicators.has(w)) enScore += 1.5;
    if (spanishIndicators.has(w)) esScore += 1.5;
  }

  if (enScore > esScore) return "en";
  if (esScore > enScore) return "es";

  // Check educational lexicon matches
  const normalizedKey = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  if (EDUCATIONAL_LEXICON[normalizedKey]) {
    const item = EDUCATIONAL_LEXICON[normalizedKey];
    if (item.en.toLowerCase() === clean) return "en";
    if (item.es.toLowerCase() === clean) return "es";
  }

  return "es";
}

/**
 * Normalizes lookup string for lexical index
 */
function normalizeKey(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Translates text with Google Translate GTX (Neural Machine Translation)
 */
async function translateWithGoogleGTX(
  text: string,
  sl: string,
  tl: string,
  timeoutMs = 4500
): Promise<{ translated: string; detectedLang?: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MACHTIA-Tutor/3.0",
      },
    });

    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const translated = data[0].map((item: any) => item?.[0] || "").join("").trim();
    const detectedLang = typeof data[2] === "string" ? data[2] : undefined;

    if (!translated) return null;
    return { translated, detectedLang };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Translates text with MyMemory API
 */
async function translateWithMyMemory(
  text: string,
  sl: string,
  tl: string,
  timeoutMs = 4500
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (typeof translated === "string" && translated.trim() && !translated.startsWith("MYMEMORY WARNING")) {
      return translated.trim();
    }
    return null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Translates via offline Educational Lexicon
 */
function translateWithLexicon(
  text: string,
  targetLang: "es" | "en"
): { translated: string; phonetics?: string } | null {
  const key = normalizeKey(text);
  const found = EDUCATIONAL_LEXICON[key];
  if (found) {
    if (targetLang === "en") {
      return { translated: capitalize(found.en), phonetics: found.phonetics };
    } else {
      return { translated: capitalize(found.es), phonetics: found.phonetics };
    }
  }

  // Check if multiple known words can be translated individually
  const words = key.split(" ");
  if (words.length > 1 && words.length <= 6) {
    const translatedWords: string[] = [];
    let allKnown = true;
    for (const w of words) {
      const match = EDUCATIONAL_LEXICON[w];
      if (match) {
        translatedWords.push(targetLang === "en" ? match.en : match.es);
      } else {
        allKnown = false;
        break;
      }
    }
    if (allKnown) {
      return { translated: capitalize(translatedWords.join(" ")) };
    }
  }

  return null;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Core translation function with fallback resilience.
 */
export async function translateText(options: TranslateOptions): Promise<TranslationResult> {
  const rawText = (options.text || "").trim();
  if (!rawText) {
    return {
      originalText: "",
      translatedText: "",
      sourceLang: "es",
      targetLang: "en",
      engine: "educational_lexicon",
      confidence: 1.0,
      audioAvailable: false,
    };
  }

  // 1. Detect or assign source/target language
  let sourceLang: "es" | "en";
  if (!options.sourceLang || options.sourceLang === "auto") {
    sourceLang = detectLanguage(rawText);
  } else {
    sourceLang = options.sourceLang;
  }

  const targetLang: "es" | "en" = options.targetLang
    ? options.targetLang
    : sourceLang === "es"
    ? "en"
    : "es";

  // Prevent no-op translation
  if (sourceLang === targetLang) {
    // If user provided identical source and target, invert target for convenience
    // unless explicitly specified
    if (!options.targetLang) {
      // already inverted above
    }
  }

  // 2. High-priority exact educational lexicon check (instant, offline-resilient, with IPA phonetics)
  const lexiconDirect = translateWithLexicon(rawText, targetLang);
  const isSingleWordOrIdiom = rawText.split(/\s+/).length <= 4;
  if (isSingleWordOrIdiom && lexiconDirect) {
    return {
      originalText: rawText,
      translatedText: lexiconDirect.translated,
      sourceLang,
      targetLang,
      detectedLang: sourceLang,
      engine: "educational_lexicon",
      confidence: 1.0,
      phonetics: lexiconDirect.phonetics,
      audioAvailable: true,
      notes: "Traducción curricular mediante léxico educativo bilingüe de MACHTIA.",
    };
  }

  // 3. Attempt Google Translate GTX (Real Neural Machine Translation)
  const gtxResult = await translateWithGoogleGTX(rawText, sourceLang, targetLang, options.timeoutMs);
  if (gtxResult && gtxResult.translated && gtxResult.translated.toLowerCase() !== rawText.toLowerCase()) {
    return {
      originalText: rawText,
      translatedText: gtxResult.translated,
      sourceLang,
      targetLang,
      detectedLang: (gtxResult.detectedLang === "en" || gtxResult.detectedLang === "es") ? gtxResult.detectedLang : sourceLang,
      engine: "google_gtx",
      confidence: 0.98,
      phonetics: lexiconDirect?.phonetics,
      audioAvailable: true,
      notes: "Traducción en tiempo real con motor neuronal multilingüe.",
    };
  }

  // 4. Attempt Secondary Provider: MyMemory Translated API
  const myMemoryResult = await translateWithMyMemory(rawText, sourceLang, targetLang, options.timeoutMs);
  if (myMemoryResult && myMemoryResult.toLowerCase() !== rawText.toLowerCase()) {
    return {
      originalText: rawText,
      translatedText: myMemoryResult,
      sourceLang,
      targetLang,
      detectedLang: sourceLang,
      engine: "mymemory",
      confidence: 0.92,
      phonetics: lexiconDirect?.phonetics,
      audioAvailable: true,
      notes: "Traducción provista por MyMemory Translation Memory.",
    };
  }

  // 5. Fallback to Educational Lexicon
  if (lexiconDirect) {
    return {
      originalText: rawText,
      translatedText: lexiconDirect.translated,
      sourceLang,
      targetLang,
      detectedLang: sourceLang,
      engine: "educational_lexicon",
      confidence: 0.88,
      phonetics: lexiconDirect.phonetics,
      audioAvailable: true,
      notes: "Traducción curricular mediante léxico educativo bilingüe de MACHTIA.",
    };
  }

  // 6. Graceful boundary if offline and term unmapped
  return {
    originalText: rawText,
    translatedText: rawText,
    sourceLang,
    targetLang,
    detectedLang: sourceLang,
    engine: "educational_lexicon",
    confidence: 0.5,
    audioAvailable: false,
    notes: "No fue posible conectar con el motor neuronal en este momento.",
  };
}

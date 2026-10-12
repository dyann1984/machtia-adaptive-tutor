import { describe, it, expect } from "vitest";
import { translateText, detectLanguage } from "@/lib/translation/translator-service";
import { miaAgent } from "@/lib/ai/mia-agent";
import { classifyStudentIntent } from "@/lib/ai/intent-router";
import {
  normalizeOralSpeech,
  normalizeOralEnglishText,
  normalizeOralMathText,
} from "@/lib/tts/normalization";
import { findPreferredEnglishVoice, findPreferredSpanishVoice } from "@/lib/hooks/use-speech";
import {
  evaluatePronunciation,
  PRACTICE_PHRASES,
  ENGLISH_LESSONS,
} from "@/lib/english/english-curriculum";

describe("MIA 3.0 Bilingual & Neural Translator System", () => {
  // =========================================================================
  // 1. NEURAL TRANSLATION SERVICE
  // =========================================================================
  describe("1. Bilingual Translation Engine (translateText)", () => {
    it("translates 'Hola' to 'Hello' (ES -> EN)", async () => {
      const result = await translateText({ text: "Hola", targetLang: "en" });
      expect(result.originalText).toBe("Hola");
      expect(result.translatedText.toLowerCase()).toMatch(/hello|hi/);
      expect(result.targetLang).toBe("en");
      expect(result.audioAvailable).toBe(true);
    });

    it("translates 'Good morning' to 'Buenos días' (EN -> ES)", async () => {
      const result = await translateText({ text: "Good morning", targetLang: "es" });
      expect(result.originalText).toBe("Good morning");
      expect(result.translatedText.toLowerCase()).toMatch(/buenos d[ií]as|buen d[ií]a/);
      expect(result.targetLang).toBe("es");
      expect(result.audioAvailable).toBe(true);
    });

    it("automatically detects source language correctly", () => {
      expect(detectLanguage("Hola cómo estás hoy")).toBe("es");
      expect(detectLanguage("Good morning teacher, how are you")).toBe("en");
      expect(detectLanguage("What is your name?")).toBe("en");
      expect(detectLanguage("¿Dónde está la biblioteca?")).toBe("es");
    });

    it("translates complete expressions accurately in both directions", async () => {
      const res1 = await translateText({ text: "The cat is blue", targetLang: "es" });
      expect(res1.translatedText.toLowerCase()).toContain("gato");
      expect(res1.translatedText.toLowerCase()).toContain("azul");

      const res2 = await translateText({ text: "Me gusta leer libros", targetLang: "en" });
      expect(res2.translatedText.toLowerCase()).toMatch(/like.*read.*book/i);
    });
  });

  // =========================================================================
  // 2. CONVERSATION IN ENGLISH & INTENT ROUTING
  // =========================================================================
  describe("2. English with MIA Conversation & Intent Routing", () => {
    it("routes and answers 'What is your name?' naturally in English", async () => {
      const intent = classifyStudentIntent("What is your name?");
      expect(intent.intent).toBe("english_name_who");

      const response = await miaAgent.respond("What is your name?", "english");
      expect(response.reply).toMatch(/MIA/i);
      expect(response.reply).toMatch(/name/i);
      expect(response.language).toBe("en");
      expect(response.reply).not.toContain("pasito a pasito");
      expect(response.reply.length).toBeLessThan(550);
    });

    it("routes and answers 'Explain fractions in English' with pedagogical clarity", async () => {
      const intent = classifyStudentIntent("Explain fractions in English");
      expect(intent.intent).toBe("english_fractions");

      const response = await miaAgent.respond("Explain fractions in English", "english");
      expect(response.reply).toMatch(/fraction/i);
      expect(response.reply).toMatch(/half/i);
      expect(response.reply).toMatch(/quarter/i);
      expect(response.language).toBe("en");
      expect(response.reply).not.toContain("pasito a pasito");
      expect(response.reply.length).toBeLessThan(550);
    });

    it("routes and reformulates upon 'I don't understand' in English", async () => {
      const intent = classifyStudentIntent("I don't understand");
      expect(intent.intent).toBe("english_reformulation");

      const history = [
        { sender: "user" as const, text: "Explain fractions in English", topic: "Fractions in English" },
        { sender: "mia" as const, text: "Fractions are parts of a whole.", topic: "Fractions in English" },
      ];

      const response = await miaAgent.respond("I don't understand", "english", undefined, history);
      expect(response.reply.toLowerCase()).toMatch(/example|chocolate|step by step/i);
      expect(response.language).toBe("en");
      expect(response.reply).not.toContain("pasito a pasito");
      expect(response.reply.length).toBeLessThan(550);
    });

    it("allows requesting explanations in Spanish without losing conversational context", async () => {
      const intent = classifyStudentIntent("No entendí, explícamelo en español");
      expect(intent.intent).toBe("english_switch_to_spanish");

      const history = [
        { sender: "user" as const, text: "Explain fractions in English", topic: "Fractions in English" },
        { sender: "mia" as const, text: "Fractions are parts of a whole.", topic: "Fractions in English" },
      ];

      const response = await miaAgent.respond("No entendí, explícamelo en español", "english", undefined, history);
      expect(response.language).toBe("es");
      expect(response.reply.toLowerCase()).toMatch(/pizza|fraccion|un medio|un cuarto/i);
      expect(response.reply).not.toContain("pasito a pasito");
      expect(response.reply.length).toBeLessThan(550);
    });

    it("answers curricular science questions in English", async () => {
      const response = await miaAgent.respond("Why does it rain?", "english");
      expect(response.language).toBe("en");
      expect(response.reply.toLowerCase()).toMatch(/cycle|water|clouds|rain/i);
      expect(response.reply.length).toBeLessThan(550);
    });

    it("teaches English vocabulary: colors, animals, numbers", async () => {
      const colorsRes = await miaAgent.respond("Teach me colors in English", "english");
      expect(colorsRes.language).toBe("en");
      expect(colorsRes.reply).toMatch(/Red/);
      expect(colorsRes.reply).toMatch(/Blue/);

      const animalsRes = await miaAgent.respond("Teach me animals in English", "english");
      expect(animalsRes.language).toBe("en");
      expect(animalsRes.reply).toMatch(/Dog/);
      expect(animalsRes.reply).toMatch(/Cat/);

      const numbersRes = await miaAgent.respond("Teach me numbers in English", "english");
      expect(numbersRes.language).toBe("en");
      expect(numbersRes.reply).toMatch(/One/);
      expect(numbersRes.reply).toMatch(/Two/);
    });
  });

  // =========================================================================
  // 3. SPEECH NORMALIZATION & LANGUAGE-AWARE VOCALIZATION
  // =========================================================================
  describe("3. Oral Speech Normalization & Voice Selection (en-US vs es-MX)", () => {
    it("normalizes English math text into spoken English, NOT Spanish words", () => {
      const rawEnglish = "1/2 is equal to 2/4. 8 × 7 = 56.";
      const oralEnglish = normalizeOralSpeech(rawEnglish, "en-US");

      // Must be in English
      expect(oralEnglish).toContain("one half");
      expect(oralEnglish).toContain("two quarters");
      expect(oralEnglish).toContain("8 times 7 equals 56");

      // Must NOT contain Spanish words
      expect(oralEnglish).not.toContain("un medio");
      expect(oralEnglish).not.toContain("dos cuartos");
      expect(oralEnglish).not.toContain("por");
      expect(oralEnglish).not.toContain("es igual a");
    });

    it("normalizes Spanish math text into spoken Mexican Spanish", () => {
      const rawSpanish = "1/2 es igual a 2/4. 8 × 7 = 56.";
      const oralSpanish = normalizeOralSpeech(rawSpanish, "es-MX");

      expect(oralSpanish).toContain("un medio");
      expect(oralSpanish).toContain("dos cuartos");
      expect(oralSpanish).toContain("8 por 7 es igual a 56");
    });

    it("finds preferred English voice correctly and prioritizes en-US female natural voice", () => {
      const mockVoices = [
        { name: "Microsoft Sabina - Spanish (Mexico)", lang: "es-MX" },
        { name: "Microsoft David - English (United States)", lang: "en-US" },
        { name: "Microsoft Jenny Online (Natural) - English (United States)", lang: "en-US" },
        { name: "Microsoft Zira - English (United States)", lang: "en-US" },
      ] as SpeechSynthesisVoice[];

      const englishVoice = findPreferredEnglishVoice(mockVoices);
      expect(englishVoice).toBeDefined();
      expect(englishVoice?.name).toContain("Jenny");
      expect(englishVoice?.lang).toBe("en-US");
    });

    it("never selects a Spanish voice for English synthesis when English voices exist", () => {
      const mockVoices = [
        { name: "Microsoft Dalia Online Natural - Spanish (Mexico)", lang: "es-MX" },
        { name: "Microsoft Samantha - English (United States)", lang: "en-US" },
      ] as SpeechSynthesisVoice[];

      const englishVoice = findPreferredEnglishVoice(mockVoices);
      expect(englishVoice?.lang).toBe("en-US");
      expect(englishVoice?.name).toContain("Samantha");
    });
  });

  // =========================================================================
  // 4. PRONUNCIATION TRAINER & ACOUSTIC EVALUATION
  // =========================================================================
  describe("4. Pronunciation Evaluation (Acoustic-grounded)", () => {
    it("evaluates a perfect spoken match with high accuracy (>= 90%)", () => {
      const target = "The cat is blue";
      const spoken = "the cat is blue";
      const evalResult = evaluatePronunciation(spoken, target);

      expect(evalResult.valid).toBe(true);
      expect(evalResult.accuracy).toBe(100);
      expect(evalResult.wordResults.every((w) => w.status === "match")).toBe(true);
      expect(evalResult.praise).toContain("Excelente");
    });

    it("accurately identifies mispronounced or missing tokens", () => {
      const target = "The cat is blue";
      const spoken = "the dog is blue"; // substituted 'cat' with 'dog'
      const evalResult = evaluatePronunciation(spoken, target);

      expect(evalResult.valid).toBe(true);
      expect(evalResult.accuracy).toBeLessThan(100);
      expect(evalResult.accuracy).toBeGreaterThanOrEqual(60);

      const catWord = evalResult.wordResults.find((w) => w.word === "cat");
      expect(catWord?.status).not.toBe("match");
    });

    it("rejects empty audio transcripts with zero fake score and clear instructions", () => {
      const target = "Good morning teacher";
      const emptyTranscript = "";
      const evalResult = evaluatePronunciation(emptyTranscript, target);

      expect(evalResult.valid).toBe(false);
      expect(evalResult.accuracy).toBe(0);
      expect(evalResult.feedback).toContain("No se detectó audio claro");
    });

    it("provides specific phonetic tips for difficult sounds like 'th' or silent 'l'", () => {
      const evalResult = evaluatePronunciation("one haf", "One half");
      expect(evalResult.phoneticTip).toBeDefined();
      expect(evalResult.phoneticTip).toContain("half");
    });

    it("contains structured beginner, intermediate, and advanced phrases", () => {
      expect(PRACTICE_PHRASES.length).toBeGreaterThanOrEqual(8);
      const beginner = PRACTICE_PHRASES.filter((p) => p.level === "beginner");
      const intermediate = PRACTICE_PHRASES.filter((p) => p.level === "intermediate");
      const advanced = PRACTICE_PHRASES.filter((p) => p.level === "advanced");

      expect(beginner.length).toBeGreaterThan(0);
      expect(intermediate.length).toBeGreaterThan(0);
      expect(advanced.length).toBeGreaterThan(0);
    });
  });
});

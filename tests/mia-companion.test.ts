import { describe, it, expect } from "vitest";
import { miaAgent, detectEducationalTopic } from "@/lib/ai/mia-agent";

describe("MIA (Machtia Inteligencia Adaptativa) - Companion Tests", () => {
  it("detects key curricular and curiosity topics correctly", () => {
    expect(detectEducationalTopic("¿Por qué el cielo es azul?").key).toBe("cielo_azul");
    expect(detectEducationalTopic("Enséñame las tablas").key).toBe("tablas_multiplicar");
    expect(detectEducationalTopic("¿Qué es un agujero negro?").key).toBe("agujero_negro");
    expect(detectEducationalTopic("¿Cómo se dice perro en inglés?").key).toBe("ingles_perro");
    expect(detectEducationalTopic("Explícame los dinosaurios").key).toBe("dinosaurios");
    expect(detectEducationalTopic("¿Qué es una fracción?").key).toBe("fracciones");
    expect(detectEducationalTopic("Quiero aprender programación").key).toBe("programacion");
    expect(detectEducationalTopic("Cuéntame sobre los planetas").key).toBe("planetas");
    expect(detectEducationalTopic("No entendí mi tarea").key).toBe("tarea_dudas");
    expect(detectEducationalTopic("Reglas de ortografía y acentos").key).toBe("ortografia");
  });

  it("responds in Modo Pregunta Libre with age-adapted explanations", async () => {
    const res = await miaAgent.respond("¿Por qué el cielo es azul?", "free");
    expect(res.mode).toBe("free");
    expect(res.topic).toContain("La luz y la atmósfera");
    expect(res.reply).toContain("luz del Sol");
    expect(res.reply).toContain("atmósfera");
    expect(res.funFact).toBeDefined();
    expect(res.funFact).toContain("Luna");
  });

  it("responds in Modo Curiosidad with analogies, stories and mini-challenges", async () => {
    const res = await miaAgent.respond("¿Qué es un agujero negro?", "curiosity");
    expect(res.mode).toBe("curiosity");
    expect(res.topic).toContain("Astronomía");
    expect(res.reply).toContain("Imagina");
    expect(res.reply).toContain("Dato Asombroso");
    expect(res.challenge).toBeDefined();
    expect(res.challenge).toContain("espagueti");
  });

  it("guides without immediately giving away the answer in Modo Práctica", async () => {
    const res = await miaAgent.respond("¿Cuál es la respuesta de la fracción?", "practice", {
      topicName: "Fracciones Equivalentes",
      exercisePrompt: "Encuentra la fracción equivalente a 1/2",
    });
    expect(res.mode).toBe("practice");
    expect(res.reply.toLowerCase()).toContain("práctica");
    expect(res.reply).toContain("numerador");
    expect(res.reply).toContain("denominador");
    // Does NOT say "la respuesta es 2/4" directly as a giveaway
    expect(res.reply).not.toContain("la respuesta correcta es");
  });

  it("handles general questions warmly without failing", async () => {
    const res = await miaAgent.respond("¿Cómo vuelan los aviones?", "free");
    expect(res.mode).toBe("free");
    expect(res.reply.length).toBeGreaterThan(50);
  });
});

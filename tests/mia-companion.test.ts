import { describe, it, expect, vi } from "vitest";
import { miaAgent, detectEducationalTopic } from "@/lib/ai/mia-agent";
import { ElevenLabsTTSAdapter } from "@/lib/tts/elevenlabs-adapter";
import { stopAllGlobalAudio, registerGlobalAudioSource } from "@/lib/hooks/use-speech";

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

  it("A. Responde a '¿Quién descubrió América?' con Colón, 1492 y pueblos originarios (sin contaminación de fracciones)", async () => {
    // Crucial: Even when practiceContext is present, history question MUST NOT return fraction hint!
    const res = await miaAgent.respond("¿Quién descubrió América?", "practice", {
      topicName: "Fracciones Equivalentes",
      exercisePrompt: "Compara 1/2 con 2/4",
    });
    expect(res.reply).toContain("Cristóbal Colón");
    expect(res.reply).toContain("1492");
    expect(res.reply).toContain("pueblos originarios");
    // Absolutely NO fraction hints or denominator contamination
    expect(res.reply).not.toContain("denominador");
    expect(res.reply).not.toContain("numerador");
    expect(res.reply).not.toContain("rebanada de pastel");
  });

  it("B. Responde a 'Explícame un medio y un cuarto' con explicación matemática visual clara", async () => {
    const res = await miaAgent.respond("Explícame un medio y un cuarto", "free");
    expect(res.reply).toContain("1/2");
    expect(res.reply).toContain("1/4");
    expect(res.reply).toContain("DOBLE");
    expect(res.topic).toContain("Un Medio");
  });

  it("C. Responde a 'No entendí, explícamelo de otra manera' con reformulación adaptativa basada en el turno previo", async () => {
    const history = [
      { sender: "user" as const, text: "Explícame un medio y un cuarto" },
      { sender: "mia" as const, text: "Un medio es la mitad y un cuarto es...", topic: "Un Medio (1/2) y Un Cuarto (1/4)" },
    ];
    const res = await miaAgent.respond("No entendí, explícamelo de otra manera", "free", undefined, history);
    expect(res.reply).toContain("monedas");
    expect(res.reply).toContain("10 pesos");
    expect(res.topic).toContain("Reformulación");
  });

  it("D. Procesa correctamente preguntas recibidas por micrófono / oralidad transcrita", async () => {
    // Simulating speech recognition text arriving from microphone
    const oralInputs = [
      "Quiero saber quién descubrió América",
      "Explícame qué es un medio y un cuarto por favor",
      "No entendí nada puedes decírmelo con otro ejemplo",
    ];

    for (const oralText of oralInputs) {
      const res = await miaAgent.respond(oralText, "free");
      expect(res.reply).toBeDefined();
      expect(res.reply.length).toBeGreaterThan(40);
      expect(res.topic).toBeDefined();
      expect(res.aiProvider).toBe("pedagogical-engine");
    }
  });

  it("E. Maneja 5 respuestas consecutivas de audio sin superposición, bloqueos ni fallos", async () => {
    // Verifies audio cancellation registry and sequential synthesis
    const stopMock1 = vi.fn();
    const stopMock2 = vi.fn();
    const unregister1 = registerGlobalAudioSource(stopMock1);
    const unregister2 = registerGlobalAudioSource(stopMock2);

    // Call stopAllGlobalAudio to verify interruption coordination
    stopAllGlobalAudio();
    expect(stopMock1).toHaveBeenCalledTimes(1);
    expect(stopMock2).toHaveBeenCalledTimes(1);

    unregister1();
    unregister2();

    // Verify 5 consecutive synthesis inquiries execute cleanly
    const queries = [
      "¿Quién descubrió América?",
      "Explícame un medio y un cuarto",
      "No entendí, explícamelo de otra manera",
      "¿Por qué el cielo es azul?",
      "¿Qué es un agujero negro?",
    ];

    const responses = [];
    for (const q of queries) {
      const r = await miaAgent.respond(q, "free");
      expect(r.reply).toBeDefined();
      expect(r.reply.length).toBeGreaterThan(30);
      responses.push(r);
    }
    expect(responses).toHaveLength(5);
  });

  it("F. Navegación docente-alumno y consulta diagnóstica de Mariana López", async () => {
    const diag = await miaAgent.respond("¿Cuál es el diagnóstico de Mariana?", "practice", {
      studentName: "Mariana López",
      diagnosticScore: 52,
      topicName: "Fracciones Equivalentes",
    });

    expect(diag.reply).toContain("Mariana López");
    expect(diag.reply).toContain("52%");
    expect(diag.reply).toContain("Fracciones Equivalentes");
    expect(diag.topic).toContain("Diagnóstico");
  });

  // =========================================================================
  // REGRESSION SUITE: PREVENCIÓN DE PLANTILLA GENÉRICA (P0 INCIDENT)
  // =========================================================================

  it("G. 'Hola MIA' responde con saludo breve, cálido y natural (sin plantilla genérica)", async () => {
    const res = await miaAgent.respond("Hola MIA", "free");
    expect(res.reply).toContain("¡Hola!");
    expect(res.reply).toContain("MIA");
    expect(res.reply.length).toBeLessThan(350);
    // MUST NOT contain the deprecated generic template
    expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
    expect(res.topic).toContain("Saludo");
  });

  it("H. '¿Cuáles son los colores primarios?' responde correctamente diferenciando pintura y luz", async () => {
    const res = await miaAgent.respond("¿Cuáles son los colores primarios?", "free");
    expect(res.reply).toContain("colores primarios");
    expect(res.reply).toContain("Rojo");
    expect(res.reply).toContain("Amarillo");
    expect(res.reply).toContain("Azul");
    // Differentiates paint vs light (RGB / Verde)
    expect(res.reply).toContain("Verde");
    expect(res.reply).toContain("luz");
    expect(res.reply).toContain("pantallas");
    // MUST NOT contain the deprecated generic template
    expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
    expect(res.topic).toContain("Colores Primarios");
  });

  it("I. '¿Por qué llueve?' explica el ciclo del agua (evaporación, condensación, lluvia)", async () => {
    const res = await miaAgent.respond("¿Por qué llueve?", "free");
    const norm = res.reply.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    expect(norm).toContain("agua");
    expect(norm).toContain("evaporacion");
    expect(norm).toContain("nubes");
    expect(norm).toContain("lluvia");
    expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
    expect(res.topic).toContain("Ciclo del Agua");
  });

  it("J. '¿Qué es un dinosaurio?' explica reptiles mesozoicos, fósiles y aves descendientes", async () => {
    const res = await miaAgent.respond("¿Qué es un dinosaurio?", "free");
    expect(res.reply).toContain("dinosaurios");
    expect(res.reply).toContain("reptiles");
    expect(res.reply).toContain("fósiles");
    expect(res.reply).toContain("aves");
    expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
    expect(res.topic.toLowerCase()).toContain("dinosaurios");
  });

  it("K. '¿Cuánto es 8 × 7?' calcula determinísticamente 56 con explicación visual", async () => {
    const queries = ["¿Cuánto es 8 × 7?", "8 x 7", "8 * 7", "cuanto es 8 por 7"];
    for (const q of queries) {
      const res = await miaAgent.respond(q, "free");
      expect(res.reply).toContain("56");
      expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
      expect(res.topic).toContain("Matemáticas");
    }
  });

  it("L. 'No entendí' reformula contextual y adaptativamente según el turno previo", async () => {
    const historyWithColors = [
      { sender: "user" as const, text: "¿Cuáles son los colores primarios?" },
      { sender: "mia" as const, text: "Los colores primarios son rojo, amarillo y azul...", topic: "Arte y Ciencias · Colores Primarios" },
    ];
    const res = await miaAgent.respond("No entendí", "free", undefined, historyWithColors);
    expect(res.reply).toContain("licuado");
    expect(res.reply).toContain("frutas");
    expect(res.topic).toContain("Reformulación");
    expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
  });

  it("M. Preguntas fuera de catálogo indican limitación pedagógica transparente sin inventar explicaciones", async () => {
    const res = await miaAgent.respond("¿Cuál es la capital de Kazajistán?", "free");
    expect(res.reply).toContain("temas curriculares de primaria");
    expect(res.reply).toContain("IA generativa en la nube");
    expect(res.reply).not.toContain("todos los temas importantes se construyen pasito a pasito");
    expect(res.topic).toContain("Catálogo Curricular");
  });
});

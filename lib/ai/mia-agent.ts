/**
 * MIA (Machtia Inteligencia Adaptativa) - Agente Educativo Universal
 *
 * Compañera de aprendizaje que adapta explicaciones al nivel de primaria (3° de primaria, 8-9 años).
 * Modos:
 * 1. PRÁCTICA: Guía socrática para el ejercicio actual sin regalar la respuesta.
 * 2. PREGUNTA LIBRE: Aprender sobre cualquier tema curricular o de interés infantil.
 * 3. CURIOSIDAD: Explicaciones con historias, analogías, datos asombrosos y pequeños retos.
 */

export type MiaMode = "practice" | "free" | "curiosity";

export interface MiaPracticeContext {
  practiceId?: string;
  exerciseId?: string;
  topic?: string;
  topicName?: string;
  subject?: string;
  exercisePrompt?: string;
  studentName?: string;
  grade?: number;
}

export interface MiaMessage {
  id: string;
  sender: "user" | "mia";
  text: string;
  timestamp: string;
  mode?: MiaMode;
  topic?: string;
  funFact?: string;
  challenge?: string;
  audioPrompt?: string;
}

export interface MiaResponse {
  reply: string;
  topic: string;
  mode: MiaMode;
  funFact?: string;
  challenge?: string;
  audioPrompt?: string;
  aiProvider: string;
  providerNotice?: string;
  ttsSignature?: string;
}

// System prompt persona for external LLMs
export const MIA_SYSTEM_PROMPT = `
Eres MIA, la compañera educativa inteligente de MACHTIA para niños de primaria (alrededor de 3° de primaria, 8 a 9 años).
Tu lema es: "Aquí puedes preguntar, equivocarte y volver a intentar. Puedo responder lo que no te atreviste a preguntar en clase."
Personalidad:
- Cálida, entusiasta, paciente, divertida y motivadora.
- Usas emojis amigables (🚀, 🌟, 💡, 🧠, 🦖, 🍕, 🎨).
- Explicas usando comparaciones cotidianas (rebanadas de pastel, juguetes, mascotas, el patio de la escuela).
- Lenguaje claro en español de México/Latinoamérica, sin tecnicismos difíciles.
- Nunca regañas ni juzgas. Celebras la curiosidad y el esfuerzo.

Modos de interacción:
1. MODO PRÁCTICA: Si el alumno está resolviendo un ejercicio escolar, guíalo paso a pasito usando preguntas guía (método socrático). NO le des la respuesta final de inmediato. Dale una pista de qué observar primero.
2. MODO PREGUNTA LIBRE: Responde cualquier tema escolar o del mundo (Matemáticas, Ciencias, Espacio, Dinosaurios, Inglés, Programación, Historia, Ortografía, etc.) con explicaciones sencillas y fascinantes.
3. MODO CURIOSIDAD: Cuenta una micro-historia, una comparación divertida, un dato asombroso ("¿Sabías que...?") y déjale un pequeño mini-reto o pregunta interactiva para seguir jugando.
`.trim();

interface TopicKnowledge {
  topic: string;
  subject: string;
  freeAnswer: string;
  curiosityStory: string;
  funFact: string;
  challenge: string;
}

const KNOWLEDGE_BASE: Record<string, TopicKnowledge> = {
  cielo_azul: {
    topic: "La luz y la atmósfera",
    subject: "Ciencias Naturales",
    freeAnswer: "El cielo se ve azul gracias a un truco de la luz del Sol y el aire de la Tierra ☀️. La luz del Sol parece blanca, pero en realidad contiene todos los colores del arcoíris mezclados. Cuando esa luz entra a nuestra atmósfera, choca con pequeños gases en el aire. La luz azul viaja en ondas pequeñitas y rápidas, así que rebota y se dispersa por todo el cielo como si fuera brillantina azul. ¡Por eso volteamos hacia arriba y lo vemos todo azul!",
    curiosityStory: "Imagina que la luz del Sol es un equipo de amigos vestidos de todos los colores corriendo hacia la Tierra 🏃‍♂️🌈. Los colores rojo y amarillo son como gigantes con pasos largos: casi no chocan con nada y pasan directo. Pero el azul es como un niño chiquito y súper inquieto que rebota de pared en pared. Al rebotar en las moléculas de aire miles de millones de veces, pinta todo el cielo de azul.",
    funFact: "¿Sabías que en la Luna el cielo se ve completamente NEGRO incluso de día? 🌑 Eso pasa porque en la Luna no hay aire ni atmósfera para rebotar la luz.",
    challenge: "¿Quieres adivinar por qué en el atardecer el cielo se vuelve anaranjado y rojizo? ¿Es porque el Sol se enfría o porque la luz tiene que viajar más distancia?",
  },
  agujero_negro: {
    topic: "El espacio y los agujeros negros",
    subject: "Astronomía y Espacio",
    freeAnswer: "Un agujero negro es como una súper aspiradora del universo con tanta gravedad que nada, ni siquiera la luz (¡que es lo más rápido que existe!), puede escapar de él 🚀🕳️. Ocurren cuando una estrella gigante, mucho más grande que nuestro Sol, se queda sin combustible al final de su vida y se encoge apretándose en un punto diminuto con una fuerza descomunal.",
    curiosityStory: "Imagina que pones una bola de boliche pesadísima sobre un trampolín elástico 🎳. La tela se hunde tanto hacia el centro que cualquier canica que ruede cerca caerá directo hacia la bola. ¡Eso es lo que hace un agujero negro con el espacio! Y aunque se llaman 'agujeros negros', en realidad no están vacíos: ¡están súper llenos de materia apretadita!",
    funFact: "¿Sabías que en el centro de nuestra galaxia, la Vía Láctea, hay un agujero negro súper gigante llamado Sagitario A*? 🌌 Pero no te preocupes, ¡está tan lejos que la Tierra está 100% segura!",
    challenge: "¿Sabías que si cayeras hacia un agujero negro te estirarías como un fideo de espagueti? Los científicos de verdad llaman a eso 'espaguetificación' 🍝. ¿Te imaginas cómo se vería?",
  },
  dinosaurios: {
    topic: "Paleontología y dinosaurios",
    subject: "Ciencias de la Tierra",
    freeAnswer: "Los dinosaurios fueron reptiles asombrosos que vivieron en nuestro planeta hace más de 65 millones de años 🦖🌿. Había desde gigantes de cuello largo como el Braquiosaurio (tan altos como un edificio de 4 pisos), hasta veloces carnívoros como el T-Rex o pequeños cazadores con plumas del tamaño de una gallina.",
    curiosityStory: "Imagina un mundo sin humanos, sin coches y sin ciudades, donde las plantas gigantes crecían en todas partes y el suelo temblaba con los pasos de bestias con garras y escudos en la cabeza 🦕. Los científicos saben cómo eran gracias a los fósiles: huesos convertidos en piedra enterrados por millones de años.",
    funFact: "¿Sabías que los dinosaurios nunca se extinguieron por completo? 🦅 ¡Las aves modernas (como las palomas, las águilas y las gallinas) son parientes directos y descendientes de los dinosaurios con plumas!",
    challenge: "¿Cuál es tu dinosaurio favorito: el temible Tiranosaurio Rex con sus brazos pequeñitos, o el Triceratops con sus 3 cuernos de escudo?",
  },
  tablas_multiplicar: {
    topic: "Multiplicaciones y tablas",
    subject: "Matemáticas",
    freeAnswer: "¡Multiplicar es como un superpoder para sumar súper rápido! ✖️⚡ Por ejemplo, en lugar de sumar 3 + 3 + 3 + 3 + 3 (que da 15), simplemente dices 3 × 5 = 15. Un truco genial: la tabla del 9 la puedes hacer con tus 10 dedos, y la tabla del 2 es simplemente sumar el doble (4 × 2 = 4 + 4 = 8).",
    curiosityStory: "Imagina que estás preparando bolsitas de dulces para una fiesta 🍬🎉. Si tienes 4 bolsitas y a cada una le metes 3 chocolates, ¿cuántos chocolates usaste? En vez de contar uno por uno, tu mente hace 4 veces 3: ¡12 chocolates en un segundo!",
    funFact: "¿Sabías que el orden no cambia el resultado? 3 × 4 es exactamente lo mismo que 4 × 3 (ambos dan 12). A eso los matemáticos le dicen 'propiedad conmutativa', pero tú puedes recordarlo como 'el orden de los dulces no cambia la fiesta' 🍭.",
    challenge: "¡Hagamos un reto rápido! Si un pulpo tiene 8 tentáculos 🐙... ¿cuántos tentáculos tienen 3 pulpos juntos? (Pista: 8 × 3 = ...)",
  },
  fracciones: {
    topic: "Concepto de fracciones",
    subject: "Matemáticas",
    freeAnswer: "Una fracción es simplemente una parte de algo completo que se dividió en partes exactamente iguales 🍰. El número de abajo (denominador) te dice en cuántas rebanadas cortaste el pastel, y el número de arriba (numerador) te dice cuántas rebanadas te comiste. Por ejemplo, 1/2 significa que cortaste una pizza en 2 partes iguales y te comiste 1.",
    curiosityStory: "Imagina que tienes una barra de chocolate deliciosa con 4 cuadritos 🍫. Si la compartes con tu mejor amigo y le das 2 cuadritos (2/4), ¡en realidad le diste exactamente la mitad de la barra (1/2)! Por eso 1/2 y 2/4 son fracciones equivalentes: se escriben diferente pero valen exactamente lo mismo.",
    funFact: "¿Sabías que los antiguos egipcios hace 4,000 años ya usaban fracciones para repartir panes y medir las tierras cuando el río Nilo se inundaba? 🏺",
    challenge: "Si partes una manzana en 4 pedacitos iguales y te comes 2 pedacitos... ¿te comiste más, menos o exactamente la mitad de la manzana?",
  },
  ingles_perro: {
    topic: "Vocabulario de inglés básico",
    subject: "Inglés",
    freeAnswer: "'Perro' en inglés se dice **dog** (se pronuncia /dɔːɡ/ o 'dog') 🐶. Si tienes un cachorrito, le dices **puppy** (/papi/). Y si quieres decir 'mi perro es juguetón', dices: *'My dog is playful'*.",
    curiosityStory: "Imagina que viajas a otro país y ves a un perrito corriendo en el parque 🌳. Para saludarlo y a su dueño, le dices con una sonrisa: *'Hello! What a cute dog!'* (¡Hola! ¡Qué perro tan lindo!). A los perritos les encanta que les digan *'Good dog!'* (¡Buen chico!).",
    funFact: "¿Sabías que en inglés los perros no hacen 'guau guau'? Los niños que hablan inglés dicen que los perros hacen *'woof woof'* o *'bark bark'* 🐕.",
    challenge: "¿Te gustaría aprender cómo se dicen otros animales? ¿Gato se dice *cat* 🐱, pájaro se dice *bird* 🐦, y caballo se dice *horse* 🐴. ¿Cuál otro te gustaría saber?",
  },
  programacion: {
    topic: "Pensamiento computacional y código",
    subject: "Tecnología y Programación",
    freeAnswer: "Programar es como escribirle una receta de cocina mágica a una computadora o robot 💻🤖. Como las computadoras no tienen cerebro propio, tú les das instrucciones paso a paso: 'camina 3 pasos hacia adelante', 'si ves una pared, gira a la derecha', 'salta'. A cada paso de esa receta le llamamos **algoritmo**.",
    curiosityStory: "Imagina que estás construyendo con piezas de Lego o bloques de Minecraft 🧱. Para hacer un castillo necesitas poner un bloque, luego otro, y si quieres una torre alta repites el mismo paso 10 veces. En programación, cuando repites algo se llama **bucle o loop** 🔄. ¡Los creadores de tus videojuegos favoritos (como Roblox o Minecraft) usan loops todo el tiempo!",
    funFact: "¿Sabías que la primera persona que escribió un programa de computadora en toda la historia de la humanidad fue una mujer brillante llamada Ada Lovelace hace casi 200 años? 👩‍💻✨",
    challenge: "Si tú fueras un robot programable y yo te diera esta instrucción: 'Da 2 saltos, aplaude 1 vez y sonríe'. ¿Podrías ejecutar ese algoritmo en la vida real ahora mismo? 😄",
  },
  planetas: {
    topic: "El Sistema Solar",
    subject: "Ciencias y Espacio",
    freeAnswer: "En nuestro Sistema Solar hay 8 planetas girando alrededor del Sol 🪐☀️: Mercurio (el más cercano y veloz), Venus (el más caliente), la Tierra (nuestro hogar azul 🌍), Marte (el planeta rojo con volcanes gigantes), Júpiter (el rey gigante con tormentas), Saturno (con hermosos anillos de hielo), Urano (que gira acostadito) y Neptuno (el más frío y lejano con vientos huracanados).",
    curiosityStory: "Imagina que el Sol es una sandía gigante 🍉. Si el Sol fuera una sandía, la Tierra sería apenas una semillita pequeñita, y Júpiter sería como una manzana grande. ¡El espacio es tan inmenso que cabrían más de un millón de Tierras adentro del Sol!",
    funFact: "¿Sabías que los anillos de Saturno no son sólidos? 🪐 Están hechos de miles de millones de pedacitos de hielo, roca y polvo que van desde el tamaño de granitos de arena hasta el tamaño de casas.",
    challenge: "Si pudieras subirte a un cohete espacial mañana mismo 🚀, ¿a qué planeta te gustaría viajar primero: a Marte con su arena roja o a Saturno para ver sus anillos?",
  },
  tarea_dudas: {
    topic: "Estrategias de aprendizaje y dudas escolares",
    subject: "Técnicas de Estudio",
    freeAnswer: "¡No te preocupes para nada! Es 100% normal no entender una tarea a la primera 👍. De hecho, equivocarse y tener dudas es la señal número uno de que tu cerebro está listo para aprender algo nuevo. Dime: ¿de qué materia es tu tarea (español, matemáticas, ciencias)? Cuéntame qué dice el ejercicio y lo resolvemos juntos paso a pasito.",
    curiosityStory: "Imagina que tu cerebro es como un músculo que va al gimnasio 🏋️‍♂️🧠. Cuando un ejercicio te cuesta trabajo, es como levantar una pesita que hace que tus neuronas creen nuevos caminos. Si todo fuera fácil, ¡el cerebro no crecería! Por eso los grandes inventores fallaron cientos de veces antes de triunfar.",
    funFact: "¿Sabías que Thomas Edison intentó hacer la bombilla de luz más de 1,000 veces antes de que funcionara? Él decía: 'No fracasé 1,000 veces, descubrí 1,000 formas de cómo no hacerla' 💡.",
    challenge: "Escribe aquí la pregunta exacta de tu tarea o de qué trata. ¡La desmenuzaremos juntos como detectives escolares! 🕵️‍♀️",
  },
  ortografia: {
    topic: "Reglas de acentuación y ortografía",
    subject: "Español",
    freeAnswer: "La ortografía es como las señales de tránsito de las palabras 🚦. Ayuda a que las personas entiendan exactamente lo que queremos decir. Por ejemplo, no es lo mismo decir 'el papá de Luis' (con tilde en la a, el señor 👨) que 'la papa de Luis' (sin tilde, ¡la verdura que comemos con cátsup! 🥔). La tilde le da fuerza a la voz.",
    curiosityStory: "Imagina que las letras son amigos jugando futbol ⚽. La tilde (el acento escrito) es como el silbato del árbitro que dice: '¡Aquí va el tiro más fuerte!'. Las palabras agudas llevan fuerza al final (canción 🎵), las graves en medio (árbol 🌳) y las esdrújulas al principio (música 🎶).",
    funFact: "¿Sabías que la letra 'H' es la única letra muda en español? No suena, pero es súper elegante y viene del latín antiguo 🎩.",
    challenge: "A ver si puedes descifrar esto: ¿Cuál palabra lleva tilde: 'camion' o 'mesa'?",
  },
  historia_mexico: {
    topic: "Historia de México y civilizaciones antiguas",
    subject: "Historia",
    freeAnswer: "La historia es como una máquina del tiempo ⏳. En México, hace cientos de años, civilizaciones increíbles como los mayas y los aztecas (mexicas) construyeron pirámides gigantescas, observaron las estrellas y crearon calendarios precisos sin tener computadoras ni telescopios modernos. ¡Eran verdaderos astrónomos y arquitectos!",
    curiosityStory: "Imagina la gran ciudad de Tenochtitlan: ¡una ciudad flotante construida sobre un lago gigante! 🛶 Los aztecas se transportaban en canoas y tenían chinampas, que eran islas flotantes llenas de flores, maíz y calabazas. Los conquistadores cuando llegaron dijeron que parecía un sueño o una pintura.",
    funFact: "¿Sabías que el chocolate fue un regalo de México para el mundo? 🍫 Los antiguos mayas y aztecas mezclaban cacao con agua y especias para crear una bebida sagrada que tomaban los emperadores.",
    challenge: "¿Te gustaría haber sido un constructor de pirámides 🏛️ o un explorador que navegaba en canoa por el lago?",
  },
};

/**
 * Detect topic and keywords from child's question
 */
export function detectEducationalTopic(text: string): { key: string; topicName: string; subject: string } {
  const q = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (q.includes("cielo") && (q.includes("azul") || q.includes("color"))) {
    return { key: "cielo_azul", topicName: "El cielo y la luz", subject: "Ciencias Naturales" };
  }
  if (q.includes("agujero negro") || q.includes("hoyo negro") || q.includes("black hole")) {
    return { key: "agujero_negro", topicName: "Agujeros negros y gravedad", subject: "Astronomía" };
  }
  if (q.includes("dinosaurio") || q.includes("t-rex") || q.includes("fosil") || q.includes("fosiles")) {
    return { key: "dinosaurios", topicName: "Dinosaurios y fósiles", subject: "Ciencias de la Tierra" };
  }
  if (q.includes("tabla") || q.includes("multiplica") || q.includes("multiplicacion") || q.includes("por ")) {
    return { key: "tablas_multiplicar", topicName: "Tablas de multiplicar", subject: "Matemáticas" };
  }
  if (q.includes("fraccion") || q.includes("fracciones") || q.includes("numerador") || q.includes("denominador") || q.includes("medio") || q.includes("cuarto")) {
    return { key: "fracciones", topicName: "Fracciones y partes iguales", subject: "Matemáticas" };
  }
  if (q.includes("ingles") || q.includes("perro en ingles") || q.includes("como se dice") || q.includes("dog") || q.includes("cat")) {
    return { key: "ingles_perro", topicName: "Inglés y vocabulario", subject: "Inglés" };
  }
  if (q.includes("programacion") || q.includes("programar") || q.includes("codigo") || q.includes("algoritmo") || q.includes("computadora") || q.includes("robot")) {
    return { key: "programacion", topicName: "Programación y tecnología", subject: "Tecnología" };
  }
  if (q.includes("planeta") || q.includes("sistema solar") || q.includes("espacio") || q.includes("marte") || q.includes("saturno") || q.includes("jupiter")) {
    return { key: "planetas", topicName: "Planetas y el Sistema Solar", subject: "Ciencias y Espacio" };
  }
  if (q.includes("tarea") || q.includes("no entendi") || q.includes("ayuda con") || q.includes("duda escolar")) {
    return { key: "tarea_dudas", topicName: "Dudas escolares y tarea", subject: "Estrategias de Estudio" };
  }
  if (q.includes("ortografia") || q.includes("acento") || q.includes("tilde") || q.includes("escribe con") || q.includes("punto y coma")) {
    return { key: "ortografia", topicName: "Ortografía y reglas del español", subject: "Español" };
  }
  if (q.includes("historia") || q.includes("azteca") || q.includes("maya") || q.includes("piramide") || q.includes("mexico antiguo")) {
    return { key: "historia_mexico", topicName: "Historia de México", subject: "Historia" };
  }

  // General fallbacks based on broad keywords
  if (q.includes("sumar") || q.includes("restar") || q.includes("numero") || q.includes("cuenta")) {
    return { key: "tablas_multiplicar", topicName: "Operaciones matemáticas", subject: "Matemáticas" };
  }
  if (q.includes("animal") || q.includes("planta") || q.includes("naturaleza") || q.includes("tierra")) {
    return { key: "dinosaurios", topicName: "Naturaleza y seres vivos", subject: "Ciencias Naturales" };
  }

  return { key: "general", topicName: "Curiosidad General", subject: "Aprendizaje Integral" };
}

/**
 * Generate child-friendly response for practice mode (Socratic guiding hints)
 */
function generatePracticeGuidance(
  message: string,
  context?: MiaPracticeContext
): MiaResponse {
  const topicName = context?.topicName || "Fracciones Equivalentes";
  const exercisePrompt = context?.exercisePrompt || "el ejercicio que tienes en pantalla";

  return {
    reply: `¡Estoy contigo en tu práctica! 🎯 Vamos a analizar ${exercisePrompt}.
Recuerda la pista de oro: una fracción representa partes iguales de un entero.
Antes de elegir, fíjate en esto:
1. ¿En cuántas partes totales está dividido el entero? (Ese es el denominador, el número de abajo).
2. ¿Cuántas partes coloreadas o tomadas hay? (Ese es el numerador, el número de arriba).
Si multiplicas o divides el numerador y el denominador por el mismo número, ¡el valor no cambia!
¡Intenta razonarlo un momento! Si tienes dudas de qué número multiplicar, ¡pregúntame y lo descubrimos juntos!`,
    topic: topicName,
    mode: "practice",
    challenge: "¿Qué número obtienes si multiplicas el numerador por 2?",
    funFact: "Recuerda: en MACHTIA puedes equivocarte sin miedo. ¡De cada intento aprendemos algo nuevo!",
    aiProvider: "pedagogical-engine",
  };
}

/**
 * Try external LLM inference if credentials exist
 */
async function tryExternalAI(prompt: string, mode: MiaMode, context?: MiaPracticeContext): Promise<{ content: string; provider: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${MIA_SYSTEM_PROMPT}\n\n[MODO: ${mode.toUpperCase()}]\nPregunta del alumno (3° primaria): ${prompt}` }],
            },
          ],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { content: text, provider: "Google Gemini 2.0 Flash" };
      }
    } catch {}
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: MIA_SYSTEM_PROMPT },
            { role: "user", content: `[MODO: ${mode.toUpperCase()}] ${prompt}` },
          ],
          max_tokens: 450,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return { content: text, provider: "OpenAI gpt-4o-mini" };
      }
    } catch {}
  }

  return null;
}

export class MiaAgentService {
  async respond(
    userMessage: string,
    mode: MiaMode = "free",
    context?: MiaPracticeContext
  ): Promise<MiaResponse> {
    const rawTrimmed = userMessage.trim();
    if (!rawTrimmed) {
      return {
        reply: "¡Hola! Estoy lista para responder cualquier duda o curiosidad que tengas. ¿Qué te gustaría aprender hoy? 🌟",
        topic: "Bienvenida",
        mode,
        aiProvider: "pedagogical-engine",
      };
    }

    // 1. Try external AI inference if available
    const external = await tryExternalAI(rawTrimmed, mode, context);
    if (external) {
      const topicInfo = detectEducationalTopic(rawTrimmed);
      return {
        reply: external.content,
        topic: topicInfo.topicName,
        mode,
        aiProvider: external.provider,
        providerNotice: `Conectado a ${external.provider} en tiempo real.`,
      };
    }

    // 2. MODO PRÁCTICA (Socratic & Guided Support)
    if (mode === "practice") {
      return generatePracticeGuidance(rawTrimmed, context);
    }

    // 3. MODO PREGUNTA LIBRE / MODO CURIOSIDAD via Educational Knowledge Engine
    const { key, topicName, subject } = detectEducationalTopic(rawTrimmed);
    const knowledge = KNOWLEDGE_BASE[key];

    const hasExternalKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || process.env.AWS_BEDROCK_API_KEY);
    const providerNotice = hasExternalKey
      ? undefined
      : "Motor pedagógico adaptativo activo (para conectar API externa en Render, agrega GEMINI_API_KEY o OPENAI_API_KEY).";

    if (knowledge) {
      if (mode === "curiosity") {
        return {
          reply: `🌟 **¡Qué gran curiosidad sobre ${knowledge.topic}!**\n\n${knowledge.curiosityStory}\n\n💡 **Dato Asombroso:** ${knowledge.funFact}`,
          topic: `${subject} · ${knowledge.topic}`,
          mode: "curiosity",
          funFact: knowledge.funFact,
          challenge: knowledge.challenge,
          aiProvider: "pedagogical-engine",
          providerNotice,
        };
      }

      // Default: Free mode
      return {
        reply: `💡 **${knowledge.topic}**\n\n${knowledge.freeAnswer}`,
        topic: `${subject} · ${knowledge.topic}`,
        mode: "free",
        funFact: knowledge.funFact,
        challenge: knowledge.challenge,
        aiProvider: "pedagogical-engine",
        providerNotice,
      };
    }

    // Generic adaptive answer for other topics
    const genericReply = mode === "curiosity"
      ? `¡Esa es una pregunta fascinante sobre el mundo! 🚀\n\nImagina que cada cosa que aprendemos es como armar un gran rompecabezas. Cuando exploramos sobre "${rawTrimmed}", los científicos e investigadores descubrieron que observar con atención, hacer preguntas y experimentar nos ayuda a entender los secretos de la naturaleza.\n\n¿Sabías que los niños que hacen más preguntas en primaria desarrollan una imaginación más rápida y poderosa? ¡Sigue preguntando!`
      : `¡Me encanta que preguntes sobre eso! 💡\n\nSobre "${rawTrimmed}": en la escuela y en la vida, todos los temas importantes se construyen pasito a pasito. Si es una duda de clase o de tarea, piensa primero en qué es lo que ya conoces, qué parte se te hace difícil y qué ejemplo de la vida diaria se le parece.\n\n¿Quieres que exploremos un ejemplo juntos o te gustaría hacer un mini-reto sobre esto?`;

    return {
      reply: genericReply,
      topic: topicName,
      mode,
      funFact: "En MACHTIA no hay preguntas tontas: ¡todas las preguntas nos hacen más inteligentes!",
      challenge: "¿Te gustaría que lo comparemos con un ejemplo de comida o de superhéroes?",
      aiProvider: "pedagogical-engine",
      providerNotice,
    };
  }
}

export const miaAgent = new MiaAgentService();

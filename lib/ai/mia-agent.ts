/**
 * MIA (Machtia Inteligencia Adaptativa) - Agente Educativo Universal y Compañera Escolar
 *
 * Tutora inteligente y empática adaptada a nivel primaria (3° de primaria, 8-9 años).
 * Características:
 * 1. Conversación bidireccional contextualizada con memoria de turnos durante la sesión.
 * 2. Reconocimiento de dudas pedagógicas, diagnóstico del alumno y andamiaje progresivo.
 * 3. Guía socrática en Modo Práctica (nunca regala respuestas de ejercicios evaluados).
 * 4. Amplia base de conocimientos curriculares (Matemáticas, Ciencias, Historia, Inglés, Tecnología).
 * 5. Soporte híbrido: Conexión con LLM externo (Gemini 2.0 Flash / OpenAI) + Motor pedagógico local de alta resiliencia.
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
  studentId?: string;
  grade?: number;
  options?: string[];
  attemptNumber?: number;
  lastSelectedOption?: string;
  lastEvaluation?: { isCorrect: boolean; feedback?: string; supportLevel?: string };
  diagnosticScore?: number;
  diagnosticGap?: string;
}

export interface MiaHistoryItem {
  sender: "user" | "mia";
  text: string;
  timestamp?: string;
  mode?: MiaMode;
  topic?: string;
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
  boundActorId?: string;
}

export const MIA_SYSTEM_PROMPT = `
Eres MIA (Machtia Inteligencia Adaptativa), una tutora escolar inteligente, cálida y divertida para niñas y niños de primaria en México (alrededor de 3° de primaria, 8 a 9 años).
Tu lema es: "Aquí puedes preguntar, equivocarte y volver a intentar. Puedo responder lo que no te atreviste a preguntar en clase."

Reglas pedagógicas obligatorias:
1. TONO: Cálido, motivador, entusiasta y muy paciente. Usa español de México natural y amigable (ej. "¡Ojo aquí!", "fíjate en esto", "¡vamos pasito a pasito!").
2. EMOJIS: Úsalos para enriquecer la lectura de manera amigable (🌟, 💡, 🧠, 🎯, 🚀, 🍫, 🍰).
3. ANDAMIAJE SOCRÁTICO (MODO PRÁCTICA): Si el alumno está en un ejercicio evaluado escolar, NUNCA le des la respuesta final o la letra de opción directamente. Dale pistas progresivas basadas en observación, analogías (como rebanadas de pizza o chocolates) y preguntas para que él mismo descubra la solución.
4. MANEJO DE ERRORES: Si el alumno se equivoca o dice que falló, normaliza el error ("¡Equivocarse es la forma número uno en que aprende el cerebro!") y explícale con cariño la confusión conceptual.
5. MEMORIA: Mantén el hilo de la conversación. Si el alumno pregunta "¿por qué?" o "no entendí", profundiza en el tema anterior con un ejemplo aún más simple y cotidiano.
6. PREGUNTA DE COMPRENSIÓN: Termina cada explicación con una pregunta breve y divertida para comprobar si quedó claro.
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
    challenge: "¿Te gustaría aprender cómo se dicen otros animales? Gato se dice *cat* 🐱, pájaro se dice *bird* 🐦, y caballo se dice *horse* 🐴. ¿Cuál otro te gustaría saber?",
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
  ciclo_agua: {
    topic: "El ciclo del agua",
    subject: "Ciencias Naturales",
    freeAnswer: "El agua que bebes hoy es la misma agua que bebían los dinosaurios hace millones de años 🦖💧. El agua viaja en un círculo sin fin: el calor del Sol la evapora desde ríos y mares y sube como vapor (evaporación); allá arriba se enfría y forma nubes (condensación); y cuando las nubes pesan mucho, cae como lluvia (precipitación).",
    curiosityStory: "Imagina que eres una gotita de agua en una montaña rusa 🎢. Primero descansas en un charquito, luego el Sol te da cosquillas y flotas hacia el cielo como un fantasmita. Te juntas con millones de amigas en una nube esponjosa y ¡splash!, te tiras de clavado en una gota de lluvia.",
    funFact: "¿Sabías que el 70% de la superficie de nuestro planeta Tierra está cubierta de agua? ¡Por eso desde el espacio nos vemos como una canica azul! 🌍",
    challenge: "¿En qué estado del agua te gusta más jugar: líquida para nadar 🏊 o congelada como nieve para hacer un muñeco ☃️?",
  },
  volcanes: {
    topic: "Volcanes y el interior de la Tierra",
    subject: "Geografía y Ciencias",
    freeAnswer: "Un volcán es como una chimenea o respiradero que conecta la superficie de la Tierra con lo más profundo y caliente de nuestro planeta 🌋. Muy abajo, las rocas están tan calientes que se derriten formando un líquido espeso llamado magma. Cuando se acumula mucha presión y gas, ¡el magma sube y sale a la superficie en forma de lava!",
    curiosityStory: "Imagina agitar una botella de refresco con gas 🥤. Si quitas la tapa de golpe, la espuma sale disparada por el cuello de la botella. ¡Eso mismo le pasa a la Tierra con los volcanes! La lava al enfriarse se vuelve roca dura y crea montañas e islas nuevas.",
    funFact: "¿Sabías que en México tenemos volcanes famosos como el Popocatépetl y el Iztaccíhuatl? ¡Y el Paricutín en Michoacán nació en el campo de maíz de un campesino en 1943! 🇲🇽",
    challenge: "¿Sabías que existen volcanes debajo del océano e incluso volcanes de hielo en otros planetas? ❄️🌋",
  },
};

/**
 * Normalizes input string for robust keyword matching
 */
function clean(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Detect topic and curricular domain from child's question
 */
export function detectEducationalTopic(text: string): { key: string; topicName: string; subject: string } {
  const q = clean(text);

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
  if (q.includes("fraccion") || q.includes("fracciones") || q.includes("numerador") || q.includes("denominador") || q.includes("medio") || q.includes("cuarto") || q.includes("equivalente")) {
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
  if (q.includes("ciclo del agua") || q.includes("lluvia") || q.includes("evapora") || q.includes("nubes")) {
    return { key: "ciclo_agua", topicName: "El ciclo del agua", subject: "Ciencias Naturales" };
  }
  if (q.includes("volcan") || q.includes("lava") || q.includes("magma") || q.includes("terremoto")) {
    return { key: "volcanes", topicName: "Volcanes y la Tierra", subject: "Geografía y Ciencias" };
  }

  // Broad fallbacks
  if (q.includes("sumar") || q.includes("restar") || q.includes("numero") || q.includes("cuenta") || q.includes("division") || q.includes("dividir")) {
    return { key: "tablas_multiplicar", topicName: "Operaciones matemáticas", subject: "Matemáticas" };
  }
  if (q.includes("animal") || q.includes("planta") || q.includes("naturaleza") || q.includes("tierra")) {
    return { key: "dinosaurios", topicName: "Naturaleza y seres vivos", subject: "Ciencias Naturales" };
  }

  return { key: "general", topicName: "Curiosidad General", subject: "Aprendizaje Integral" };
}

/**
 * Generates an intelligent, empathetic diagnostic response about Mariana López or student performance
 */
function handleDiagnosticQuery(
  rawText: string,
  context?: MiaPracticeContext
): MiaResponse {
  const studentName = context?.studentName || "Mariana López";
  const score = context?.diagnosticScore ?? 52;
  const topic = context?.topicName || "Fracciones Equivalentes";

  const reply = `📊 **¡Hola! Aquí está el diagnóstico pedagógico de ${studentName}:**

• **Asignatura y Tema:** Matemáticas · ${topic}
• **Dominio Inicial Diagnosticado:** ${score}% (nivel de apoyo requerido)
• **Patrón de Dificultad Detectado:** Presenta confusión al comparar fracciones cuando los denominadores son diferentes (como comparar 1/2 con 2/4 o 1/3 con 2/6).
• **Estrategia Adaptativa de MACHTIA:** Tu profesor te asignó una práctica interactiva con 5 ejercicios visuales y manipulables (barras coloreadas, barra de chocolate interactiva y multiplicación cruzada).

💡 **Mi consejo como tutora:** No te preocupes por el número 52%. Es solo el punto de partida. En cuanto terminemos la práctica y uses las pistas, ¡verás cómo tu dominio sube hacia el 100%!

¿Te gustaría que empecemos analizando juntos el primer ejercicio de las barras? 🎯`;

  return {
    reply,
    topic: "Diagnóstico Pedagógico · Mariana López",
    mode: "practice",
    challenge: "¿Sabías que 1/2 y 2/4 representan exactamente la misma cantidad aunque los números sean distintos?",
    funFact: "En MACHTIA las evaluaciones no son para regañar, sino para descubrir exactamente qué súper poder matemático desarrollaremos hoy.",
    aiProvider: "pedagogical-engine",
  };
}

/**
 * Deep Socratic practice guidance with progressive hints, misconception analysis and anti-giveaway rules
 */
function handlePracticeSocraticGuidance(
  message: string,
  context?: MiaPracticeContext,
  history?: MiaHistoryItem[]
): MiaResponse {
  const q = clean(message);
  const topicName = context?.topicName || "Fracciones Equivalentes";
  const studentName = context?.studentName || "Mariana";
  const exercisePrompt = context?.exercisePrompt || "el ejercicio en tu pantalla";

  // 1. Is the student asking directly for the answer / letter?
  const isAskingAnswerDirectly =
    q.includes("respuesta") ||
    q.includes("solucion") ||
    q.includes("cual es la a") ||
    q.includes("cual es la b") ||
    q.includes("dime cual") ||
    q.includes("cual elijo") ||
    q.includes("que pongo");

  if (isAskingAnswerDirectly) {
    return {
      reply: `¡Estoy contigo en tu práctica, ${studentName}! 🎯 Sé que quieres resolverlo súper rápido, pero si yo te doy la respuesta directa, tu cerebro se perdería la mejor parte: ¡descubrirla tú misma!

En vez de darte la letra, mira esta pista dorada:
• El **numerador** (arriba) te dice cuántas partes tomaste.
• El **denominador** (abajo) te dice en cuántas partes iguales se dividió el entero.

Imagina una pizza cortada en 2 rebanadas gigantes. Si te comes 1 rebanada (1/2), te comiste la mitad exacta 🍕.
Ahora imagina otra pizza del mismo tamaño cortada en 4 rebanadas más pequeñas. ¿Cuántas de esas 4 rebanadas tendrías que comer para tener la misma cantidad de pizza en tu pancita?

¡Fíjate en las opciones de tu pantalla y busca la que tenga ese numerador arriba y el 4 como denominador abajo! ¿Cuál crees que sea?`,
      topic: `${topicName} · Guía Socrática`,
      mode: "practice",
      challenge: "Piensa: ¿2 partes de 4 es lo mismo que 1 parte de 2?",
      funFact: "Cuando tu cerebro busca la respuesta por sí mismo, crea conexiones neuronales que nunca se olvidan.",
      aiProvider: "pedagogical-engine",
    };
  }

  // 2. Is the student reporting a mistake or asking why an answer was wrong?
  const isReportingError =
    q.includes("me equivoque") ||
    q.includes("salio mal") ||
    q.includes("porque esta mal") ||
    q.includes("falle") ||
    q.includes("no era") ||
    q.includes("incorrecto");

  if (isReportingError) {
    return {
      reply: `¡No te preocupes para nada, ${studentName}! 🌟 En MACHTIA equivocarse no es malo; es la pista número uno que nos dice dónde poner atención.

El error más común en las fracciones es pensar que porque un número es más grande, la fracción vale más. Por ejemplo: 4 es más grande que 2, pero una rebanada de 1/4 es más CHIQUITA que una de 1/2 (porque el pastel se cortó entre 4 personas en vez de 2).

Para encontrar una fracción equivalente, multiplica o divide arriba y abajo por el MISMO número:
• Si tienes 1/2 y multiplicas ambos por 2: 1×2 = 2, y 2×2 = 4. ¡Eso da 2/4!
• Si tienes 1/3 y multiplicas ambos por 2: 1×2 = 2, y 3×2 = 6. ¡Eso da 2/6!

¡Inténtalo otra vez! ¿Quieres que revisemos los números de tu ejercicio juntos?`,
      topic: `${topicName} · Corrección de Error`,
      mode: "practice",
      challenge: "Multiplica el numerador y denominador por 2. ¿Qué fracción obtienes?",
      funFact: "Los mejores matemáticos del mundo descubrieron sus grandes fórmulas después de equivocarse muchas veces.",
      aiProvider: "pedagogical-engine",
    };
  }

  // 3. Count hints already given in conversation history for progressive scaffolding
  const hintTurnsCount = (history || []).filter(
    (h) => h.sender === "user" && clean(h.text).match(/pista|ayuda|no entiendo|como hago|que hago/)
  ).length;

  // Progressive Hint Level 2 (Analogy & Multiplier)
  if (hintTurnsCount >= 1 || q.includes("otra pista") || q.includes("mas ayuda")) {
    return {
      reply: `¡Vamos con una pista nivel ninja! 🥷✨

Observa la barra de chocolate o el dibujo en tu pantalla 🍫:
1. El número de abajo (denominador) te dice en cuántos trozos cortamos la barra.
2. Si tienes 1/3 de una barra de 6 trozos, piensa: ¿cuántos trozos de los 6 equivalen a un tercio? 6 ÷ 3 = 2 trozos.
3. Eso significa que 1/3 es exactamente igual a 2/6.

Aplica la regla de oro: si multiplicas el número de arriba por un número, debes multiplicar el de abajo por el mismo.
¿Qué número multiplica arriba y abajo en tu ejercicio?`,
      topic: `${topicName} · Pista Progresiva (Nivel 2)`,
      mode: "practice",
      challenge: "¿1 trozo de 3 sabe igual que 2 trozos de 6 en una barra de chocolate?",
      funFact: "A esto le llamamos fracciones equivalentes porque representan exactamente la misma porción del entero.",
      aiProvider: "pedagogical-engine",
    };
  }

  // Concept questions: Numerador / Denominador / Equivalencia
  if (q.includes("numerador") && !q.includes("denominador")) {
    return {
      reply: `¡Buena pregunta! El **numerador** es el número que va ARRIBA de la rayita en una fracción (como el 1 en 1/2) 👆.
Te indica cuántas partes tomaste, cuántas rebanadas te comiste o cuántos cuadritos están coloreados.
¿Cuántas partes coloreadas tiene tu figura ahorita? Ese es tu numerador.`,
      topic: "Matemáticas · El Numerador",
      mode: "practice",
      challenge: "En la fracción 3/4, ¿cuál es el numerador?",
      aiProvider: "pedagogical-engine",
    };
  }

  if (q.includes("denominador")) {
    return {
      reply: `¡El **denominador** es el jefe de la fracción! Es el número que va ABAJO de la rayita (como el 4 en 2/4) 👇.
Te dice en cuántas partes IGUALES cortaste todo el pastel completo.
Entre más grande sea el denominador, ¡más delgaditas y pequeñitas son las rebanadas!`,
      topic: "Matemáticas · El Denominador",
      mode: "practice",
      challenge: "Si cortas una pizza en 8 rebanadas, ¿cuál es el denominador?",
      aiProvider: "pedagogical-engine",
    };
  }

  if (q.includes("cruzad") || q.includes("producto cruzado") || q.includes("multiplicacion cruzada")) {
    return {
      reply: `¡Los **productos cruzados** son como una X mágica! ✖️✨
Si quieres saber si 3/4 es igual a 6/8:
1. Multiplica en diagonal: 3 × 8 = 24.
2. Multiplica la otra diagonal: 4 × 6 = 24.
¡Como ambos resultados dieron 24, demostraste matemáticamente que son fracciones equivalentes!
¿Quieres probar esa multiplicación en tu ejercicio?`,
      topic: "Matemáticas · Productos Cruzados",
      mode: "practice",
      challenge: "Multiplica en X: si los dos números dan lo mismo, ¡las fracciones son gemelas!",
      aiProvider: "pedagogical-engine",
    };
  }

  // Default Level 1 Socratic Hint
  return {
    reply: `¡Estoy contigo en tu práctica, ${studentName}! 🎯 Vamos a analizar ${exercisePrompt}.

Aquí está tu primera pista de observación 🔍:
1. Cuenta en cuántas partes totales está dividido el entero (ese es tu denominador, el número de abajo).
2. Luego fíjate cuántas partes están tomadas o coloreadas (ese es tu numerador, el número de arriba).
3. Si multiplicas el número de arriba y el de abajo por 2, ¿qué nueva fracción obtienes?

¡Observa con calma las opciones y dime qué número obtuviste!`,
    topic: topicName,
    mode: "practice",
    challenge: "¿Qué número obtienes si multiplicas 1×2 y 2×2?",
    funFact: "Recuerda: en MACHTIA puedes equivocarte sin miedo. ¡De cada intento aprendemos algo nuevo!",
    aiProvider: "pedagogical-engine",
  };
}

/**
 * Handle follow-up questions using session history
 */
function handleFollowUpQuestion(
  message: string,
  history: MiaHistoryItem[],
  mode: MiaMode,
  context?: MiaPracticeContext
): MiaResponse | null {
  if (!history || history.length === 0) return null;
  const q = clean(message);

  const isFollowUpPattern =
    q.length < 25 &&
    (q.includes("por que") ||
      q.includes("como") ||
      q.includes("y luego") ||
      q.includes("que mas") ||
      q.includes("no entendi") ||
      q.includes("explicame mas") ||
      q.includes("otro ejemplo") ||
      q.includes("dame otra"));

  if (!isFollowUpPattern) return null;

  // Retrieve last assistant answer topic and text
  const lastMiaMsg = [...history].reverse().find((h) => h.sender === "mia");
  if (!lastMiaMsg) return null;

  const lastText = lastMiaMsg.text.toLowerCase();

  // If user says "no entendí"
  if (q.includes("no entendi")) {
    return {
      reply: `¡No te preocupes para nada! Si esa explicación no quedó clara, vamos a verla de otra forma mucho más fácil 💡:

Imagina que tienes 2 monedas de \$5 pesos 🪙🪙. Juntas valen \$10 pesos.
Ahora imagina que tu hermano tiene 1 billete de \$10 pesos 💵.
Aunque tienen objetos diferentes en la mano (2 monedas vs 1 billete), ¡los dos tienen exactamente la misma cantidad de dinero!

Así funcionan las fracciones equivalentes: se ven diferentes (como 1/2 y 2/4), ¡pero valen exactamente lo mismo! ¿Tiene más sentido ahora?`,
      topic: lastMiaMsg.topic || "Explicación Alternativa Adaptativa",
      mode,
      challenge: "¿Prefieres tener 2 monedas de \$5 o 1 billete de \$10?",
      funFact: "Explicar lo mismo de tres formas diferentes es el secreto de los mejores maestros del mundo.",
      aiProvider: "pedagogical-engine",
    };
  }

  // If previous topic was dinosaurios
  if (lastText.includes("dinosaurio") || lastText.includes("t-rex")) {
    return {
      reply: `¡Los dinosaurios tenían dietas muy diferentes! 🌿🥩 Los gigantes de cuello largo (como el Braquiosaurio o Diplodocus) comían toneladas de hojas y ramas de la punta de los árboles más altos. En cambio, carnívoros como el T-Rex tenían dientes del tamaño de plátanos para cazar. Y algunos más pequeños comían insectos, huevos y peces.

¿Te imaginas cuántas ensaladas tendría que comer un dinosaurio gigante al día? 🥗`,
      topic: "Paleontología · Alimentación de Dinosaurios",
      mode: "curiosity",
      challenge: "¿Sabías que algunos dinosaurios comían piedras a propósito para ayudar a moler las plantas en su estómago?",
      funFact: "A esas piedras que tragaban se les llama 'gastrolitos'.",
      aiProvider: "pedagogical-engine",
    };
  }

  // If previous topic was planetas / espacio
  if (lastText.includes("planeta") || lastText.includes("sol") || lastText.includes("tierra")) {
    return {
      reply: `¡En el espacio todo es gigantesco y sorprendente! 🚀 Por ejemplo, en Mercurio un día dura casi dos meses de la Tierra porque gira muy despacito. Y en Venus llueve ácido y hace tanto calor que derretiría el plomo. La Tierra es el único planeta que conocemos con agua líquida, aire perfecto y pizza calientita 🍕🌍.

¿Qué planeta te parece el más misterioso de todos?`,
      topic: "Astronomía · Curiosidades Planetarias",
      mode: "curiosity",
      challenge: "¿Sabías que Júpiter tiene una tormenta gigante tan grande que cabría toda la Tierra adentro?",
      aiProvider: "pedagogical-engine",
    };
  }

  // Default helpful follow-up
  return {
    reply: `¡Me encanta que sigas con curiosidad! 💡 Sobre lo que platicábamos: recuerda que cada concepto nuevo se parece a algo que ya conoces en la vida diaria.

Dime qué partecita específica se te hace difícil o qué te gustaría que imaginemos juntos, y lo resolvemos pasito a pasito.`,
    topic: lastMiaMsg.topic || "Profundización Curricular",
    mode,
    challenge: "¿Quieres que inventemos un cuento con personajes sobre esto?",
    aiProvider: "pedagogical-engine",
  };
}

/**
 * Try external LLM inference (Gemini 2.0 Flash or OpenAI) with full conversation history and system instructions
 */
async function tryExternalAI(
  prompt: string,
  mode: MiaMode,
  context?: MiaPracticeContext,
  history?: MiaHistoryItem[]
): Promise<{ content: string; provider: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // Include conversation memory (last 6 turns)
      if (history && history.length > 0) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.sender === "user" ? "user" : "model",
            parts: [{ text: item.text }],
          });
        }
      }

      const contextDescription = context?.exercisePrompt
        ? `[Contexto escolar activo: El alumno está en el ejercicio "${context.exercisePrompt}", tema "${context.topicName || "Fracciones"}". Recuerda ser socrático y no dar la respuesta].`
        : "";

      contents.push({
        role: "user",
        parts: [{ text: `${contextDescription}\n[MODO: ${mode.toUpperCase()}]\nPregunta del alumno (3° de primaria): ${prompt}` }],
      });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: MIA_SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return { content: text.trim(), provider: "Google Gemini 2.0 Flash" };
      }
    } catch {
      // Fallback seamlessly to local pedagogical engine
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: MIA_SYSTEM_PROMPT },
      ];

      if (history && history.length > 0) {
        for (const item of history.slice(-6)) {
          messages.push({
            role: item.sender === "user" ? "user" : "assistant",
            content: item.text,
          });
        }
      }

      messages.push({
        role: "user",
        content: `[MODO: ${mode.toUpperCase()}] ${prompt}`,
      });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 450,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text && text.trim()) return { content: text.trim(), provider: "OpenAI gpt-4o-mini" };
      }
    } catch {
      // Fallback seamlessly to local pedagogical engine
    }
  }

  return null;
}

export class MiaAgentService {
  async respond(
    userMessage: string,
    mode: MiaMode = "free",
    context?: MiaPracticeContext,
    history?: MiaHistoryItem[]
  ): Promise<MiaResponse> {
    const rawTrimmed = (userMessage || "").trim();
    if (!rawTrimmed) {
      return {
        reply: "¡Hola! Soy MIA 👋 Tu compañera de aprendizaje. ¿Qué te gustaría descubrir o resolver hoy? ¡Pregúntame con confianza!",
        topic: "Bienvenida",
        mode,
        aiProvider: "pedagogical-engine",
      };
    }

    // 1. Try external AI inference if available
    const external = await tryExternalAI(rawTrimmed, mode, context, history);
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

    // 2. Check if student is asking about their diagnosis or performance
    const qClean = clean(rawTrimmed);
    const isDiagnosticQuery =
      qClean.includes("diagnostico") ||
      qClean.includes("brecha") ||
      qClean.includes("calificacion") ||
      qClean.includes("por que estoy practicando") ||
      qClean.includes("como voy") ||
      (qClean.includes("mariana") && (qClean.includes("rezago") || qClean.includes("apoyo") || qClean.includes("nivel")));

    if (isDiagnosticQuery) {
      return handleDiagnosticQuery(rawTrimmed, context);
    }

    // 3. Multi-turn follow-up question recognition (memory)
    if (history && history.length > 0) {
      const followUp = handleFollowUpQuestion(rawTrimmed, history, mode, context);
      if (followUp) return followUp;
    }

    // 4. MODO PRÁCTICA (Socratic, Progressive Scaffolding & Error Analysis)
    if (mode === "practice") {
      return handlePracticeSocraticGuidance(rawTrimmed, context, history);
    }

    // 5. MODO PREGUNTA LIBRE / MODO CURIOSIDAD via Curricular Knowledge Engine
    const { key, topicName, subject } = detectEducationalTopic(rawTrimmed);
    const knowledge = KNOWLEDGE_BASE[key];

    const hasExternalKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY);
    const providerNotice = hasExternalKey
      ? undefined
      : "Motor pedagógico adaptativo MACHTIA activo.";

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

    // Contextual adaptive response for other curiosities
    const genericReply = mode === "curiosity"
      ? `¡Esa es una pregunta fascinante sobre el mundo, explorador! 🚀\n\nImagina que cada cosa que aprendemos en la escuela es como una pieza de un gran rompecabezas. Cuando investigamos sobre "${rawTrimmed}", los científicos descubrieron que observar con atención, hacer preguntas y experimentar nos ayuda a entender los secretos de la naturaleza.\n\n¿Sabías que los niños que hacen más preguntas en primaria desarrollan una imaginación más rápida y poderosa? ¡Sigue preguntando!`
      : `¡Me encanta que me preguntes sobre eso! 💡\n\nSobre "${rawTrimmed}": en la escuela y en la vida, todos los temas importantes se construyen pasito a pasito. Si es una duda de clase o de tarea, piensa primero en qué es lo que ya conoces, qué parte se te hace difícil y qué ejemplo de la vida diaria se le parece.\n\n¿Quieres que exploremos un ejemplo juntos o te gustaría que lo comparemos con un juego?`;

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

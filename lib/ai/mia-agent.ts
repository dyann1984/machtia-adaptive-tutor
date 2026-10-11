/**
 * MIA (Machtia Inteligencia Adaptativa) - Agente Educativo Universal y Compañera Escolar (v2.0)
 *
 * Tutora inteligente, empática y rigurosamente pedagógica adaptada a nivel primaria (3° de primaria, 8-9 años).
 * Características:
 * 1. Enrutador de intención pedagógica que separa Modo Práctica, Pregunta Libre, Historia y Curiosidad.
 * 2. Respuestas históricas precisas y contextualizadas (ej. ¿Quién descubrió América? -> Colón 1492 + Pueblos originarios).
 * 3. Explicaciones matemáticas visuales paso a paso (ej. 1/2 vs 1/4 con analogías de pizzas, barras y monedas).
 * 4. Reformulación adaptativa cuando el alumno dice "no entendí": cambia completamente la analogía basándose en el turno previo.
 * 5. Guía socrática en Modo Práctica (NUNCA regala la respuesta final en ejercicios evaluados).
 * 6. Soporte híbrido: Conexión con LLM externo (Gemini 2.0 Flash / OpenAI) si está configurado + Motor pedagógico curricular especializado.
 */

import { classifyStudentIntent, cleanPrompt } from "./intent-router";

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
  intent?: string;
  funFact?: string;
  challenge?: string;
  audioPrompt?: string;
  aiProvider: string;
  providerNotice?: string;
  ttsSignature?: string;
  signature?: string;
  boundActorId?: string;
}

export const MIA_SYSTEM_PROMPT = `
Eres MIA (Machtia Inteligencia Adaptativa), una tutora escolar inteligente, cálida, viva y divertida para niñas y niños de primaria en México (alrededor de 3° de primaria, 8 a 9 años).
Tu lema es: "Aquí puedes preguntar, equivocarte y volver a intentar. Puedo responder lo que no te atreviste a preguntar en clase."

Reglas pedagógicas obligatorias:
1. TONO: Cálido, motivador, entusiasta y muy paciente. Usa español de México natural y amigable (ej. "¡Ojo aquí!", "fíjate en esto", "¡vamos pasito a pasito!").
2. EMOJIS: Úsalos para enriquecer la lectura de manera amigable (🌟, 💡, 🧠, 🎯, 🚀, 🍫, 🍕, ⛵).
3. DISTINCIÓN DE INTENCIÓN:
   - Si el alumno hace una PREGUNTA DE HISTORIA O CULTURA GENERAL (ej. "¿Quién descubrió América?", dinosaurios, el universo): Responde a su pregunta con datos históricos y científicos precisos adecuados para su edad. NUNCA respondas con pistas de fracciones a preguntas que no sean de fracciones.
   - En historia de América: Menciona la llegada de Cristóbal Colón en 1492 y reconoce con respeto a los pueblos originarios e indígenas que ya habitaban y conocían estas tierras desde hacía miles de años.
   - En matemáticas (ej. "¿Qué es un medio y un cuarto?"): Explica de forma visual con ejemplos cotidianos (pizzas, chocolates, vasos con agua) cómo 1/2 es el doble de 1/4.
   - Si dice "NO ENTENDÍ": Cambia la analogía por una totalmente diferente y más simple (monedas de dinero, caramelos, juguetes).
   - En MODO PRÁCTICA (durante un ejercicio evaluado): Sé socrática. NUNCA des la letra o respuesta directa; ofrece pistas progresivas por observación, analogías y comprobación.
4. MANEJO DE ERRORES: Si el alumno se equivoca, normaliza el error con alegría ("¡Equivocarse es la forma número uno en que aprende el cerebro!") y aclara la confusión.
5. PREGUNTA DE COMPRENSIÓN: Termina cada explicación con una pregunta breve y divertida para comprobar si quedó claro.
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
  // 1. Historia: Cristóbal Colón, 1492 y Pueblos Originarios
  historia_america: {
    topic: "La llegada a América y los Pueblos Originarios",
    subject: "Historia",
    freeAnswer: `Cristóbal Colón llegó a tierras americanas el **12 de octubre de 1492** con tres carabelas (la Niña, la Pinta y la Santa María) ⛵🗺️. Buscaba una ruta a Asia navegando al oeste.

¡Pero ojo! América **ya estaba descubierta y habitada** desde hacía miles de años por los **pueblos originarios e indígenas** (como los Taínos, Mayas, Mexicas e Incas), con sus propias ciudades, lenguas y culturas.

Por eso hoy los historiadores le llaman el **"Encuentro de dos mundos"** 🤝🌎.`,
    curiosityStory: `Imagina ser un marinero en 1492 que lleva más de dos meses navegando en medio del océano inmenso sin ver tierra firme, hasta que en la madrugada del 12 de octubre un marinero llamado Rodrigo de Triana gritó: "¡Tierra a la vista!" 🏝️ Llegaron a una hermosa isla del Caribe llamada Guanahani. Allí los habitantes originarios los recibieron con curiosidad, frutas y hospitalidad.`,
    funFact: `¿Sabías que nuestro continente no se llama "Colombia" por Colón, sino **América** en honor a Américo Vespucio? 🗺️ Él fue el navegante que se dio cuenta de que estas tierras no eran Asia, sino un continente completamente nuevo y gigantesco.`,
    challenge: `¿Te imaginas cruzar un océano enorme en barcos de madera impulsados únicamente por el viento? ¿Qué crees que sintieron los navegantes y los pobladores originarios al verse por primera vez?`,
  },

  // 2. Matemáticas: Un medio y un cuarto
  medio_cuarto: {
    topic: "Un Medio (1/2) y Un Cuarto (1/4)",
    subject: "Matemáticas",
    freeAnswer: `¡Te lo explico súper fácil con una pizza! 🍕

Imagina una pizza deliciosa:
• **Un medio (1/2):** Cortas la pizza en 2 partes iguales y tomas 1 rebanada (¡la mitad completa!).
• **Un cuarto (1/4):** Cortas esa pizza en 4 partes iguales y tomas 1 rebanada.

Como la segunda se dividió entre más personas (4 en vez de 2), cada rebanada de **1/4 es la mitad de pequeña** que una de **1/2**.

Fíjate en esto:
🍕 **1/2** = Media pizza grande.
🍕🍕 **2/4** = Dos cuartos juntos... ¡que hacen exactamente 1/2!

Por eso **1/2 es el DOBLE de grande que 1/4** 💡.`,
    curiosityStory: `Imagina que tienes una barra de chocolate con 4 cuadritos 🍫. Si te comes 1 cuadrito, te comiste 1/4 de la barra. Si tu amiga te pide la mitad de la barra (1/2), tendrías que darle 2 cuadritos (2/4). ¡2 cuartos y 1 medio son exactamente la misma porción de chocolate!`,
    funFact: `¿Sabías que entre más grande sea el número de abajo (el denominador), más pequeñas son las partes? ¡1/100 es una migaja diminuta, mientras que 1/2 es la mitad de todo el entero!`,
    challenge: `Si tienes mucha hambre después de jugar futbol en el recreo ⚽, ¿preferirías que te inviten 1/2 de sandwich o 1/4 de sandwich? ¿Por qué?`,
  },

  // 3. Historia de México y Civilizaciones Prehispánicas
  historia_mexico: {
    topic: "Historia de México y culturas originarias",
    subject: "Historia",
    freeAnswer: `La historia es como una máquina del tiempo ⏳. En México, hace cientos de años, civilizaciones increíbles como los mayas y los mexicas (aztecas) construyeron pirámides gigantescas, observaron las estrellas y crearon calendarios precisos sin tener computadoras ni telescopios modernos. ¡Eran verdaderos astrónomos y arquitectos!`,
    curiosityStory: `Imagina la gran ciudad de Tenochtitlan: ¡una ciudad flotante construida sobre un lago gigante! 🛶 Los mexicas se transportaban en canoas y tenían chinampas, que eran islas de tierra fértil donde sembraban maíz, frijol y flores. Cuando los exploradores llegaron, dijeron que parecía un sueño o una pintura mágica.`,
    funFact: `¿Sabías que el chocolate fue un regalo de México para el mundo? 🍫 Los antiguos mayas y aztecas mezclaban semillas de cacao con agua y vainilla para crear una bebida sagrada que tomaban los emperadores.`,
    challenge: `¿Te gustaría haber sido un constructor de pirámides 🏛️ o un astrónomo maya que miraba las estrellas desde la selva?`,
  },

  // 4. Ciencias: Agujeros Negros y el Espacio
  agujero_negro: {
    topic: "Agujeros negros y gravedad",
    subject: "Astronomía y Espacio",
    freeAnswer: `Un agujero negro es como una súper aspiradora del universo con tanta gravedad que nada, ni siquiera la luz (¡que es lo más rápido que existe!), puede escapar de él 🚀🕳️. Ocurren cuando una estrella gigante, mucho más grande que nuestro Sol, se queda sin combustible al final de su vida y se encoge apretándose en un punto diminuto con una fuerza descomunal.`,
    curiosityStory: `Imagina que pones una bola de boliche pesadísima sobre un trampolín elástico 🎳. La tela se hunde tanto hacia el centro que cualquier canica que ruede cerca caerá directo hacia la bola. ¡Eso es lo que hace un agujero negro con el espacio! Y aunque se llaman "agujeros negros", en realidad no están vacíos: ¡están súper llenos de materia apretadita!`,
    funFact: `¿Sabías que en el centro de nuestra galaxia, la Vía Láctea, hay un agujero negro súper gigante llamado Sagitario A*? 🌌 Pero no te preocupes, ¡está tan lejos que la Tierra está 100% segura!`,
    challenge: `¿Sabías que si cayeras hacia un agujero negro te estirarías como un fideo de espagueti? Los científicos de verdad llaman a eso "espaguetificación" 🍝. ¿Te imaginas cómo se vería?`,
  },

  // 5. Ciencias: Dinosaurios y fósiles
  dinosaurios: {
    topic: "Paleontología y dinosaurios",
    subject: "Ciencias de la Tierra",
    freeAnswer: `Los dinosaurios fueron reptiles asombrosos que vivieron en nuestro planeta hace más de 65 millones de años 🦖🌿. Había desde gigantes de cuello largo como el Braquiosaurio (tan altos como un edificio de 4 pisos), hasta veloces carnívoros como el T-Rex o pequeños cazadores con plumas del tamaño de una gallina.`,
    curiosityStory: `Imagina un mundo sin humanos, sin coches y sin ciudades, donde las plantas gigantes crecían en todas partes y el suelo temblaba con los pasos de bestias con garras y escudos en la cabeza 🦕. Los científicos saben cómo eran gracias a los fósiles: huesos convertidos en piedra enterrados por millones de años.`,
    funFact: `¿Sabías que los dinosaurios nunca se extinguieron por completo? 🦅 ¡Las aves modernas (como las palomas, las águilas y los colibríes) son parientes directos y descendientes de los dinosaurios con plumas!`,
    challenge: `¿Cuál es tu dinosaurio favorito: el temible Tiranosaurio Rex con sus dientes gigantes, o el Triceratops con sus 3 cuernos de escudo?`,
  },

  // 6. Ciencias: Por qué el cielo es azul
  cielo_azul: {
    topic: "La luz y la atmósfera",
    subject: "Ciencias Naturales",
    freeAnswer: `El cielo se ve azul gracias a un truco de la luz del Sol y el aire de la Tierra ☀️. La luz del Sol parece blanca, pero en realidad contiene todos los colores del arcoíris mezclados. Cuando esa luz entra a nuestra atmósfera, choca con pequeños gases en el aire. La luz azul viaja en ondas pequeñitas y rápidas, así que rebota y se dispersa por todo el cielo como si fuera brillantina azul. ¡Por eso volteamos hacia arriba y lo vemos todo azul!`,
    curiosityStory: `Imagina que la luz del Sol es un equipo de amigos vestidos de todos los colores corriendo hacia la Tierra 🏃‍♂️🌈. Los colores rojo y amarillo son como gigantes con pasos largos: casi no chocan con nada y pasan directo. Pero el azul es como un niño chiquito y súper inquieto que rebota de pared en pared. Al rebotar en las moléculas de aire miles de millones de veces, pinta todo el cielo de azul.`,
    funFact: `¿Sabías que en la Luna el cielo se ve completamente NEGRO incluso de día? 🌑 Eso pasa porque en la Luna no hay aire ni atmósfera para rebotar la luz.`,
    challenge: `¿Quieres adivinar por qué en el atardecer el cielo se vuelve anaranjado y rojizo? ¿Es porque la luz tiene que viajar más distancia a través del aire?`,
  },

  // 7. Matemáticas: Tablas de Multiplicar
  tablas_multiplicar: {
    topic: "Multiplicaciones y tablas",
    subject: "Matemáticas",
    freeAnswer: `¡Multiplicar es como un superpoder para sumar súper rápido! ✖️⚡ Por ejemplo, en lugar de sumar 3 + 3 + 3 + 3 + 3 (que da 15), simplemente dices 3 × 5 = 15. Un truco genial: la tabla del 9 la puedes hacer con tus 10 dedos, y la tabla del 2 es simplemente sumar el doble (4 × 2 = 4 + 4 = 8).`,
    curiosityStory: `Imagina que estás preparando bolsitas de dulces para una fiesta 🍬🎉. Si tienes 4 bolsitas y a cada una le metes 3 chocolates, ¿cuántos chocolates usaste? En vez de contar uno por uno, tu mente hace 4 veces 3: ¡12 chocolates en un segundo!`,
    funFact: `¿Sabías que el orden no cambia el resultado? 3 × 4 es exactamente lo mismo que 4 × 3 (ambos dan 12). A eso los matemáticos le dicen "propiedad conmutativa", pero tú puedes recordarlo como "el orden de los dulces no cambia la fiesta" 🍭.`,
    challenge: `¡Hagamos un reto rápido! Si un pulpo tiene 8 tentáculos 🐙... ¿cuántos tentáculos tienen 3 pulpos juntos? (Pista: 8 × 3 = ...)`,
  },

  // 8. Tecnología y Programación
  programacion: {
    topic: "Pensamiento computacional y código",
    subject: "Tecnología",
    freeAnswer: `Programar es como escribirle una receta de cocina mágica a una computadora o robot 💻🤖. Como las computadoras no piensan solas, tú les das instrucciones paso a paso: "camina 3 pasos hacia adelante", "si ves una pared, gira a la derecha", "salta". A cada paso de esa receta le llamamos **algoritmo**.`,
    curiosityStory: `Imagina que estás construyendo con piezas de Lego o bloques de Minecraft 🧱. Para hacer un castillo necesitas poner un bloque, luego otro, y si quieres una torre alta repites el mismo paso 10 veces. En programación, cuando repites algo se llama **bucle o loop** 🔄. ¡Los creadores de tus videojuegos favoritos usan loops todo el tiempo!`,
    funFact: `¿Sabías que la primera persona que escribió un programa de computadora en toda la historia fue una mujer brillante llamada Ada Lovelace hace casi 200 años? 👩‍💻✨`,
    challenge: `Si tú fueras un robot programable y yo te diera esta instrucción: "Da 2 saltos, aplaude 1 vez y sonríe". ¿Podrías ejecutar ese algoritmo ahora mismo? 😄`,
  },

  // 9. Idiomas: Inglés
  ingles_perro: {
    topic: "Vocabulario de inglés básico",
    subject: "Inglés",
    freeAnswer: `"Perro" en inglés se dice **dog** (se pronuncia "dog") 🐶. Si tienes un cachorrito bebé, le dices **puppy** ("papi"). Y si quieres decir "mi perro es juguetón", dices: *"My dog is playful"*.`,
    curiosityStory: `Imagina que viajas a otro país y ves a un perrito corriendo en el parque 🌳. Para saludarlo y a su dueño, le dices con una sonrisa: *"Hello! What a cute dog!"* (¡Hola! ¡Qué perro tan lindo!). A los perritos les encanta que les digan *"Good dog!"* (¡Buen chico!).`,
    funFact: `¿Sabías que en inglés los perros no hacen "guau guau"? Los niños que hablan inglés dicen que los perros hacen *"woof woof"* o *"bark bark"* 🐕.`,
    challenge: `¿Te gustaría aprender cómo se dicen otros animales? Gato se dice *cat* 🐱, pájaro se dice *bird* 🐦, y conejo se dice *rabbit* 🐰. ¿Cuál otro te gustaría saber?`,
  },

  // 10. Fracciones general
  fracciones: {
    topic: "Concepto de fracciones",
    subject: "Matemáticas",
    freeAnswer: `Una fracción es simplemente una parte de algo completo que se dividió en partes exactamente iguales 🍰. El número de abajo (denominador) te dice en cuántas rebanadas cortaste el pastel, y el número de arriba (numerador) te dice cuántas rebanadas tomaste. Por ejemplo, 1/2 significa que cortaste una pizza en 2 partes iguales y tomaste 1.`,
    curiosityStory: `Imagina que tienes una barra de chocolate con 4 cuadritos 🍫. Si la compartes con tu mejor amigo y le das 2 cuadritos (2/4), ¡en realidad le diste exactamente la mitad de la barra (1/2)! Por eso 1/2 y 2/4 son fracciones equivalentes: se escriben diferente pero valen exactamente lo mismo.`,
    funFact: `¿Sabías que los antiguos egipcios hace 4,000 años ya usaban fracciones para repartir panes y medir las tierras cuando el río Nilo se inundaba? 🏺`,
    challenge: `Si partes una manzana en 4 pedacitos iguales y te comes 2 pedacitos... ¿te comiste más, menos o exactamente la mitad de la manzana?`,
  },

  // 11. Planetas
  planetas: {
    topic: "El Sistema Solar",
    subject: "Ciencias y Espacio",
    freeAnswer: `En nuestro Sistema Solar hay 8 planetas girando alrededor del Sol 🪐☀️: Mercurio, Venus, la Tierra (nuestro hogar azul 🌍), Marte (el planeta rojo), Júpiter (el gigante con tormentas), Saturno (con hermosos anillos de hielo), Urano y Neptuno.`,
    curiosityStory: `Imagina que el Sol es una sandía gigante 🍉. Si el Sol fuera una sandía, la Tierra sería apenas una semillita pequeñita, y Júpiter sería como una manzana grande. ¡El espacio es tan inmenso que cabrían más de un millón de Tierras adentro del Sol!`,
    funFact: `¿Sabías que los anillos de Saturno no son sólidos? 🪐 Están hechos de pedacitos de hielo, roca y polvo que van desde el tamaño de granitos de arena hasta el tamaño de casas.`,
    challenge: `Si pudieras subirte a un cohete espacial mañana mismo 🚀, ¿a qué planeta te gustaría viajar primero?`,
  },

  // 12. Tarea y dudas
  tarea_dudas: {
    topic: "Estrategias de aprendizaje y dudas escolares",
    subject: "Técnicas de Estudio",
    freeAnswer: `¡No te preocupes para nada! Es 100% normal tener dudas con una tarea 👍. Equivocarse y preguntar es la señal número uno de que tu cerebro está listo para aprender algo nuevo. Dime: ¿de qué materia es tu tarea? Cuéntame qué dice el ejercicio y lo resolvemos juntos paso a pasito.`,
    curiosityStory: `Imagina que tu cerebro es como un músculo que va al gimnasio 🏋️‍♂️🧠. Cuando un ejercicio te cuesta trabajo, es como levantar una pesita que hace que tus neuronas creen nuevos caminos. Si todo fuera fácil, ¡el cerebro no crecería!`,
    funFact: `¿Sabías que Thomas Edison intentó hacer la bombilla de luz más de 1,000 veces antes de que funcionara? 💡 Él decía que descubrió 1,000 formas de cómo no hacerla.`,
    challenge: `Escribe aquí la pregunta exacta de tu tarea o de qué trata. ¡La desmenuzaremos juntos como detectives escolares! 🕵️‍♀️`,
  },

  // 13. Ortografía
  ortografia: {
    topic: "Reglas de acentuación y ortografía",
    subject: "Español",
    freeAnswer: `La ortografía es como las señales de tránsito de las palabras 🚦. Ayuda a que las personas entiendan exactamente lo que queremos decir. Por ejemplo, no es lo mismo decir "el papá de Luis" (con tilde en la a, el señor 👨) que "la papa de Luis" (sin tilde, ¡la verdura que comemos con cátsup! 🥔). La tilde le da fuerza a la voz.`,
    curiosityStory: `Imagina que las letras son amigos jugando futbol ⚽. La tilde (el acento escrito) es como el silbato del árbitro que dice: "¡Aquí va el tiro más fuerte!". Las palabras agudas llevan fuerza al final (canción 🎵), las graves en medio (árbol 🌳) y las esdrújulas al principio (música 🎶).`,
    funFact: `¿Sabías que la letra "H" es la única letra muda en español? No suena, pero es súper elegante y viene del latín antiguo 🎩.`,
    challenge: `A ver si puedes descifrar esto: ¿Cuál palabra lleva tilde: "camion" o "mesa"?`,
  },
};

/**
 * Detect topic and curricular domain from child's question (compatible with test suite)
 */
export function detectEducationalTopic(text: string): { key: string; topicName: string; subject: string } {
  const q = cleanPrompt(text);

  if (q.includes("cielo") && (q.includes("azul") || q.includes("color"))) {
    return { key: "cielo_azul", topicName: "La luz y la atmósfera", subject: "Ciencias Naturales" };
  }
  if (q.includes("agujero negro") || q.includes("hoyo negro") || q.includes("black hole")) {
    return { key: "agujero_negro", topicName: "Agujeros negros y gravedad", subject: "Astronomía y Espacio" };
  }
  if (q.includes("dinosaurio") || q.includes("t rex") || q.includes("fosil")) {
    return { key: "dinosaurios", topicName: "Paleontología y dinosaurios", subject: "Ciencias de la Tierra" };
  }
  if (q.includes("tabla") || q.includes("multiplic")) {
    return { key: "tablas_multiplicar", topicName: "Multiplicaciones y tablas", subject: "Matemáticas" };
  }
  if (q.includes("fraccion") || q.includes("medio") || q.includes("cuarto") || q.includes("denominador") || q.includes("numerador")) {
    return { key: "fracciones", topicName: "Concepto de fracciones", subject: "Matemáticas" };
  }
  if (q.includes("ingles") || q.includes("perro en ingles") || q.includes("como se dice") || q.includes("dog")) {
    return { key: "ingles_perro", topicName: "Vocabulario de inglés básico", subject: "Inglés" };
  }
  if (q.includes("programacion") || q.includes("programar") || q.includes("codigo") || q.includes("robot")) {
    return { key: "programacion", topicName: "Pensamiento computacional y código", subject: "Tecnología" };
  }
  if (q.includes("planeta") || q.includes("sistema solar") || q.includes("espacio")) {
    return { key: "planetas", topicName: "El Sistema Solar", subject: "Ciencias y Espacio" };
  }
  if (q.includes("tarea") || q.includes("no entendi mi tarea") || q.includes("duda escolar")) {
    return { key: "tarea_dudas", topicName: "Estrategias de aprendizaje y dudas escolares", subject: "Técnicas de Estudio" };
  }
  if (q.includes("ortografia") || q.includes("acento") || q.includes("tilde")) {
    return { key: "ortografia", topicName: "Reglas de acentuación y ortografía", subject: "Español" };
  }
  if (q.includes("america") || q.includes("colon") || q.includes("1492")) {
    return { key: "historia_america", topicName: "La llegada a América y los Pueblos Originarios", subject: "Historia" };
  }
  if (q.includes("azteca") || q.includes("mexica") || q.includes("maya") || q.includes("mexico")) {
    return { key: "historia_mexico", topicName: "Historia de México y culturas originarias", subject: "Historia" };
  }

  return { key: "general", topicName: "Curiosidad General", subject: "Aprendizaje Integral" };
}

/**
 * Generates an intelligent, empathetic diagnostic response about Mariana López
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
• **Patrón de Dificultad Detectado:** Presenta confusión al comparar fracciones cuando los denominadores son diferentes (como comparar 1/2 con 2/4 o 1/3 con 2/6). Asume erróneamente que a mayor denominador, mayor es la fracción.
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
 * Handle reformulation ("No entendí, explícamelo de otra manera") adapting to the previous turn
 */
function handleAdaptiveReformulation(
  history: MiaHistoryItem[],
  mode: MiaMode
): MiaResponse {
  const lastMiaMsg = [...history].reverse().find((h) => h.sender === "mia");
  const lastTopic = (lastMiaMsg?.topic || "").toLowerCase();
  const lastText = (lastMiaMsg?.text || "").toLowerCase();

  // Case 1: Previous topic was history / discovery of America
  if (lastTopic.includes("america") || lastText.includes("colon") || lastText.includes("1492")) {
    return {
      reply: `¡No te preocupes! Imagina este ejemplo 💡:

Estás jugando en tu recámara con tus juguetes 🧸. De pronto entra un niño nuevo y grita: *"¡Descubrí este cuarto!"* 🚪

Tú pensarías: *"¡Pero si yo ya vivía aquí con mis cosas!"* 😅

Eso pasó en 1492: para Colón fue nuevo porque no estaba en sus mapas europeos, pero aquí ya vivían millones de personas indígenas con sus pueblos y ricas culturas.

Por eso hoy le llamamos **"Encuentro de dos mundos"** 🤝🌎.`,
      topic: "Historia · Reformulación Adaptativa",
      mode,
      intent: "reformulation",
      challenge: "¿Tú qué le habrías dicho al navegante si llegara a tu casa?",
      funFact: "En la historia siempre hay dos lados de la moneda: lo que ve quien llega y lo que vive quien ya estaba ahí.",
      aiProvider: "pedagogical-engine",
    };
  }

  // Case 2: Previous topic was fractions / 1/2 vs 1/4
  if (lastTopic.includes("fraccion") || lastTopic.includes("medio") || lastTopic.includes("cuarto") || lastText.includes("medio") || lastText.includes("cuarto") || lastText.includes("denominador")) {
    return {
      reply: `¡Tranquilo! Vamos a verlo con **dinero y monedas** 🪙:

Imagina una moneda de **\$10 pesos** (tu entero completo):
• Si la cambias por 2 monedas de **\$5 pesos**, cada una es la mitad (**1/2**).
• Si la cambias por 4 monedas de **\$2.50 pesos**, cada una es un cuarto (**1/4**).

Una moneda de \$5 pesos (**1/2**) vale el doble que una de \$2.50 (**1/4**). ¡Necesitas dos monedas de 1/4 para juntar 1/2!

¿Te hace más sentido viéndolo con monedas? 💰`,
      topic: "Matemáticas · Reformulación con Monedas",
      mode,
      intent: "reformulation",
      challenge: "¿Prefieres tener una moneda de \$5 o una de \$2.50 para comprar un dulce?",
      funFact: "Los números de las fracciones no compiten por quién es más grande; representan partes del mismo dinero.",
      aiProvider: "pedagogical-engine",
    };
  }

  // Case 3: Space / black hole / universe
  if (lastTopic.includes("espacio") || lastText.includes("agujero negro") || lastText.includes("planeta")) {
    return {
      reply: `¡No pasa nada! El universo es gigante y a veces suena raro. Imagínalo con una cobija y juguetes en tu cama 🛏️:

Si estiras una cobija bien apretada entre dos personas y en medio pones una pelota pesada de futbol, la cobija se hunde hacia abajo. Si tiras canicas cerca, todas ruedan hacia la pelota pesada porque el espacio se deformó.

¡Así funciona la gravedad en el espacio! Los planetas y agujeros negros deforman el espacio como la pelota de futbol en la cobija. ¿Se entiende mejor así? 🌌`,
      topic: "Astronomía · Reformulación Adaptativa",
      mode,
      challenge: "¿Has visto cómo el agua en la bañera gira en remolino al quitar el tapón?",
      funFact: "Los mejores físicos del mundo usan dibujos y cobijas para entender el espacio.",
      aiProvider: "pedagogical-engine",
    };
  }

  // Generic intuitive reformulation
  return {
    reply: `¡No te preocupes para nada! En la escuela y en la vida, cuando algo no se entiende a la primera, el secreto de los genios es cambiar de ejemplo 💡.

Imagina que estamos armando una torre con bloques de juguete 🧱. Si ponemos la base muy flaquita, se cae. Pero si ponemos piezas anchas abajo, queda fuerte.

Dime qué partecita específica te causó duda y la explicamos con juguetes, dulces o superhéroes. ¡Aquí tenemos toda la paciencia del mundo!`,
    topic: "Aprendizaje Adaptativo · Reformulación",
    mode,
    challenge: "¿Quieres que inventemos un cuento corto con superhéroes sobre esto?",
    funFact: "Albert Einstein decía que si no puedes explicar algo de forma sencilla, es porque aún puedes buscar un ejemplo mejor.",
    aiProvider: "pedagogical-engine",
  };
}

/**
 * Deep Socratic practice guidance with progressive hints (Level 1, 2, 3)
 */
function handlePracticeSocraticGuidance(
  message: string,
  context?: MiaPracticeContext,
  history?: MiaHistoryItem[]
): MiaResponse {
  const q = cleanPrompt(message);
  const topicName = context?.topicName || "Fracciones Equivalentes";
  const studentName = context?.studentName || "Mariana";
  const exercisePrompt = context?.exercisePrompt || "el reto en tu pantalla";

  // 1. Is student asking directly for the answer?
  const isAskingAnswerDirectly =
    q.includes("respuesta") ||
    q.includes("solucion") ||
    q.includes("cual es la a") ||
    q.includes("cual es la b") ||
    q.includes("cual es la c") ||
    q.includes("cual es la d") ||
    q.includes("dime cual") ||
    q.includes("cual elijo") ||
    q.includes("que pongo");

  if (isAskingAnswerDirectly) {
    return {
      reply: `¡Estoy contigo en tu práctica, ${studentName}! 🎯 Sé que quieres resolverlo súper rápido, pero si yo te doy la letra directa, tu cerebro se perdería la mejor parte: ¡descubrirla tú misma!

En vez de darte la letra, mira esta pista dorada:
• El **numerador** (arriba) te dice cuántas partes tomaste o coloreaste.
• El **denominador** (abajo) te dice en cuántas partes iguales se dividió todo el entero.

Imagina una pizza cortada en 2 rebanadas gigantes. Si te comes 1 rebanada (1/2), te comiste la mitad exacta 🍕.
Ahora imagina otra pizza del mismo tamaño cortada en 4 rebanadas más pequeñas. ¿Cuántas de esas 4 rebanadas tendrías que comer para tener exactamente la misma cantidad de pizza?

¡Fíjate en las opciones de tu pantalla y busca la fracción que cumpla eso! ¿Cuál crees que sea?`,
      topic: `${topicName} · Guía Socrática`,
      mode: "practice",
      challenge: "Piensa: ¿2 partes de 4 es lo mismo que 1 parte de 2?",
      funFact: "Cuando tu cerebro busca la respuesta por sí mismo, crea conexiones neuronales que nunca se olvidan.",
      aiProvider: "pedagogical-engine",
    };
  }

  // 2. Is student reporting a mistake?
  const isReportingError =
    q.includes("me equivoque") ||
    q.includes("salio mal") ||
    q.includes("por que esta mal") ||
    q.includes("falle") ||
    q.includes("no era") ||
    q.includes("incorrecto");

  if (isReportingError) {
    return {
      reply: `¡No te preocupes para nada, ${studentName}! 🌟 En MACHTIA equivocarse no es malo; es la pista número uno que nos dice dónde poner atención.

El error más común en las fracciones es pensar que porque un número es más grande, la fracción vale más. Por ejemplo: 4 es más grande que 2, pero una rebanada de 1/4 es más CHIQUITA que una de 1/2 (porque el pastel se cortó entre 4 personas en vez de 2).

Para encontrar una fracción equivalente, multiplica o divide arriba y abajo por el MISMO número:
• Si tienes 1/2 y multiplicas ambos por 2: 1×2 = 2, y 2×2 = 4. ¡Eso da 2/4!
• Ambas fracciones valen exactamente lo mismo.

Revisa nuevamente tu ejercicio con esta idea. ¿Quieres intentar seleccionarlo otra vez? ¡Tú puedes! 💪`,
      topic: `${topicName} · Superación de Error`,
      mode: "practice",
      challenge: "¿Qué pasa si multiplicas el numerador y denominador de 1/3 por 2? ¿Qué fracción obtienes?",
      funFact: "Los grandes científicos intentan decenas de veces antes de lograr su descubrimiento.",
      aiProvider: "pedagogical-engine",
    };
  }

  // Default Socratic Progressive Hint
  return {
    reply: `¡Estoy contigo en tu práctica, ${studentName}! 🎯 Vamos a analizar ${exercisePrompt}.

Aquí está tu pista de observación paso a paso 🔍:
1. Cuenta en cuántas partes totales está dividido el entero (ese es tu **denominador**, el número de abajo).
2. Luego fíjate cuántas partes están tomadas o coloreadas (ese es tu **numerador**, el número de arriba).
3. Si multiplicas el número de arriba y el de abajo por 2, ¿qué nueva fracción obtienes?

¡Observa con calma las opciones en tu pantalla y dime qué número obtuviste!`,
    topic: topicName,
    mode: "practice",
    challenge: "¿Qué número obtienes si multiplicas 1×2 y 2×2?",
    funFact: "Recuerda: en MACHTIA puedes equivocarte sin miedo. ¡De cada intento aprendemos algo nuevo!",
    aiProvider: "pedagogical-engine",
  };
}

/**
 * Try external LLM inference (Gemini 2.0 Flash / OpenAI)
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

      if (history && history.length > 0) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.sender === "user" ? "user" : "model",
            parts: [{ text: item.text }],
          });
        }
      }

      const contextDesc = context?.exercisePrompt
        ? `[Contexto escolar: Alumno resolviendo ejercicio "${context.exercisePrompt}", tema "${context.topicName || "Fracciones"}".]`
        : "";

      contents.push({
        role: "user",
        parts: [{ text: `${contextDesc}\n[MODO: ${mode.toUpperCase()}]\nPregunta del alumno: ${prompt}` }],
      });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: MIA_SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return { content: text.trim(), provider: "Google Gemini 2.0 Flash" };
      }
    } catch {}
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

      messages.push({ role: "user", content: `[MODO: ${mode.toUpperCase()}] ${prompt}` });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 450, temperature: 0.7 }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text && text.trim()) return { content: text.trim(), provider: "OpenAI gpt-4o-mini" };
      }
    } catch {}
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

    // 1. Try external AI generative inference if available
    const external = await tryExternalAI(rawTrimmed, mode, context, history);
    if (external) {
      const classification = classifyStudentIntent(rawTrimmed, mode === "practice", Boolean(context?.exercisePrompt));
      return {
        reply: external.content,
        topic: classification.extractedTopic,
        mode,
        aiProvider: external.provider,
        providerNotice: `Conectado a ${external.provider} en tiempo real.`,
      };
    }

    // 2. Classify Student Intent with Strict Boundaries
    const classification = classifyStudentIntent(
      rawTrimmed,
      mode === "practice",
      Boolean(context?.exercisePrompt)
    );

    // Intent A: Diagnostic Inquiry
    if (classification.intent === "diagnostic_inquiry") {
      return handleDiagnosticQuery(rawTrimmed, context);
    }

    // Intent B: History of America (Columbus, 1492, Indigenous Civilizations)
    if (classification.intent === "history_america") {
      const knowledge = KNOWLEDGE_BASE.historia_america;
      return {
        reply: knowledge.freeAnswer,
        topic: knowledge.topic,
        mode: "free",
        intent: "history_america",
        funFact: knowledge.funFact,
        challenge: knowledge.challenge,
        aiProvider: "pedagogical-engine",
        providerNotice: "Motor pedagógico curricular MACHTIA activo.",
      };
    }

    // Intent C: History of Mexico
    if (classification.intent === "history_mexico") {
      const knowledge = KNOWLEDGE_BASE.historia_mexico;
      return {
        reply: knowledge.freeAnswer,
        topic: knowledge.topic,
        mode: "free",
        intent: "history_mexico",
        funFact: knowledge.funFact,
        challenge: knowledge.challenge,
        aiProvider: "pedagogical-engine",
        providerNotice: "Motor pedagógico curricular MACHTIA activo.",
      };
    }

    // Intent D: Math concept: un medio y un cuarto
    if (classification.intent === "math_fractions_concept") {
      const knowledge = KNOWLEDGE_BASE.medio_cuarto;
      return {
        reply: knowledge.freeAnswer,
        topic: knowledge.topic,
        mode: "free",
        intent: "math_fractions_concept",
        funFact: knowledge.funFact,
        challenge: knowledge.challenge,
        aiProvider: "pedagogical-engine",
        providerNotice: "Motor pedagógico curricular MACHTIA activo.",
      };
    }

    // Intent E: Adaptive Reformulation ("No entendí, explícamelo de otra manera")
    if (classification.intent === "reformulation") {
      return handleAdaptiveReformulation(history || [], mode);
    }

    // Intent F: Practice-specific evaluated exercise help (Socratic Scaffolding)
    if (
      classification.isEvaluatingExercise ||
      (mode === "practice" &&
        (classification.intent === "practice_hint" ||
          classification.intent === "practice_direct_answer" ||
          classification.intent === "practice_error_help"))
    ) {
      return handlePracticeSocraticGuidance(rawTrimmed, context, history);
    }

    // Helper to format knowledge items based on active mode
    const formatKnowledge = (knowledge: TopicKnowledge) => {
      if (mode === "curiosity") {
        return {
          reply: `🌟 **¡Qué gran curiosidad sobre ${knowledge.topic}!**\n\n${knowledge.curiosityStory}\n\n💡 **Dato Asombroso:** ${knowledge.funFact}`,
          topic: `${knowledge.subject} · ${knowledge.topic}`,
          mode: "curiosity" as MiaMode,
          intent: classification.intent,
          funFact: knowledge.funFact,
          challenge: knowledge.challenge,
          aiProvider: "pedagogical-engine",
          providerNotice: "Motor pedagógico curricular MACHTIA activo.",
        };
      }
      return {
        reply: `💡 **${knowledge.topic}**\n\n${knowledge.freeAnswer}`,
        topic: knowledge.topic,
        mode: "free" as MiaMode,
        intent: classification.intent,
        funFact: knowledge.funFact,
        challenge: knowledge.challenge,
        aiProvider: "pedagogical-engine",
        providerNotice: "Motor pedagógico curricular MACHTIA activo.",
      };
    };

    // Intent G: Curricular Topics from Knowledge Base
    if (classification.intent === "science_space") {
      return formatKnowledge(KNOWLEDGE_BASE.agujero_negro);
    }
    if (classification.intent === "science_dinosaurs") {
      return formatKnowledge(KNOWLEDGE_BASE.dinosaurios);
    }
    if (classification.intent === "science_nature") {
      return formatKnowledge(KNOWLEDGE_BASE.cielo_azul);
    }
    if (classification.intent === "math_general") {
      return formatKnowledge(KNOWLEDGE_BASE.tablas_multiplicar);
    }
    if (classification.intent === "technology_coding") {
      return formatKnowledge(KNOWLEDGE_BASE.programacion);
    }
    if (classification.intent === "language_english") {
      return formatKnowledge(KNOWLEDGE_BASE.ingles_perro);
    }

    // Check if detected by educational topic key
    const detected = detectEducationalTopic(rawTrimmed);
    if (KNOWLEDGE_BASE[detected.key]) {
      return formatKnowledge(KNOWLEDGE_BASE[detected.key]);
    }

    // Default: General Curiosity
    const genericReply = mode === "curiosity"
      ? `¡Esa es una pregunta fascinante sobre el mundo, explorador! 🚀\n\nImagina que cada cosa que aprendemos en la escuela es como una pieza de un gran rompecabezas. Cuando investigamos sobre "${rawTrimmed}", observar con atención, hacer preguntas y experimentar nos ayuda a entender los secretos de la naturaleza.\n\n¿Sabías que los niños que hacen más preguntas en primaria desarrollan una imaginación más rápida y poderosa? ¡Sigue preguntando!`
      : `¡Me encanta que me preguntes sobre eso! 💡\n\nSobre "${rawTrimmed}": en la escuela y en la vida, todos los temas importantes se construyen pasito a pasito. Si es una duda de clase o de tarea, piensa primero en qué es lo que ya conoces, qué parte se te hace difícil y qué ejemplo de la vida diaria se le parece.\n\n¿Quieres que exploremos un ejemplo juntos o te gustaría que lo comparemos con un juego?`;

    return {
      reply: genericReply,
      topic: classification.extractedTopic,
      mode,
      funFact: "En MACHTIA no hay preguntas tontas: ¡todas las preguntas nos hacen más inteligentes!",
      challenge: "¿Te gustaría que lo comparemos con un ejemplo de comida o de superhéroes?",
      aiProvider: "pedagogical-engine",
      providerNotice: "Motor pedagógico curricular MACHTIA activo.",
    };
  }
}

export const miaAgent = new MiaAgentService();

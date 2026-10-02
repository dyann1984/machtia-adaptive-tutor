import type { Exercise, Practice, Student, LearningEvidence } from "@/types";
import { repository } from "@/lib/data/repository";

export const SUBJECT_CATALOG = [
  { id: "matematicas", name: "Matemáticas", topics: [{ id: "fracciones-equivalentes", name: "Fracciones equivalentes" }, { id: "operaciones", name: "Operaciones y problemas" }] },
  { id: "espanol", name: "Español", topics: [{ id: "comprension-lectora", name: "Comprensión lectora" }] },
  { id: "ciencias", name: "Ciencias", topics: [{ id: "seres-vivos", name: "Seres vivos y su entorno" }] },
  { id: "historia", name: "Historia", topics: [{ id: "tiempo-y-cambios", name: "Tiempo, cambios y causas" }] },
  { id: "ingles", name: "Inglés", topics: [{ id: "vocabulario", name: "Vocabulario y comprensión" }] },
];
export const subjectName = (id: string) => SUBJECT_CATALOG.find((s) => s.id === id)?.name || "Matemáticas";
export type ActivityKind = NonNullable<Exercise["activityKind"]>;
export const ACTIVITY_LABELS: Record<ActivityKind, string> = { choice: "Selección razonada", reading: "Lectura breve", classification: "Clasificación", sequence: "Orden y relaciones" };
export interface DraftConfig {
  subjectId: string; topicId: string; recipientId: string; grade: number; objective: string;
  difficulty: Exercise["difficulty"]; exerciseCount: number; activityKind: ActivityKind;
  initialSupport: NonNullable<Practice["initialSupport"]>;
}
export interface PracticeDraft { config: DraftConfig; title: string; instructions: string; exercises: Exercise[] }
type Seed = [string, string[], number, string, string, string, string];
const BANK: Record<string, Seed[]> = {
  espanol: [
    ["¿Cuál es la idea principal?", ["El grupo cuida un huerto", "El grupo vende juguetes", "El grupo viaja en tren"], 0, "Busca qué sucede a lo largo de todo el texto, no solo en una oración.", "Cuidar un espacio en equipo", "Ana y su grupo plantan semillas. Cada día riegan la tierra y observan los brotes. Entre todos cuidan el huerto.", "Piensa en un título corto que abarque las acciones del grupo."],
    ["¿Qué significa 'brotes' en este texto?", ["Piedras", "Pequeñas plantas que empiezan a crecer", "Nubes"], 1, "Lee la oración anterior y piensa qué puede salir de una semilla.", "Vocabulario por contexto", "Las semillas recibieron agua y luz. Después de unos días aparecieron brotes verdes.", "Imagina la escena antes y después de regar: ¿qué cambió?"],
    ["¿Por qué Julia llevó un paraguas?", ["Porque iba a dibujar", "Porque quería saltar", "Porque el cielo anunciaba lluvia"], 2, "Busca una causa en lo que Julia observó antes de salir.", "Inferencia sencilla", "Julia miró las nubes oscuras. Antes de salir tomó su paraguas.", "Representa dos escenas: lo que vio Julia y lo que decidió llevar."],
    ["¿Qué ocurrió primero?", ["Lavó la fruta", "Compartió la ensalada", "Guardó el plato vacío"], 0, "Encuentra la acción que hace posibles las siguientes.", "Secuencia de un texto", "Luis lavó la fruta, preparó una ensalada y después la compartió.", "Coloca cada acción en una tarjeta y busca el punto de inicio."],
    ["¿Qué oración resume el texto?", ["El libro se perdió", "La familia aprende una receta junta", "El perro sale a correr"], 1, "Busca la idea que conecta a todos los personajes.", "Resumen", "La abuela enseña una receta. Leo mide los ingredientes y su hermana mezcla. Todos aprenden juntos.", "Imagina una foto de la escena: ¿qué estaría haciendo la familia?"],
  ],
  ciencias: [
    ["¿Cuál necesita agua, luz y aire para crecer?", ["Una planta", "Una piedra", "Un lápiz"], 0, "Observa qué objeto puede cambiar y crecer por sí mismo.", "Características de seres vivos", "Compara una maceta, una piedra y un lápiz durante varios días.", "Imagina dos fotos del mismo objeto, una hoy y otra después de un mes."],
    ["¿Qué animal está adaptado para vivir en el agua?", ["Una gallina", "Un pez", "Una mariposa"], 1, "Relaciona la forma de moverse de cada animal con su entorno.", "Hábitat", "Cada animal tiene un entorno donde encuentra alimento y protección.", "Piensa en un mapa de entornos: agua, tierra y aire. ¿Qué movimientos ayudan en cada uno?"],
    ["¿Qué objeto absorbe mejor un poco de agua?", ["Una cuchara metálica", "Un vaso de vidrio", "Una esponja"], 2, "Piensa qué material tiene espacios pequeños donde puede entrar el agua.", "Observación de materiales", "Deja una gota sobre cada material y observa si permanece encima o entra.", "Imagina cada material con una lupa. ¿Hay pequeños espacios entre sus partes?"],
    ["¿Qué secuencia describe el crecimiento de una planta?", ["Semilla → brote → planta", "Planta → piedra → semilla", "Brote → agua → piedra"], 0, "Busca una secuencia en la que cada etapa pueda convertirse en la siguiente.", "Ciclo de crecimiento", "Una observación científica puede registrar cambios día a día.", "Dibuja tres cuadros vacíos para el antes, el cambio y el después."],
    ["¿Qué acción ayuda a conservar el agua?", ["Dejar la llave abierta", "Cerrar la llave mientras te enjabonas", "Vaciar botellas sin usarlas"], 1, "Piensa en qué momentos necesitas agua y en cuáles no la estás usando.", "Cuidado del entorno", "Pequeñas acciones diarias pueden evitar desperdiciar recursos.", "Imagina el recorrido de una gota desde la llave hasta tus manos."],
  ],
  historia: [
    ["¿Qué objeto permite comparar cómo se comunicaban las personas antes y ahora?", ["Una carta y un mensaje digital", "Dos piedras iguales", "Dos vasos de agua"], 0, "Busca objetos que cumplan una misma función en diferentes momentos.", "Cambios y permanencias", "Las familias conservan objetos y relatos de otras épocas.", "Haz dos columnas: antes y ahora. Piensa qué función permanece."],
    ["¿Qué sucede antes de cosechar?", ["Comer todos los frutos", "Sembrar y cuidar la planta", "Guardar el plato vacío"], 1, "Piensa qué necesita ocurrir para que exista una cosecha.", "Orden temporal", "Las personas organizan sus actividades en etapas.", "Dibuja una línea con inicio y final; coloca mentalmente cada actividad."],
    ["¿Cuál es una fuente para conocer la historia de tu comunidad?", ["Una predicción sin datos", "Un número elegido al azar", "Una fotografía antigua con fecha"], 2, "Busca un registro que pueda mostrar algo de un momento anterior.", "Fuentes históricas", "Para estudiar el pasado comparamos relatos y registros, y preguntamos cuándo y dónde se hicieron.", "Imagina que investigas como detective: ¿qué registro podrías revisar?"],
    ["Una calle se inundaba. El vecindario construyó un desagüe. ¿Qué motivó el cambio?", ["Las inundaciones", "Una fiesta de cumpleaños", "El color de una mochila"], 0, "Identifica el problema que ocurrió antes de la decisión.", "Causa y efecto", "Los cambios de una comunidad pueden responder a necesidades compartidas.", "Usa dos cajas: problema y decisión. Busca cómo conectarlas."],
    ["¿Cuál secuencia está en orden?", ["Hoy → ayer → mañana", "Ayer → hoy → mañana", "Mañana → ayer → hoy"], 1, "Ubica el momento en que estás y piensa qué quedó antes y qué viene después.", "Referencias temporales", "Una línea del tiempo ayuda a organizar hechos sin confundir sus momentos.", "Imagina tres pasos al caminar: el que dejaste, donde estás y el siguiente."],
  ],
  ingles: [
    ["Read: 'The cat sleeps.' ¿Qué animal duerme?", ["Cat", "Dog", "Bird"], 0, "Busca la palabra que nombra al animal, antes de la acción.", "Comprensión de una oración", "The cat sleeps.", "Imagina una escena y separa quién participa de lo que hace."],
    ["¿Qué palabra nombra una manzana?", ["Book", "Apple", "Chair"], 1, "Piensa en categorías: alimento, objeto para leer y mueble.", "Vocabulario cotidiano", "Clasifica las palabras según lo que representan.", "Imagina una bolsa del mercado, una biblioteca y una habitación."],
    ["Read: 'I have two pencils.' ¿Cuántos lápices hay?", ["One", "Three", "Two"], 2, "Localiza la palabra que indica cantidad y cuenta con los dedos.", "Números en contexto", "I have two pencils.", "Representa la oración con objetos pequeños, uno a uno."],
    ["¿Qué saludo usarías por la mañana?", ["Good morning", "Good night", "Goodbye"], 0, "Relaciona el momento del día con las palabras del saludo.", "Saludos", "Piensa cuándo saludas al entrar a la escuela.", "Imagina tres escenas: llegar por la mañana, ir a dormir y despedirse."],
    ["Read: 'The book is blue.' ¿Qué palabra describe el color?", ["Book", "Blue", "The"], 1, "Distingue la palabra que nombra el objeto de la que dice cómo es.", "Colores", "The book is blue.", "Piensa en una tarjeta con un objeto y otra con una característica."],
  ],
};

export function makeExercise(config: DraftConfig, index: number, variant = 0): Exercise {
  let seed: Seed;
  if (config.subjectId === "matematicas") {
    if (config.topicId === "fracciones-equivalentes") {
      const d = (config.grade === 2 ? 2 : config.grade === 3 ? 3 : 4) + (config.difficulty === "hard" ? 2 : config.difficulty === "medium" ? 1 : 0);
      const n = (index + variant) % (d - 1) + 1;
      const factor = 2 + variant % 2;
      seed = [`¿Qué fracción representa la misma cantidad que ${n}/${d}?`, [`${n * factor}/${d * factor}`, `${n}/${d * factor}`, `${n + 1}/${d}`], 0, "Si cambias el tamaño de las partes, piensa cuántas necesitas para conservar la cantidad.", "Equivalencia de fracciones", `Compara partes iguales de enteros del mismo tamaño.`, "Imagina una pizza: puedes hacer cortes más pequeños sin cambiar lo que has separado."];
    } else {
      const a = config.grade * 4 * (config.difficulty === "hard" ? 5 : config.difficulty === "medium" ? 2 : 1) + index + variant; const b = config.grade + index;
      const subtract = (index + variant) % 2 === 1;
      const correct = subtract ? a - b : a + b;
      seed = [`Había ${a} bloques. ${subtract ? `Se retiraron ${b}` : `Se agregaron ${b}`}. ¿Cuántos quedan?`, [String(correct), String(correct + 2), String(correct - 1)], 0, "Piensa si la cantidad crece o disminuye antes de calcular.", subtract ? "Resta en contexto" : "Suma en contexto", "Puedes usar objetos o una recta numérica para representar el cambio.", "Imagina una colección de bloques; representa primero la cantidad inicial y después el cambio."];
    }
  } else {
    const seeds = BANK[config.subjectId];
    if (!seeds) throw new Error("Materia no disponible");
    seed = seeds[(index + variant) % seeds.length];
  }
  const [prompt, options, correctIndex, hint, conceptTag, context, alternativeExplanation] = seed;
  // Rotate options, preserving the answer; no subject always uses the same letter.
  const shift = index % options.length;
  const ordered = [...options.slice(shift), ...options.slice(0, shift)];
  return { id: `custom-${config.subjectId}-${index}-${variant}-${crypto.randomUUID()}`, questionNumber: index + 1, prompt,
    options: ordered, correctAnswer: options[correctIndex], hint, conceptTag,
    context: `${context}${config.grade === 4 ? " Explica mentalmente qué evidencia sostiene tu elección." : ""}`,
    alternativeExplanation, guidedExample: "Primero identifica qué sabes. Después representa las opciones. Por último compara y elige tu respuesta.",
    explanation: `Tu elección corresponde a ${conceptTag.toLowerCase()}. ${alternativeExplanation}`,
    visualCue: context, activityKind: config.activityKind, difficulty: config.difficulty };
}
export function regenerateExercise(config: DraftConfig, index: number, current: Exercise): Exercise {
  for (let variant = 1; variant <= 5; variant++) {
    const candidate = makeExercise(config, index, variant);
    if (candidate.prompt !== current.prompt || candidate.options.join("|") !== current.options.join("|")) return candidate;
  }
  return makeExercise(config, index, 1);
}
export function createDraft(config: DraftConfig): PracticeDraft {
  if (!Number.isInteger(config.exerciseCount) || config.exerciseCount < 1 || config.exerciseCount > 10) throw new Error("Elige de 1 a 10 ejercicios");
  if (![2, 3, 4].includes(config.grade)) throw new Error("El banco demo cubre 2°, 3° y 4° de primaria");
  if (!SUBJECT_CATALOG.find(s => s.id === config.subjectId)?.topics.some(t => t.id === config.topicId)) throw new Error("Tema no válido para la materia");
  if (!config.objective.trim()) throw new Error("Escribe un objetivo de aprendizaje");
  const topic = SUBJECT_CATALOG.find(s => s.id === config.subjectId)!.topics.find(t => t.id === config.topicId)!;
  return { config: { ...config }, title: `Reto de ${topic.name}`, instructions: "Lee, observa y prueba. Puedes pedir apoyo en cualquier momento. Tu Tutor te acompaña sin elegir por ti.", exercises: Array.from({ length: config.exerciseCount }, (_, i) => makeExercise(config, i)) };
}
export function validateDraft(draft: PracticeDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim() || !draft.instructions.trim() || !draft.config.objective.trim()) errors.push("Completa título, instrucciones y objetivo.");
  if (!draft.exercises.length || draft.exercises.length > 10) errors.push("La práctica necesita entre 1 y 10 ejercicios.");
  if (new Set(draft.exercises.map(e => e.id)).size !== draft.exercises.length) errors.push("Cada ejercicio necesita un identificador único.");
  draft.exercises.forEach((e, i) => {
    if (!e.prompt.trim() || !e.hint.trim()) errors.push(`Completa pregunta y pista del ejercicio ${i + 1}.`);
    if (e.options.length < 2 || e.options.some(o => !o.trim()) || new Set(e.options.map(o => o.trim().toLowerCase())).size !== e.options.length || !e.options.includes(e.correctAnswer)) errors.push(`Revisa las opciones y la respuesta correcta del ejercicio ${i + 1}.`);
  });
  return errors;
}
export function publishDraft(draft: PracticeDraft): Practice[] {
  const errors = validateDraft(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const group = repository.getGroup();
  if (!repository.getTeacher().groupIds.includes(group.id)) throw new Error("Grupo fuera del acceso docente");
  const recipients = repository.getStudents().filter(s => s.groupId === group.id && (draft.config.recipientId === "group" || s.id === draft.config.recipientId));
  if (!recipients.length) throw new Error("Destinatario fuera del grupo autorizado");
  const topic = SUBJECT_CATALOG.find(s => s.id === draft.config.subjectId)?.topics.find(t => t.id === draft.config.topicId);
  if (!topic || ![2,3,4].includes(draft.config.grade)) throw new Error("Configuración no válida");
  return recipients.map(student => repository.savePractice({
    id: `teacher-${crypto.randomUUID()}`, title: draft.title.trim(), description: draft.instructions.trim(), instructions: draft.instructions.trim(),
    subjectId: draft.config.subjectId, topicId: draft.config.topicId, topicName: topic.name,
    studentId: student.id, studentName: student.name, exercises: structuredClone(draft.exercises).map((e, i) => ({ ...e, questionNumber: i + 1 })),
    status: "pending", createdAt: new Date().toISOString(), teacherCreated: true, learningObjective: draft.config.objective.trim(),
    grade: draft.config.grade, estimatedMinutes: Math.ceil(draft.exercises.length * 1.5 + 2), initialSupport: draft.config.initialSupport,
  }));
}
export function recommendPractice(student: Student | undefined, subjectId: string, topicId: string, evidences: LearningEvidence[]): string {
  if (!student) return "Sin datos suficientes para recomendar una práctica.";
  const evidence = evidences.find(e => e.studentId === student.id && e.subjectId === subjectId && repository.getPracticeById(e.practiceId)?.topicId === topicId);
  if (evidence?.pendingConcepts.length) return `${student.name} necesita reforzar ${evidence.pendingConcepts.join(", ")}, según su última práctica. Sugiero 5 actividades breves con apoyo progresivo.`;
  const gap = student.learningGaps.find(g => !g.resolved && g.subjectId === subjectId && g.topicId === topicId && g.detectionEvidence);
  if (gap) return `${student.name}: ${gap.errorPattern}. Evidencia del diagnóstico: ${gap.detectionEvidence} Sugiero 5 actividades visuales con apoyo progresivo.`;
  return "Sin datos suficientes para recomendar una práctica.";
}

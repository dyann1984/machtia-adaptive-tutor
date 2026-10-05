import { repository, TutorRepository } from "@/lib/data/repository";
import { ExerciseAnswer, SupportEvent } from "@/types";
import { trustedActor } from "./session";
export interface Ledger { baseline?: number; startedAt: string; answers: ExerciseAnswer[]; supports: SupportEvent[] }
const ledgers = new WeakMap<TutorRepository, Map<string, Ledger>>();
export function ledger(practiceId: string): Ledger {
  const actor = trustedActor();
  if (!actor) throw new Error("Authenticated server session required");
  let map = ledgers.get(actor.session.repository);
  if (!map) { map = new Map(); ledgers.set(actor.session.repository, map); }
  let entry = map.get(practiceId);
  if (!entry) {
    const p = repository.getPracticeById(practiceId);
    if (!p) throw new Error("Practice not found");
    entry = { baseline: repository.getStudentById(p.studentId)?.topicPerformances[p.topicId], startedAt: new Date().toISOString(), answers: [], supports: [] };
    map.set(practiceId, entry);
  }
  return entry;
}
export function safeSupport(topic: string, level: number) {
  if (topic.toLowerCase().includes("fracci")) return level === 1
    ? "Una fracción representa partes iguales de un mismo entero. Compara el tamaño del entero antes de comparar sus partes."
    : level === 2 ? "Imagina dos pizzas del mismo tamaño: dividirlas en más partes no cambia la cantidad total. Busca una transformación que conserve la porción."
    : "En un ejemplo distinto, tres quintos conserva su valor al multiplicar arriba y abajo por el mismo factor. Aplica esa estrategia a tu reto y comprueba tu elección.";
  return level === 1 ? `Revisa el concepto ${topic}. Identifica qué información aporta el enunciado antes de elegir.`
    : level === 2 ? "Representa la situación con un dibujo o con tus propias palabras. Compara las opciones con esa representación."
    : "Paso 1: identifica los datos. Paso 2: aplica la regla del tema. Paso 3: comprueba tu opción contra el enunciado.";
}

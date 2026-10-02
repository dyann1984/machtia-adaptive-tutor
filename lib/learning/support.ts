import type { Exercise, SupportKind, SupportEvent } from "@/types";

export const SUPPORT_LABELS: Record<SupportKind, string> = {
  verbal_hint: "Orientación verbal", visual_hint: "Ayuda visual",
  alternative_representation: "Otra representación", guided_steps: "Hazlo conmigo",
};
export function supportDialogue(exercise: Exercise, kind: SupportKind): string {
  if (kind === "verbal_hint") return `Observa esta parte. ${exercise.hint}`;
  if (kind === "visual_hint") return `Miremos de otra manera: ${exercise.visualCue || exercise.context || "Separa lo que sabes de lo que necesitas encontrar. Observa las divisiones y compara los enteros del mismo tamaño."}`;
  if (kind === "alternative_representation") return exercise.alternativeExplanation || "Probemos con objetos o tarjetas. Representa cada posibilidad antes de elegir.";
  return exercise.guidedExample || "Hazlo conmigo: observa lo que sabes; representa el cambio; compara las opciones. Tú eliges la respuesta.";
}
export function summarizeSupports(events: SupportEvent[]) {
  return {
    hintsUsed: events.filter(e => e.kind === "verbal_hint" || e.kind === "visual_hint").length,
    reexplanationsUsed: events.filter(e => e.kind === "alternative_representation" || e.kind === "guided_steps").length,
  };
}

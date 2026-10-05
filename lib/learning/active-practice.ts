import type { Practice } from "@/types";
export function activePracticeForExercise(practices: Practice[], studentId: string, practiceId: string | null, exerciseId: string) {
  const candidates = practices.filter(p => p.studentId === studentId && p.status !== "completed" && p.exercises.some(e => e.id === exerciseId));
  return practiceId ? candidates.find(p => p.id === practiceId) : candidates.length === 1 ? candidates[0] : undefined;
}

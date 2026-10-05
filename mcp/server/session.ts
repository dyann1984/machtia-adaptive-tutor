import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { TutorRepository, installRepositoryResolver } from "@/lib/data/repository";

export interface DemoSession {
  repository: TutorRepository;
  expires: number;
  judgeToken: string;
  actors: Map<string, { role: "teacher" | "student"; id: string }>;
}
export interface TrustedActor { session: DemoSession; role: "teacher" | "student"; id: string }
const sessions = new Map<string, DemoSession>();
const storage = new AsyncLocalStorage<TrustedActor>();
const fallback = new TutorRepository();
installRepositoryResolver(() => storage.getStore()?.session.repository ?? fallback);
export const opaqueToken = () => randomBytes(32).toString("base64url");
export function createDemoSession() {
  for (const [token, s] of sessions) if (s.expires < Date.now()) sessions.delete(token);
  if (sessions.size >= 500) throw new Error("Demo capacity reached; try later");
  const session: DemoSession = { repository: new TutorRepository(), expires: Date.now() + 4 * 60 * 60 * 1000, judgeToken: opaqueToken(), actors: new Map() };
  session.repository.resetOfficialDemoScenario();
  sessions.set(session.judgeToken, session);
  return { session, actorToken: issueActor(session, "teacher", session.repository.getTeacher().id) };
}
export function issueActor(session: DemoSession, role: "teacher" | "student", id: string) {
  if (role === "student" && !session.repository.getStudentById(id)) throw new Error("Unknown demo student");
  for (const [token, actor] of session.actors) if (actor.role === role && actor.id === id) return token;
  const token = opaqueToken(); session.actors.set(token, { role, id }); return token;
}
export function judgeSession(token: string) { const s = sessions.get(token); return s && s.expires > Date.now() ? s : undefined; }
export function authenticate(token: string): TrustedActor | undefined {
  for (const session of sessions.values()) {
    if (session.expires <= Date.now()) continue;
    const actor = session.actors.get(token);
    if (actor) return { session, ...actor };
  }
}
export function trustedActor() { return storage.getStore(); }
export function runAsActor<T>(actor: TrustedActor, task: () => T): T { return storage.run(actor, task); }
export function authorizeTool(name: string, args: Record<string, unknown>) {
  const actor = trustedActor();
  if (!actor) throw Object.assign(new Error("Authenticated demo actor required"), { code: "AUTH_REQUIRED", statusCode: 401 });
  if (args.requesterRole && args.requesterRole !== actor.role || args.requesterId && args.requesterId !== actor.id || args.tenantId && args.tenantId !== "escuela-benito-juarez") {
    throw Object.assign(new Error("Caller identity cannot override authenticated actor"), { code: "IDENTITY_FORBIDDEN", statusCode: 403 });
  }
  const teacherTools = ["analyze_student_performance", "find_students_needing_support", "get_student_learning_gap", "generate_adaptive_practice", "assign_practice_to_student", "report_progress_to_teacher"];
  if (actor.role === "student" && (teacherTools.includes(name) || args.studentId && args.studentId !== actor.id)) {
    throw Object.assign(new Error("Resource is outside this actor's authorization"), { code: "IDOR_FORBIDDEN", statusCode: 403 });
  }
  if (typeof args.practiceId === "string") {
    const practice = actor.session.repository.getPracticeById(args.practiceId);
    if (practice && (actor.role === "student" && practice.studentId !== actor.id || args.studentId && practice.studentId !== args.studentId)) {
      throw Object.assign(new Error("Practice ownership mismatch"), { code: "PRACTICE_FORBIDDEN", statusCode: 403 });
    }
  }
}

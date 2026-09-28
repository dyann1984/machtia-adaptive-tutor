import {
  Student,
  Teacher,
  Group,
  Subject,
  Practice,
  PracticeAttempt,
  LearningEvidence,
  TutorAction,
  ProgressSnapshot,
} from "@/types";
import {
  INITIAL_TEACHER,
  INITIAL_GROUP,
  INITIAL_SUBJECT,
  INITIAL_STUDENTS,
  INITIAL_EVIDENCES,
} from "./mock-data";

class TutorRepository {
  private teacher: Teacher = { ...INITIAL_TEACHER };
  private group: Group = { ...INITIAL_GROUP };
  private subject: Subject = { ...INITIAL_SUBJECT };
  private students: Student[] = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  private practices: Practice[] = [];
  private attempts: PracticeAttempt[] = [];
  private evidences: LearningEvidence[] = JSON.parse(JSON.stringify(INITIAL_EVIDENCES));
  private actionLogs: TutorAction[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      try {
        const savedStudents = localStorage.getItem("machtia_students");
        if (savedStudents) this.students = JSON.parse(savedStudents);

        const savedPractices = localStorage.getItem("machtia_practices");
        if (savedPractices) this.practices = JSON.parse(savedPractices);

        const savedAttempts = localStorage.getItem("machtia_attempts");
        if (savedAttempts) this.attempts = JSON.parse(savedAttempts);

        const savedEvidences = localStorage.getItem("machtia_evidences");
        if (savedEvidences) this.evidences = JSON.parse(savedEvidences);

        const savedActions = localStorage.getItem("machtia_actions");
        if (savedActions) this.actionLogs = JSON.parse(savedActions);
      } catch (e) {
        console.warn("Could not load from localStorage, using memory store", e);
      }
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("machtia_students", JSON.stringify(this.students));
        localStorage.setItem("machtia_practices", JSON.stringify(this.practices));
        localStorage.setItem("machtia_attempts", JSON.stringify(this.attempts));
        localStorage.setItem("machtia_evidences", JSON.stringify(this.evidences));
        localStorage.setItem("machtia_actions", JSON.stringify(this.actionLogs));
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }
    }
  }

  public resetDemoData() {
    this.teacher = { ...INITIAL_TEACHER };
    this.group = { ...INITIAL_GROUP };
    this.subject = { ...INITIAL_SUBJECT };
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    this.practices = [];
    this.attempts = [];
    this.evidences = JSON.parse(JSON.stringify(INITIAL_EVIDENCES));
    this.actionLogs = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("machtia_students");
      localStorage.removeItem("machtia_practices");
      localStorage.removeItem("machtia_attempts");
      localStorage.removeItem("machtia_evidences");
      localStorage.removeItem("machtia_actions");
    }
  }

  public resetToInitialState() {
    this.resetDemoData();
  }

  public getTeacher(): Teacher {
    return this.teacher;
  }

  public getGroup(): Group {
    return this.group;
  }

  public getSubject(): Subject {
    return this.subject;
  }

  public getStudents(): Student[] {
    return [...this.students];
  }

  public getStudentById(id: string): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  public updateStudentScore(studentId: string, topicId: string, newScore: number) {
    const student = this.students.find((s) => s.id === studentId);
    if (student) {
      student.topicPerformances[topicId] = newScore;
      // recalculate overall average approximately
      const scores = Object.values(student.topicPerformances);
      const sum = scores.reduce((acc, v) => acc + v, 0);
      student.overallAverage = Math.round((sum / scores.length / 10) * 10) / 10;
      this.persist();
    }
    return student;
  }

  public getPractices(): Practice[] {
    return [...this.practices];
  }

  public getPracticeById(id: string): Practice | undefined {
    return this.practices.find((p) => p.id === id);
  }

  public getPracticesByStudent(studentId: string): Practice[] {
    return this.practices.filter((p) => p.studentId === studentId);
  }

  public savePractice(practice: Practice): Practice {
    const existingIndex = this.practices.findIndex((p) => p.id === practice.id);
    if (existingIndex >= 0) {
      this.practices[existingIndex] = practice;
    } else {
      this.practices.push(practice);
    }

    const student = this.students.find((s) => s.id === practice.studentId);
    if (student && !student.assignedPracticeIds.includes(practice.id)) {
      student.assignedPracticeIds.push(practice.id);
    }

    this.persist();
    return practice;
  }

  public updatePracticeStatus(practiceId: string, status: Practice["status"]) {
    const practice = this.practices.find((p) => p.id === practiceId);
    if (practice) {
      practice.status = status;
      if (status === "completed") {
        practice.completedAt = new Date().toISOString();
      }
      this.persist();
    }
    return practice;
  }

  public saveAttempt(attempt: PracticeAttempt): PracticeAttempt {
    const existingIndex = this.attempts.findIndex((a) => a.id === attempt.id);
    if (existingIndex >= 0) {
      this.attempts[existingIndex] = attempt;
    } else {
      this.attempts.push(attempt);
    }
    this.persist();
    return attempt;
  }

  public getAttempts(): PracticeAttempt[] {
    return [...this.attempts];
  }

  public getAttemptById(id: string): PracticeAttempt | undefined {
    return this.attempts.find((a) => a.id === id);
  }

  public getEvidences(): LearningEvidence[] {
    return [...this.evidences];
  }

  public getEvidencesByStudent(studentId: string): LearningEvidence[] {
    return this.evidences.filter((e) => e.studentId === studentId);
  }

  public saveEvidence(evidence: LearningEvidence): LearningEvidence {
    const existingIndex = this.evidences.findIndex((e) => e.id === evidence.id);
    if (existingIndex >= 0) {
      this.evidences[existingIndex] = evidence;
    } else {
      this.evidences.unshift(evidence);
    }
    this.persist();
    return evidence;
  }

  public logAction(action: Omit<TutorAction, "id" | "timestamp">): TutorAction {
    const record: TutorAction = {
      ...action,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.actionLogs.unshift(record);
    this.persist();
    return record;
  }

  public getActionLogs(): TutorAction[] {
    return [...this.actionLogs];
  }

  public getProgressSnapshot(studentId: string, topicId: string): ProgressSnapshot | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const evidences = this.getEvidencesByStudent(studentId).filter(
      (e) => e.topicName.toLowerCase().includes("fracciones") || e.subjectId === "matematicas"
    );

    const initialScore = 52; // baseline for Mariana
    const currentScore = student.topicPerformances[topicId] ?? initialScore;
    const delta = currentScore - initialScore;

    return {
      studentId: student.id,
      studentName: student.name,
      subject: "Matemáticas",
      topic: "Fracciones equivalentes",
      scoreBefore: initialScore,
      scoreAfter: currentScore,
      improvementDelta: delta,
      status: delta > 0 ? "Mejora detectada" : "En diagnóstico inicial",
      detail: delta > 0
        ? `Aumento de ${delta}% tras completar la práctica interactiva guiada por el Tutor IA.`
        : "Requiere práctica adaptativa de refuerzo.",
      date: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }),
    };
  }
}

export const repository = new TutorRepository();

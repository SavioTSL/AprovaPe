export type Task = { id: string; title: string; day: number; done: boolean };
export type Topic = {
  id: string;
  subject: string;
  title: string;
  exam: string;
  done: boolean;
  sharedId?: string;
};
export type Session = {
  id: string;
  subject: string;
  minutes: number;
  date: string;
};
export type Timer = {
  elapsed: number;
  startedAt: number | null;
  subject: string;
};
export type AppData = { tasks: Task[]; topics: Topic[]; sessions: Session[] };
export const exams = [
  "PMPE — Soldado",
  "CBMPE — Soldado",
  "CBMPE — Oficial",
  "PCPE — Agente",
];
// Categorias livres para organizar estudos; não constituem conteúdo de edital.
export const subjects = [
  "Português",
  "Direito Constitucional",
  "Matemática e Raciocínio Lógico",
  "Informática",
  "História de Pernambuco",
  "Física",
  "Biologia",
  "Legislação",
  "Redação",
];
export const initialData: AppData = { tasks: [], topics: [], sessions: [] };
export const dayNames = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export const initialTimer: Timer = {
  elapsed: 0,
  startedAt: null,
  subject: subjects[0],
};

export type Task = {
  id: string;
  title: string;
  day: number;
  done: boolean;
  date?: string;
  minutes?: number;
  subject?: string;
  exam?: string;
  planKey?: string;
};
export type Topic = {
  id: string;
  subject: string;
  title: string;
  exam: string;
  done: boolean;
  sharedId?: string;
  notes?: string;
};
export type Session = {
  id: string;
  subject: string;
  minutes: number;
  date: string;
  exam?: string;
};
export type Timer = {
  elapsed: number;
  startedAt: number | null;
  subject: string;
};
export type Preferences = {
  exam: string;
  dailyGoal: number;
  weeklyGoal: number;
  availableDays: number[];
  minutesPerDay: number;
  blockMinutes: number;
};
export type Review = {
  id: string;
  topicId: string;
  dueDate: string;
  step: number;
  lastReviewed?: string;
};
export type Mistake = {
  id: string;
  subject: string;
  question: string;
  explanation: string;
  createdAt: string;
  resolved: boolean;
};
export type AppData = {
  tasks: Task[];
  topics: Topic[];
  sessions: Session[];
  preferences?: Preferences;
  reviews?: Review[];
  mistakes?: Mistake[];
};
export type StudyData = AppData & {
  preferences: Preferences;
  reviews: Review[];
  mistakes: Mistake[];
};
export const exams = [
  "PMPE — Soldado",
  "CBMPE — Soldado",
  "CBMPE — Oficial",
  "PCPE — Agente",
];
// Categorias de organização; não constituem conteúdo oficial de edital.
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
export const defaultPreferences: Preferences = {
  exam: exams[0],
  dailyGoal: 60,
  weeklyGoal: 300,
  availableDays: [1, 2, 3, 4, 5],
  minutesPerDay: 60,
  blockMinutes: 30,
};
export const initialData: StudyData = {
  tasks: [],
  topics: [],
  sessions: [],
  preferences: defaultPreferences,
  reviews: [],
  mistakes: [],
};
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

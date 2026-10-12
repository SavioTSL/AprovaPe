"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AppData,
  StudyData,
  Preferences,
  Mistake,
  initialData,
  initialTimer,
  Timer,
  defaultPreferences,
} from "./data";
import { isAppData, isRecord, isTimer, isPreferences } from "./validation";
import { addDays, dateKey, generatePlan, reviewIntervals } from "./study";
type Store = StudyData & {
  importTopics: (
    items: { subject: string; title: string }[],
    exam: string,
    reference?: string,
  ) => number;
  updatePreferences: (p: Preferences) => void;
  generateSchedule: () => number;
  updateTopic: (id: string, notes: string) => void;
  scheduleReview: (id: string) => void;
  completeReview: (id: string, remembered: boolean) => void;
  removeReview: (id: string) => void;
  addMistake: (subject: string, question: string, explanation: string) => void;
  toggleMistake: (id: string) => void;
  removeMistake: (id: string) => void;
  addManualSession: (subject: string, minutes: number, date: string) => void;
  removeSession: (id: string) => void;
  resetWeek: () => void;
  timer: Timer;
  hydrated: boolean;
  storageError: string | null;
  setHydrated: (v: boolean) => void;
  setTimer: (timer: Timer) => void;
  toggleTask: (id: string) => void;
  toggleTopic: (id: string) => void;
  addTask: (title: string, day: number) => void;
  removeTask: (id: string) => void;
  addTopic: (subject: string, title: string, exam: string) => void;
  removeTopic: (id: string) => void;
  shareTopic: (id: string, exam: string) => void;
  addSession: (subject: string, minutes: number) => void;
  restore: (data: AppData) => void;
  reset: () => void;
};
let blockedStorage = false;
let readingStorage = false;
const storage = {
  getItem: (name: string) => {
    const raw = localStorage.getItem(name);
    if (raw) {
      try {
        const saved: unknown = JSON.parse(raw);
        if (!isRecord(saved) || !isAppData(saved.state))
          throw new Error("Invalid");
      } catch {
        blockedStorage = true;
        throw new Error("Dados locais inválidos");
      }
    }
    return raw;
  },
  setItem: (name: string, value: string) => {
    if (blockedStorage || readingStorage) return;
    try {
      localStorage.setItem(name, value);
    } catch {
      blockedStorage = true;
      queueMicrotask(() =>
        useStudy.setState({
          storageError:
            "Não foi possível salvar neste navegador. Exporte um backup antes de sair.",
        }),
      );
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};
export const useStudy = create<Store>()(
  persist(
    (set, get) => ({
      importTopics: (items, exam, reference) => {
        if (reference && reference.length > 2048) return 0;
        const s = get();
        const keys = new Set(
          s.topics
            .filter((t) => t.exam === exam)
            .map((t) => `${t.subject.toLowerCase()}|${t.title.toLowerCase()}`),
        );
        const added = [];
        for (const item of items) {
          const subject = item.subject.trim(),
            title = item.title.trim();
          const key = `${subject.toLowerCase()}|${title.toLowerCase()}`;
          if (
            !keys.has(key) &&
            subject &&
            title &&
            subject.length <= 500 &&
            title.length <= 500
          ) {
            keys.add(key);
            added.push({
              id: crypto.randomUUID(),
              subject,
              title,
              exam,
              done: false,
              ...(reference
                ? { notes: `Referência do conteúdo: ${reference}` }
                : {}),
            });
          }
        }
        set({ topics: [...s.topics, ...added] });
        return added.length;
      },
      updatePreferences: (p) => {
        if (isPreferences(p)) set({ preferences: p });
      },
      generateSchedule: () => {
        const s = get();
        const tasks = generatePlan(
          s.topics,
          s.preferences,
          s.tasks,
          s.sessions,
        );
        set({ tasks: [...s.tasks, ...tasks] });
        return tasks.length;
      },
      updateTopic: (id, notes) => {
        if (notes.length <= 10000)
          set((s) => ({
            topics: s.topics.map((t) => (t.id === id ? { ...t, notes } : t)),
          }));
      },
      scheduleReview: (id) =>
        set((s) =>
          s.reviews.some((r) => r.topicId === id)
            ? {}
            : {
                reviews: [
                  ...s.reviews,
                  {
                    id: crypto.randomUUID(),
                    topicId: id,
                    dueDate: addDays(dateKey(new Date()), 1),
                    step: 0,
                  },
                ],
              },
        ),
      completeReview: (id, remembered) =>
        set((s) => ({
          reviews: s.reviews.map((r) => {
            if (r.id !== id) return r;
            const step = remembered ? Math.min(r.step + 1, 5) : 0;
            return {
              ...r,
              step,
              lastReviewed: dateKey(new Date()),
              dueDate: addDays(dateKey(new Date()), reviewIntervals[step]),
            };
          }),
        })),
      removeReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
      addMistake: (subject, question, explanation) => {
        const m: Mistake = {
          id: crypto.randomUUID(),
          subject: subject.trim(),
          question: question.trim(),
          explanation,
          createdAt: new Date().toISOString(),
          resolved: false,
        };
        if (isAppData({ ...initialData, mistakes: [m] }))
          set((s) => ({ mistakes: [m, ...s.mistakes] }));
      },
      toggleMistake: (id) =>
        set((s) => ({
          mistakes: s.mistakes.map((m) =>
            m.id === id ? { ...m, resolved: !m.resolved } : m,
          ),
        })),
      removeMistake: (id) =>
        set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) })),
      addManualSession: (subject, minutes, date) => {
        const session = {
          id: crypto.randomUUID(),
          subject: subject.trim(),
          minutes,
          date,
          exam: get().preferences.exam,
        };
        if (
          isAppData({ ...initialData, sessions: [session] }) &&
          Date.parse(date) <= Date.now()
        )
          set((s) => ({ sessions: [...s.sessions, session] }));
      },
      removeSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      resetWeek: () =>
        set((s) => ({
          tasks: s.tasks.map((t) => (!t.date ? { ...t, done: false } : t)),
        })),
      ...initialData,
      timer: initialTimer,
      hydrated: false,
      storageError: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setTimer: (timer) => {
        if (isTimer(timer)) set({ timer });
      },
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t,
          ),
        })),
      toggleTopic: (id) =>
        set((s) => {
          const topic = s.topics.find((t) => t.id === id);
          return {
            topics: s.topics.map((t) =>
              t.id === id || (topic?.sharedId && t.sharedId === topic.sharedId)
                ? { ...t, done: !topic?.done }
                : t,
            ),
          };
        }),
      addTask: (title, day) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { id: crypto.randomUUID(), title, day, done: false },
          ],
        })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      addTopic: (subject, title, exam) =>
        set((s) => ({
          topics: [
            ...s.topics,
            { id: crypto.randomUUID(), subject, title, exam, done: false },
          ],
        })),
      removeTopic: (id) =>
        set((s) => ({
          topics: s.topics.filter((t) => t.id !== id),
          reviews: s.reviews.filter((r) => r.topicId !== id),
        })),
      shareTopic: (id, exam) =>
        set((s) => {
          const topic = s.topics.find((t) => t.id === id);
          if (
            !topic ||
            s.topics.some(
              (t) =>
                t.exam === exam &&
                (t.id === id ||
                  (topic.sharedId && t.sharedId === topic.sharedId)),
            )
          )
            return {};
          const sharedId = topic.sharedId || topic.id;
          return {
            topics: [
              ...s.topics.map((t) => (t.id === id ? { ...t, sharedId } : t)),
              { ...topic, id: crypto.randomUUID(), sharedId, exam },
            ],
          };
        }),
      addSession: (subject, minutes) => {
        if (Number.isFinite(minutes) && minutes > 0 && minutes <= 1440)
          set((s) => ({
            sessions: [
              ...s.sessions,
              {
                id: crypto.randomUUID(),
                subject,
                minutes,
                date: new Date().toISOString(),
                exam: s.preferences.exam,
              },
            ],
            timer: { ...s.timer, elapsed: 0, startedAt: null },
          }));
      },
      restore: (data) => {
        if (isAppData(data)) {
          blockedStorage = false;
          set({
            storageError: null,
            tasks: data.tasks,
            topics: data.topics,
            sessions: data.sessions,
            preferences: data.preferences || defaultPreferences,
            reviews: data.reviews || [],
            mistakes: data.mistakes || [],
            timer: initialTimer,
          });
        }
      },
      reset: () => {
        blockedStorage = false;
        set({ ...initialData, timer: initialTimer, storageError: null });
      },
    }),
    {
      name: "aprovape-v1",
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: (s) => ({
        tasks: s.tasks,
        topics: s.topics,
        sessions: s.sessions,
        preferences: s.preferences,
        reviews: s.reviews,
        mistakes: s.mistakes,
        timer: s.timer,
      }),
      merge: (saved, current) => {
        if (!isAppData(saved))
          return {
            ...current,
            storageError:
              "Dados locais inválidos. O conteúdo original foi preservado no navegador; importe um backup válido para recuperar.",
          };
        return {
          ...current,
          tasks: saved.tasks,
          topics: saved.topics,
          sessions: saved.sessions,
          preferences: saved.preferences || defaultPreferences,
          reviews: saved.reviews || [],
          mistakes: saved.mistakes || [],
          timer:
            "timer" in saved && isTimer(saved.timer)
              ? saved.timer
              : initialTimer,
        };
      },
      onRehydrateStorage: () => {
        readingStorage = true;
        return (_state, error) => {
          useStudy.setState({
            hydrated: true,
            ...(error
              ? {
                  storageError:
                    "Não foi possível ler os dados locais. Importe um backup para recuperar.",
                }
              : {}),
          });
          readingStorage = false;
        };
      },
    },
  ),
);

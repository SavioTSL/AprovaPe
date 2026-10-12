"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppData, initialData, initialTimer, Timer } from "./data";
import { isAppData, isRecord, isTimer } from "./validation";
type Store = AppData & {
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
    if (blockedStorage) return;
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
    (set) => ({
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
        set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),
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
          timer:
            "timer" in saved && isTimer(saved.timer)
              ? saved.timer
              : initialTimer,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        useStudy.setState({
          hydrated: true,
          ...(error
            ? {
                storageError:
                  "Não foi possível ler os dados locais. Importe um backup para recuperar.",
              }
            : {}),
        });
      },
    },
  ),
);

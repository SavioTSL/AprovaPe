import type { AppData, Timer } from "./data.ts";
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const text = (v: unknown) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 500;
const list = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) &&
  v.length <= 20000 &&
  v.every(isRecord) &&
  new Set(v.map((x) => x.id)).size === v.length;
export function isAppData(v: unknown): v is AppData {
  if (!isRecord(v) || !list(v.tasks) || !list(v.topics) || !list(v.sessions))
    return false;
  return (
    v.tasks.every(
      (t) =>
        text(t.id) &&
        text(t.title) &&
        Number.isInteger(t.day) &&
        Number(t.day) >= 0 &&
        Number(t.day) <= 6 &&
        typeof t.done === "boolean",
    ) &&
    v.topics.every(
      (t) =>
        text(t.id) &&
        text(t.title) &&
        text(t.subject) &&
        text(t.exam) &&
        typeof t.done === "boolean" &&
        (t.sharedId === undefined || text(t.sharedId)),
    ) &&
    v.sessions.every(
      (t) =>
        text(t.id) &&
        text(t.subject) &&
        typeof t.minutes === "number" &&
        Number.isFinite(t.minutes) &&
        t.minutes > 0 &&
        t.minutes <= 1440 &&
        typeof t.date === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(t.date) &&
        Number.isFinite(Date.parse(t.date)),
    )
  );
}
export function isTimer(v: unknown): v is Timer {
  return (
    isRecord(v) &&
    text(v.subject) &&
    typeof v.elapsed === "number" &&
    Number.isFinite(v.elapsed) &&
    v.elapsed >= 0 &&
    (v.startedAt === null ||
      (typeof v.startedAt === "number" &&
        Number.isFinite(v.startedAt) &&
        v.startedAt > 0 &&
        v.startedAt <= Date.now()))
  );
}
export function parseBackup(value: unknown): AppData {
  if (!isRecord(value) || value.version !== 1 || !isAppData(value.data))
    throw new Error("Backup inválido ou versão incompatível.");
  return value.data;
}

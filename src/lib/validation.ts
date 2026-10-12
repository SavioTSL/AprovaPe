import type { AppData, Timer, Preferences } from "./data.ts";
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
const dateOnly = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const positive = (v: unknown, max = 1440) =>
  typeof v === "number" && Number.isInteger(v) && v > 0 && v <= max;
export function isPreferences(v: unknown): v is Preferences {
  return (
    isRecord(v) &&
    text(v.exam) &&
    positive(v.dailyGoal) &&
    positive(v.weeklyGoal, 10080) &&
    positive(v.minutesPerDay) &&
    positive(v.blockMinutes) &&
    Number(v.blockMinutes) <= Number(v.minutesPerDay) &&
    Array.isArray(v.availableDays) &&
    v.availableDays.length <= 7 &&
    new Set(v.availableDays).size === v.availableDays.length &&
    v.availableDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
}
export function isAppData(v: unknown): v is AppData {
  if (!isRecord(v) || !list(v.tasks) || !list(v.topics) || !list(v.sessions))
    return false;
  const topics = v.topics;
  const shared = new Map<string, Record<string, unknown>>();
  for (const topic of topics) {
    if (typeof topic.sharedId !== "string") continue;
    const previous = shared.get(topic.sharedId);
    if (
      previous &&
      (previous.subject !== topic.subject ||
        previous.title !== topic.title ||
        previous.done !== topic.done)
    )
      return false;
    shared.set(topic.sharedId, topic);
  }

  return (
    v.tasks.every(
      (t) =>
        text(t.id) &&
        text(t.title) &&
        Number.isInteger(t.day) &&
        Number(t.day) >= 0 &&
        Number(t.day) <= 6 &&
        typeof t.done === "boolean" &&
        (t.date === undefined || dateOnly(t.date)) &&
        (t.minutes === undefined || positive(t.minutes)) &&
        (t.subject === undefined || text(t.subject)) &&
        (t.exam === undefined || text(t.exam)) &&
        (t.planKey === undefined || text(t.planKey)),
    ) &&
    v.topics.every(
      (t) =>
        text(t.id) &&
        text(t.title) &&
        text(t.subject) &&
        text(t.exam) &&
        typeof t.done === "boolean" &&
        (t.sharedId === undefined || text(t.sharedId)) &&
        (t.notes === undefined ||
          (typeof t.notes === "string" && t.notes.length <= 10000)),
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
        Number.isFinite(Date.parse(t.date)) &&
        (t.exam === undefined || text(t.exam)),
    ) &&
    (v.preferences === undefined || isPreferences(v.preferences)) &&
    (v.reviews === undefined ||
      (list(v.reviews) &&
        v.reviews.every(
          (r) =>
            text(r.id) &&
            text(r.topicId) &&
            topics.some((t) => t.id === r.topicId) &&
            dateOnly(r.dueDate) &&
            Number.isInteger(r.step) &&
            Number(r.step) >= 0 &&
            Number(r.step) <= 5 &&
            (r.lastReviewed === undefined || dateOnly(r.lastReviewed)),
        ))) &&
    (v.mistakes === undefined ||
      (list(v.mistakes) &&
        v.mistakes.every(
          (m) =>
            text(m.id) &&
            text(m.subject) &&
            text(m.question) &&
            typeof m.explanation === "string" &&
            m.explanation.length <= 10000 &&
            typeof m.createdAt === "string" &&
            Number.isFinite(Date.parse(m.createdAt)) &&
            typeof m.resolved === "boolean",
        )))
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
  if (
    !isRecord(value) ||
    (value.version !== 1 && value.version !== 2) ||
    !isAppData(value.data)
  )
    throw new Error("Backup inválido ou versão incompatível.");
  return value.data;
}

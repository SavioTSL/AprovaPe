import type { Preferences, Session, Task, Topic } from "./data.ts";
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(key: string, days: number) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
export function minutesText(n: number) {
  return `${Math.floor(n / 60)}h ${String(n % 60).padStart(2, "0")}min`;
}
export function studyStats(sessions: Session[], now = new Date()) {
  const today = dateKey(now);
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekStart = dateKey(monday);
  const totals = new Map<string, number>();
  const subjects = new Map<string, number>();
  for (const s of sessions) {
    const key = dateKey(new Date(s.date));
    totals.set(key, (totals.get(key) || 0) + s.minutes);
    subjects.set(s.subject, (subjects.get(s.subject) || 0) + s.minutes);
  }
  let cursor = (totals.get(today) || 0) > 0 ? today : addDays(today, -1),
    streak = 0;
  while ((totals.get(cursor) || 0) > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return {
    total: sessions.reduce((n, s) => n + s.minutes, 0),
    today: totals.get(today) || 0,
    week: sessions
      .filter((s) => {
        const k = dateKey(new Date(s.date));
        return k >= weekStart && k <= today;
      })
      .reduce((n, s) => n + s.minutes, 0),
    streak,
    subjects: Array.from(subjects, ([subject, minutes]) => ({
      subject,
      minutes,
    })).sort((a, b) => b.minutes - a.minutes),
    days: Array.from({ length: 7 }, (_, i) => {
      const key = addDays(today, i - 6);
      return {
        date: key,
        day: new Date(`${key}T12:00:00`).toLocaleDateString("pt-BR", {
          weekday: "short",
        }),
        minutes: totals.get(key) || 0,
      };
    }),
  };
}
export function generatePlan(
  topics: Topic[],
  preferences: Preferences,
  existing: Task[],
  sessions: Session[],
  now = new Date(),
): Task[] {
  const bySubject = new Map(
    studyStats(sessions, now).subjects.map((s) => [s.subject, s.minutes]),
  );
  const pending = topics
    .filter((t) => t.exam === preferences.exam && !t.done)
    .sort(
      (a, b) =>
        (bySubject.get(a.subject) || 0) - (bySubject.get(b.subject) || 0),
    );
  if (!pending.length || !preferences.availableDays.length) return [];
  const keys = new Set(existing.map((t) => t.planKey));
  const tasks: Task[] = [];
  let index = 0;
  for (let offset = 0; offset < 7; offset++) {
    const key = addDays(dateKey(now), offset);
    const day = new Date(`${key}T12:00:00`).getDay();
    if (!preferences.availableDays.includes(day)) continue;
    let left = preferences.minutesPerDay,
      block = 0;
    while (left > 0) {
      const topic = pending[index++ % pending.length];
      const minutes = Math.min(left, preferences.blockMinutes);
      const planKey = `${preferences.exam}|${key}|${block++}`;
      left -= minutes;
      if (!keys.has(planKey))
        tasks.push({
          id: crypto.randomUUID(),
          title: topic.title,
          subject: topic.subject,
          exam: preferences.exam,
          date: key,
          day,
          minutes,
          done: false,
          planKey,
        });
    }
  }
  return tasks;
}
export const reviewIntervals = [1, 3, 7, 14, 30, 60];

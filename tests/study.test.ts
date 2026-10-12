import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  addDays,
  dateKey,
  generatePlan,
  studyStats,
} from "../src/lib/study.ts";
import { extractNotices, isOfficialUrl } from "../src/lib/editais.ts";
import { isAppData, parseBackup } from "../src/lib/validation.ts";
import type { Preferences, Topic } from "../src/lib/data.ts";
const prefs: Preferences = {
  exam: "PMPE — Soldado",
  dailyGoal: 60,
  weeklyGoal: 300,
  availableDays: [1, 2, 3, 4, 5],
  minutesPerDay: 65,
  blockMinutes: 30,
};
const topics: Topic[] = [
  { id: "a", subject: "Português", title: "A", exam: prefs.exam, done: false },
  { id: "b", subject: "Direito", title: "B", exam: prefs.exam, done: false },
  {
    id: "c",
    subject: "Física",
    title: "C",
    exam: "CBMPE — Soldado",
    done: false,
  },
  { id: "d", subject: "Português", title: "D", exam: prefs.exam, done: true },
];
const now = new Date("2026-10-12T12:00:00");
test("plan respects time, enabled days, exam and completed topics; no duplicates", () => {
  const tasks = generatePlan(
    topics,
    prefs,
    [],
    [{ id: "s", subject: "Português", minutes: 20, date: now.toISOString() }],
    now,
  );
  assert.equal(tasks.length, 15);
  assert.equal(tasks[0].subject, "Direito");
  assert.equal(
    tasks.reduce((n, t) => n + (t.minutes || 0), 0),
    325,
  );
  assert.ok(
    tasks.every(
      (t) =>
        t.exam === prefs.exam &&
        t.day >= 1 &&
        t.day <= 5 &&
        !["C", "D"].includes(t.title),
    ),
  );
  assert.equal(generatePlan(topics, prefs, tasks, [], now).length, 0);
  assert.equal(generatePlan([], prefs, [], [], now).length, 0);
  assert.equal(
    generatePlan(topics, { ...prefs, availableDays: [] }, [], [], now).length,
    0,
  );
});
test("local date math and streak do not confuse UTC boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  const sessions = [
    {
      id: "1",
      subject: "A",
      minutes: 30,
      date: new Date("2026-10-12T00:30:00").toISOString(),
    },
    {
      id: "2",
      subject: "A",
      minutes: 10,
      date: new Date("2026-10-11T20:00:00").toISOString(),
    },
  ];
  const stats = studyStats(sessions, now);
  assert.equal(stats.total, 40);
  assert.equal(stats.today, 30);
  assert.equal(stats.week, 30);
  assert.equal(stats.streak, 2);
  assert.equal(stats.days.at(-1)?.minutes, 30);
  assert.equal(dateKey(now), "2026-10-12");
});
test("v2 backup retains new data, legacy backup remains readable", () => {
  const data = {
    tasks: [],
    topics,
    sessions: [],
    preferences: prefs,
    reviews: [{ id: "r", topicId: "a", dueDate: "2026-10-13", step: 0 }],
    mistakes: [
      {
        id: "m",
        subject: "A",
        question: "Dúvida",
        explanation: "Correção",
        createdAt: now.toISOString(),
        resolved: false,
      },
    ],
  };
  assert.deepEqual(parseBackup({ version: 2, data }), data);
  assert.equal(
    isAppData({
      ...data,
      reviews: [{ ...data.reviews[0], topicId: "missing" }],
    }),
    false,
  );
  assert.equal(
    isAppData({ ...data, preferences: { ...prefs, blockMinutes: 100 } }),
    false,
  );
  assert.equal(
    isAppData({
      ...data,
      reviews: [{ ...data.reviews[0], dueDate: "2026-02-30" }],
    }),
    false,
  );
  assert.ok(
    parseBackup({ version: 1, data: { tasks: [], topics: [], sessions: [] } }),
  );
});
test("notice discovery keeps only official HTTPS candidates for the selected organization", () => {
  const html = `<a href="/edital-pmpe.pdf">Concurso PMPE — edital de abertura</a><a href="/edital-pmpe.pdf">Edital PMPE</a><a href="https://evil.example/pmpe">Edital PMPE</a><a href="javascript:alert(1)">Edital PMPE</a><a href="https://www.sds.pe.gov.br/pcpe.pdf">Edital PCPE</a>`;
  assert.deepEqual(
    extractNotices(html, "https://www.sds.pe.gov.br/", prefs.exam),
    [
      {
        title: "Edital PMPE",
        url: "https://www.sds.pe.gov.br/edital-pmpe.pdf",
      },
    ],
  );
  assert.equal(isOfficialUrl("https://www.sds.pe.gov.br@evil.example/"), false);
  assert.equal(isOfficialUrl("http://www.sds.pe.gov.br/"), false);
  assert.equal(isOfficialUrl("https://www.sds.pe.gov.br:9000/"), false);
  assert.equal(isOfficialUrl("https://www.sds.pe.gov.br/"), true);
});

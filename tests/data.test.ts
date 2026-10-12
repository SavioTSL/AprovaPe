import { strict as assert } from "node:assert";
import { test } from "node:test";
import { isAppData, isTimer, parseBackup } from "../src/lib/validation.ts";
const data = {
  tasks: [{ id: "task", title: "Estudar", day: 1, done: false }],
  topics: [
    {
      id: "topic",
      title: "Assunto",
      subject: "Disciplina",
      exam: "PMPE — Soldado",
      done: true,
    },
  ],
  sessions: [
    {
      id: "session",
      subject: "Disciplina",
      minutes: 25,
      date: "2026-10-12T10:00:00.000Z",
    },
  ],
};
test("backup round trip preserves actual progress and sessions", () => {
  assert.deepEqual(
    parseBackup(JSON.parse(JSON.stringify({ version: 1, data }))),
    data,
  );
});
test("rejects unsupported versions and malformed data", () => {
  assert.throws(() => parseBackup({ version: 2, data }));
  assert.throws(() =>
    parseBackup({
      version: 1,
      data: { ...data, tasks: [{ ...data.tasks[0], day: 7 }] },
    }),
  );
  assert.equal(
    isAppData({ ...data, topics: [...data.topics, ...data.topics] }),
    false,
  );
  for (const minutes of [-1, 0, Infinity, NaN, 1441])
    assert.equal(
      isAppData({ ...data, sessions: [{ ...data.sessions[0], minutes }] }),
      false,
    );
  assert.equal(
    isAppData({
      ...data,
      sessions: [{ ...data.sessions[0], date: "invalid" }],
    }),
    false,
  );
});
test("accepts empty real-user data and rejects broken timers", () => {
  assert.equal(isAppData({ tasks: [], topics: [], sessions: [] }), true);
  assert.equal(
    isTimer({ subject: "Português", elapsed: 60000, startedAt: Date.now() }),
    true,
  );
  assert.equal(
    isTimer({ subject: "Português", elapsed: -1, startedAt: null }),
    false,
  );
  assert.equal(
    isTimer({
      subject: "Português",
      elapsed: 0,
      startedAt: Date.now() + 100000,
    }),
    false,
  );
});

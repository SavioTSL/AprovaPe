"use client";
import { useState } from "react";
import { useStudy } from "@/lib/store";
import { dateKey } from "@/lib/study";
import { subjects } from "@/lib/data";
export function ManualSession() {
  const s = useStudy();
  const [subject, setSubject] = useState(s.timer.subject);
  const [minutes, setMinutes] = useState(30);
  const [date, setDate] = useState(dateKey(new Date()));
  const [message, setMessage] = useState("");
  return (
    <form
      className="panel p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const timestamp =
          date === dateKey(new Date())
            ? new Date()
            : new Date(`${date}T12:00:00`);
        if (
          !subject.trim() ||
          !Number.isInteger(minutes) ||
          minutes <= 0 ||
          minutes > 1440 ||
          !Number.isFinite(timestamp.getTime()) ||
          date > dateKey(new Date())
        ) {
          setMessage(
            "Confira a disciplina, a duração e a data. Não são permitidas datas futuras.",
          );
          return;
        }
        s.addManualSession(subject, minutes, timestamp.toISOString());
        setMessage(
          "Estudo registrado. Suas metas e estatísticas foram atualizadas.",
        );
      }}
    >
      <h3 className="font-bold text-lg">Estudou fora do cronômetro?</h3>
      <p className="muted text-sm">
        Registre o tempo real sem interromper uma sessão em andamento.
      </p>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="form-label">
          Disciplina do registro
          <input
            className="field"
            list="manual-subjects"
            required
            maxLength={500}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <datalist id="manual-subjects">
            {Array.from(
              new Set([...subjects, ...s.topics.map((t) => t.subject)]),
            ).map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
        <label className="form-label">
          Minutos estudados
          <input
            type="number"
            className="field"
            required
            min={1}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <label className="form-label">
          Data do estudo
          <input
            type="date"
            className="field"
            required
            max={dateKey(new Date())}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <button className="btn">Adicionar registro manual</button>
      <p role="status" className="text-sm text-blue-200">
        {message}
      </p>
    </form>
  );
}

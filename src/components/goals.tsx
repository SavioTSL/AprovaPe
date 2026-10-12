"use client";
import { useState } from "react";
import { Target, Check } from "lucide-react";
import { useStudy } from "@/lib/store";
import { dayNames, exams } from "@/lib/data";
import { studyStats, minutesText } from "@/lib/study";
export function Goals() {
  const s = useStudy();
  const [draft, setDraft] = useState({
    ...s.preferences,
    availableDays: [...s.preferences.availableDays],
  });
  const [message, setMessage] = useState("");
  const stats = studyStats(s.sessions);
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow">
          <Target size={16} />
          Sua rotina, seu ritmo
        </div>
        <h2>Um plano que cabe na sua vida.</h2>
        <p>
          Defina objetivos realistas. Seu progresso será calculado com as
          sessões que você registrar.
        </p>
      </section>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          ["Hoje", stats.today, s.preferences.dailyGoal],
          ["Esta semana", stats.week, s.preferences.weeklyGoal],
        ].map(([name, value, goal]) => (
          <section key={name} className="panel p-6">
            <p className="muted text-sm">{name}</p>
            <h3 className="text-2xl font-bold mt-2">
              {minutesText(Number(value))}{" "}
              <span className="text-sm muted">
                / {minutesText(Number(goal))}
              </span>
            </h3>
            <progress
              aria-label={`Meta ${name}`}
              className="goal-progress mt-5"
              value={Math.min(Number(value), Number(goal))}
              max={Number(goal)}
            />
          </section>
        ))}
      </div>
      <form
        className="panel p-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.availableDays.length) {
            setMessage("Selecione pelo menos um dia disponível.");
            return;
          }
          if (draft.blockMinutes > draft.minutesPerDay) {
            setMessage("O bloco deve caber no tempo diário disponível.");
            return;
          }
          s.updatePreferences(draft);
          setMessage(
            "Preferências salvas. Seu cronograma pode ser gerado no Planejamento.",
          );
        }}
      >
        <h3 className="font-bold text-xl">Personalize sua preparação</h3>
        <label className="form-label">
          Concurso principal
          <select
            className="field"
            value={draft.exam}
            onChange={(e) => setDraft({ ...draft, exam: e.target.value })}
          >
            {exams.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ["dailyGoal", "Meta diária (min)", 1440],
            ["weeklyGoal", "Meta semanal (min)", 10080],
            ["minutesPerDay", "Tempo disponível por dia (min)", 1440],
            ["blockMinutes", "Duração de cada bloco (min)", 1440],
          ].map(([key, label, max]) => (
            <label key={key} className="form-label">
              {label}
              <input
                className="field"
                type="number"
                min={1}
                max={Number(max)}
                required
                value={draft[key as "dailyGoal"]}
                onChange={(e) =>
                  setDraft({ ...draft, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
        </div>
        <fieldset>
          <legend className="form-label mb-3">Dias disponíveis</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <label
                key={day}
                className={`day-choice ${draft.availableDays.includes(day) ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={draft.availableDays.includes(day)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      availableDays: e.target.checked
                        ? [...draft.availableDays, day]
                        : draft.availableDays.filter((d) => d !== day),
                    })
                  }
                />
                {dayNames[day].slice(0, 3)}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn inline-flex items-center gap-2">
          <Check size={18} />
          Salvar preferências
        </button>
        <p role="status" className="text-sm text-blue-200">
          {message}
        </p>
      </form>
    </>
  );
}

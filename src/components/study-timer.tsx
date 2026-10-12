"use client";
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { useStudy } from "@/lib/store";
import { subjects } from "@/lib/data";
import { ManualSession } from "./manual-session";
export function StudyTimer() {
  const s = useStudy();
  const [now, setNow] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.floor(
    (s.timer.elapsed +
      (s.timer.startedAt
        ? Math.max(0, (now || Date.now()) - s.timer.startedAt)
        : 0)) /
      1000,
  );
  function pause() {
    s.setTimer({
      ...s.timer,
      elapsed:
        s.timer.elapsed +
        (s.timer.startedAt ? Math.max(0, Date.now() - s.timer.startedAt) : 0),
      startedAt: null,
    });
  }
  function save() {
    if (seconds < 60) {
      setMessage("Complete pelo menos um minuto para registrar.");
      return;
    }
    if (seconds > 86400) {
      pause();
      setMessage("A sessão ultrapassou 24 horas. Reinicie o cronômetro.");
      return;
    }
    s.addSession(s.timer.subject, Math.floor(seconds / 60));
    setMessage("Sessão registrada no seu histórico.");
  }
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="panel p-6 lg:p-10 text-center">
          <p className="kicker">Um passo mais perto da aprovação</p>
          <h2 className="text-xl font-bold mt-3">Sessão de foco</h2>
          <div aria-label="Tempo de estudo" className="timer-digits my-10">
            {[
              Math.floor(seconds / 3600),
              Math.floor((seconds % 3600) / 60),
              seconds % 60,
            ]
              .map((n) => String(n).padStart(2, "0"))
              .join(":")}
          </div>
          <label
            className="block text-left text-sm muted mb-2"
            htmlFor="timer-subject"
          >
            Disciplina
          </label>
          <select
            id="timer-subject"
            className="field mb-6"
            disabled={seconds > 0 || s.timer.startedAt !== null}
            value={s.timer.subject}
            onChange={(e) =>
              s.setTimer({ ...s.timer, subject: e.target.value })
            }
          >
            {Array.from(
              new Set([
                ...subjects,
                ...s.topics.map((t) => t.subject),
                s.timer.subject,
              ]),
            ).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              className="btn flex gap-2 items-center"
              onClick={() => {
                setMessage("");
                if (s.timer.startedAt) pause();
                else {
                  setNow(Date.now());
                  s.setTimer({ ...s.timer, startedAt: Date.now() });
                }
              }}
            >
              {s.timer.startedAt ? <Pause size={18} /> : <Play size={18} />}
              {s.timer.startedAt ? "Pausar" : "Iniciar"}
            </button>
            <button
              className="btn-alt"
              aria-label="Reiniciar cronômetro"
              onClick={() => {
                if (!seconds || confirm("Descartar o tempo desta sessão?"))
                  s.setTimer({ ...s.timer, elapsed: 0, startedAt: null });
              }}
            >
              <RotateCcw size={18} />
            </button>
            <button className="btn-alt" onClick={save}>
              Registrar sessão
            </button>
          </div>
          <p role="status" className="text-blue-200 text-sm mt-4">
            {message}
          </p>
          <p className="muted text-xs mt-5">
            O tempo continua ao navegar ou atualizar. Pause durante os
            intervalos. O registro considera minutos completos.
          </p>
        </section>
        <section className="panel p-5">
          <h3 className="font-bold mb-4">Histórico de sessões</h3>
          <div className="space-y-3 max-h-[440px] overflow-auto">
            {[...s.sessions]
              .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
              .map((x) => (
                <div
                  key={x.id}
                  className="flex justify-between gap-3 session-row rounded-xl p-3"
                >
                  <div>
                    <p className="font-semibold text-sm">{x.subject}</p>
                    <p className="muted text-xs">
                      {new Date(x.date).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <strong className="text-blue-300 whitespace-nowrap">
                    {x.minutes} min
                  </strong>
                  <button
                    className="muted"
                    aria-label={`Excluir sessão de ${x.subject}`}
                    onClick={() => {
                      if (
                        confirm(
                          "Excluir esta sessão? As estatísticas serão recalculadas.",
                        )
                      )
                        s.removeSession(x.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            {!s.sessions.length && (
              <div className="empty-state">
                <p>Nenhuma sessão registrada</p>
                <span>Inicie seu primeiro estudo. Cada minuto conta.</span>
              </div>
            )}
          </div>
        </section>
      </div>
      <ManualSession />
    </>
  );
}

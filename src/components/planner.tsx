"use client";
import { useState } from "react";
import { CalendarDays, Plus, Trash2, WandSparkles } from "lucide-react";
import { dayNames } from "@/lib/data";
import { useStudy } from "@/lib/store";
import { dateKey, addDays } from "@/lib/study";
export function Planner() {
  const s = useStudy();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDay, setTaskDay] = useState(new Date().getDay());
  const [all, setAll] = useState(false);
  const [message, setMessage] = useState("");
  const today = dateKey(new Date());
  const end = addDays(today, 6);
  const visible = s.tasks.filter(
    (t) =>
      all ||
      ((!t.exam || t.exam === s.preferences.exam) &&
        (!t.date || (t.date >= today && t.date <= end))),
  );
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow">
          <CalendarDays size={16} />
          Planeje. Execute. Evolua.
        </div>
        <h2>Sua semana com direção.</h2>
        <p>
          Distribua os assuntos pendentes do seu concurso em blocos que cabem
          nos dias disponíveis.
        </p>
      </section>
      <section className="panel p-6 space-y-4">
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <div>
            <h3 className="font-bold text-lg">Cronograma automático</h3>
            <p className="muted text-sm mt-2">
              {s.preferences.exam} · {s.preferences.minutesPerDay} min/dia ·
              blocos de {s.preferences.blockMinutes} min
            </p>
          </div>
          <button
            className="btn inline-flex gap-2 items-center"
            onClick={() => {
              if (
                !s.topics.some((t) => t.exam === s.preferences.exam && !t.done)
              ) {
                setMessage(
                  "Adicione assuntos pendentes ao roadmap do seu concurso principal antes de gerar.",
                );
                return;
              }
              if (
                !confirm(
                  "Gerar blocos para os próximos sete dias? Suas tarefas atuais serão preservadas.",
                )
              )
                return;
              const n = s.generateSchedule();
              setMessage(
                n
                  ? `${n} bloco(s) adicionado(s). Disciplinas com menos tempo registrado entram primeiro.`
                  : "Os blocos já existem ou não há dias disponíveis. Nenhuma tarefa foi duplicada.",
              );
            }}
          >
            <WandSparkles size={18} />
            Gerar cronograma
          </button>
        </div>
        <p className="muted text-xs">
          Configure sua disponibilidade em Metas. O plano usa seu roadmap, sem
          inventar conteúdo de edital. Gerar novamente não duplica os blocos
          existentes.
        </p>
        <p role="status" className="text-blue-200 text-sm">
          {message}
        </p>
      </section>
      <form
        className="panel p-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (taskTitle.trim()) {
            s.addTask(taskTitle.trim(), taskDay);
            setTaskTitle("");
          }
        }}
      >
        <h3 className="font-bold">Criar tarefa de estudo</h3>
        <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
          <input
            className="field"
            required
            aria-label="Título da tarefa"
            maxLength={500}
            placeholder="O que você vai estudar?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <select
            className="field"
            aria-label="Dia da semana"
            value={taskDay}
            onChange={(e) => setTaskDay(Number(e.target.value))}
          >
            {dayNames.map((d, i) => (
              <option value={i} key={d}>
                {d}
              </option>
            ))}
          </select>
          <button className="btn flex justify-center gap-2 items-center">
            <Plus size={18} />
            Adicionar
          </button>
        </div>
        <p className="text-xs muted">
          Tarefas manuais não têm data fixa. Você pode reiniciar seu checklist
          para uma nova semana.
        </p>
      </form>
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <label className="flex gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => setAll(e.target.checked)}
          />
          Mostrar histórico e todos os concursos
        </label>
        <button
          className="btn-alt text-sm"
          onClick={() => {
            if (
              confirm(
                "Reabrir somente as tarefas manuais? Blocos datados serão preservados.",
              )
            )
              s.resetWeek();
          }}
        >
          Reiniciar checklist manual
        </button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <section className="panel p-5" key={day}>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">{dayNames[day]}</h3>
              <span className="muted text-xs">
                {visible.filter((t) => t.day === day && t.done).length}/
                {visible.filter((t) => t.day === day).length}
              </span>
            </div>
            <div className="space-y-3">
              {visible
                .filter((t) => t.day === day)
                .map((t) => (
                  <div className="task-item" key={t.id}>
                    <div className="flex gap-3 items-start">
                      <input
                        type="checkbox"
                        aria-label={`Concluir ${t.title}`}
                        checked={t.done}
                        onChange={() => s.toggleTask(t.id)}
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm ${t.done ? "line-through muted" : ""}`}
                        >
                          {t.title}
                        </p>
                        {t.subject && (
                          <p className="text-xs text-blue-200 mt-2">
                            {t.subject} · {t.minutes} min
                          </p>
                        )}
                        {t.date && (
                          <p className="text-xs muted mt-1">
                            {new Date(`${t.date}T12:00:00`).toLocaleDateString(
                              "pt-BR",
                            )}{" "}
                            · {t.exam}
                          </p>
                        )}
                      </div>
                      <button
                        aria-label="Excluir tarefa"
                        className="muted"
                        onClick={() => {
                          if (confirm("Excluir esta tarefa?"))
                            s.removeTask(t.id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              {!visible.some((t) => t.day === day) && (
                <p className="muted text-sm py-3">Sem tarefas planejadas.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

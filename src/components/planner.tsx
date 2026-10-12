"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { dayNames } from "@/lib/data";
import { useStudy } from "@/lib/store";
export function Planner() {
  const s = useStudy();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDay, setTaskDay] = useState(new Date().getDay());
  return (
    <>
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
        <h2 className="font-bold text-lg">Criar tarefa de estudo</h2>
        <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
          <input
            className="field"
            required
            aria-label="Título da tarefa"
            maxLength={500}
            placeholder="Ex.: Resolver 20 questões de Português"
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
          <button className="btn flex justify-center items-center gap-2">
            <Plus size={18} />
            Adicionar
          </button>
        </div>
      </form>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <section className="panel p-4" key={day}>
            <h3 className="font-bold mb-4">{dayNames[day]}</h3>
            <div className="space-y-2">
              {s.tasks
                .filter((t) => t.day === day)
                .map((t) => (
                  <div
                    className="flex gap-2 items-center bg-[#0c1729] rounded-xl p-3"
                    key={t.id}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Concluir ${t.title}`}
                      checked={t.done}
                      onChange={() => s.toggleTask(t.id)}
                    />
                    <span
                      className={`flex-1 text-sm ${t.done ? "line-through muted" : ""}`}
                    >
                      {t.title}
                    </span>
                    <button
                      onClick={() => s.removeTask(t.id)}
                      aria-label="Excluir tarefa"
                      className="muted"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              {!s.tasks.some((t) => t.day === day) && (
                <p className="muted text-sm">Dia livre.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

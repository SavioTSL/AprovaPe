"use client";
import { useState } from "react";
import { RotateCcw, Trash2, BookOpen } from "lucide-react";
import { useStudy } from "@/lib/store";
import { dateKey } from "@/lib/study";
export function Reviews() {
  const s = useStudy();
  const [all, setAll] = useState(false);
  const today = dateKey(new Date());
  const due = s.reviews.filter((r) => r.dueDate <= today);
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow">
          <RotateCcw size={16} />
          Retenha o que aprendeu
        </div>
        <h2>Aprender. Revisar. Lembrar.</h2>
        <p>
          Adicione assuntos pelo roadmap. Os intervalos são 1, 3, 7, 14, 30 e 60
          dias. Se esquecer, a próxima revisão volta para amanhã.
        </p>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="badge">{due.length} revisão(ões) pendente(s)</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => setAll(e.target.checked)}
          />
          Mostrar próximas revisões
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {s.reviews
          .filter((r) => all || r.dueDate <= today)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((r) => {
            const topic = s.topics.find((t) => t.id === r.topicId);
            if (!topic) return null;
            const isDue = r.dueDate <= today;
            return (
              <article className="panel p-5 space-y-4" key={r.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="kicker">{topic.subject}</p>
                    <h3 className="font-bold text-lg mt-2">{topic.title}</h3>
                    <p className="muted text-xs mt-2">
                      {topic.exam} ·{" "}
                      {new Date(`${r.dueDate}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <button
                    aria-label={`Remover revisão ${topic.title}`}
                    className="muted"
                    onClick={() => {
                      if (confirm("Remover esta revisão?"))
                        s.removeReview(r.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {topic.notes && (
                  <details className="notes">
                    <summary>Consultar minhas anotações</summary>
                    <p className="whitespace-pre-wrap mt-3">{topic.notes}</p>
                  </details>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={!isDue}
                    className="btn"
                    onClick={() => s.completeReview(r.id, true)}
                  >
                    Lembrei
                  </button>
                  <button
                    disabled={!isDue}
                    className="btn-alt"
                    onClick={() => s.completeReview(r.id, false)}
                  >
                    Preciso revisar
                  </button>
                </div>
              </article>
            );
          })}
      </div>
      {!(all ? s.reviews : due).length && (
        <div className="empty-state panel">
          <BookOpen size={28} />
          <h3>
            {s.reviews.length
              ? "Tudo em dia por aqui"
              : "Ainda não há revisões"}
          </h3>
          <p>
            {s.reviews.length
              ? "Marque a opção acima para consultar as próximas datas."
              : "No roadmap, use “Agendar revisão” nos assuntos que você estudou."}
          </p>
        </div>
      )}
    </>
  );
}

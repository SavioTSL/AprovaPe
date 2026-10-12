"use client";
import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { exams, subjects } from "@/lib/data";
import { useStudy } from "@/lib/store";
export function Roadmap() {
  const s = useStudy();
  const [exam, setExam] = useState(exams[0]);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicSubject, setTopicSubject] = useState(subjects[0]);
  return (
    <>
      <div className="panel p-5">
        <p className="kicker mb-2">Trilhas personalizadas</p>
        <h2 className="text-xl font-bold mb-2">Seu caminho de aprendizado</h2>
        <p className="muted text-sm mb-4">
          Construa sua trilha a partir do edital oficial. Nenhum conteúdo
          programático foi pré-preenchido sem verificação. As disciplinas abaixo
          são categorias livres de organização.
        </p>
        <select
          className="field max-w-md"
          aria-label="Concurso"
          value={exam}
          onChange={(e) => setExam(e.target.value)}
        >
          {exams.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {!s.topics.some((t) => t.exam === exam) && (
        <div className="empty-state panel">
          <BookOpen size={28} />
          <h3>Sua trilha começa aqui</h3>
          <p>
            Adicione os assuntos do seu edital. Compartilhe tópicos entre
            concursos para aproveitar o mesmo progresso.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from(
          new Set(
            s.topics.filter((t) => t.exam === exam).map((t) => t.subject),
          ),
        ).map((sub) => {
          const items = s.topics.filter(
            (t) => t.exam === exam && t.subject === sub,
          );
          const count = items.filter((t) => t.done).length;
          return (
            <section className="panel p-5" key={sub}>
              <div className="flex justify-between gap-3 mb-3">
                <h3 className="font-bold">{sub}</h3>
                <span className="muted text-sm">
                  {count}/{items.length}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full mb-5">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(count / items.length) * 100}%` }}
                />
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className="flex gap-2 items-center bg-[#0c1729] p-3 rounded-xl"
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => s.toggleTopic(t.id)}
                      aria-label={`Concluir ${t.title}`}
                    />
                    <span
                      className={`flex-1 text-sm ${t.done ? "line-through muted" : ""}`}
                    >
                      {t.title}
                    </span>
                    <select
                      aria-label={`Compartilhar ${t.title} com outro concurso`}
                      className="share-select"
                      value=""
                      onChange={(e) => s.shareTopic(t.id, e.target.value)}
                    >
                      <option value="">Compartilhar</option>
                      {exams
                        .filter((x) => x !== exam)
                        .map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                    </select>
                    <button
                      aria-label="Excluir tópico"
                      className="muted"
                      onClick={() => s.removeTopic(t.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <form
        className="panel p-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (topicTitle.trim() && topicSubject.trim()) {
            s.addTopic(topicSubject.trim(), topicTitle.trim(), exam);
            setTopicTitle("");
          }
        }}
      >
        <h3 className="font-bold">Adicionar tópico ao roadmap</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <input
              className="field"
              required
              maxLength={500}
              aria-label="Disciplina do tópico"
              list="subject-options"
              value={topicSubject}
              onChange={(e) => setTopicSubject(e.target.value)}
              placeholder="Disciplina do edital"
            />
            <datalist id="subject-options">
              {Array.from(
                new Set([...subjects, ...s.topics.map((t) => t.subject)]),
              ).map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>
          <input
            className="field"
            required
            aria-label="Nome do assunto"
            maxLength={500}
            placeholder="Nome do assunto"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
          />
          <button className="btn flex justify-center gap-2 items-center">
            <Plus size={18} />
            Adicionar tópico
          </button>
        </div>
      </form>
    </>
  );
}

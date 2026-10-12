"use client";
import { useState } from "react";
import { NotebookPen, Trash2 } from "lucide-react";
import { useStudy } from "@/lib/store";
export function Mistakes() {
  const s = useStudy();
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const items = s.mistakes.filter(
    (m) =>
      (!pending || !m.resolved) &&
      `${m.subject} ${m.question} ${m.explanation}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow">
          <NotebookPen size={16} />
          Transforme erros em aprendizado
        </div>
        <h2>Seu caderno de erros.</h2>
        <p>
          Registre a dúvida e o raciocínio correto com suas palavras. Marque
          como dominado quando conseguir explicar sem consultar.
        </p>
      </section>
      <form
        className="panel p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !question.trim()) return;
          s.addMistake(subject, question, explanation);
          setQuestion("");
          setExplanation("");
        }}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <label className="form-label">
            Disciplina
            <input
              className="field"
              required
              maxLength={500}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="form-label">
            Questão ou dificuldade
            <input
              className="field"
              required
              maxLength={500}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </label>
        </div>
        <label className="form-label">
          Correção e explicação
          <textarea
            className="field"
            rows={3}
            maxLength={10000}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Por que errei? Qual é o raciocínio correto?"
          />
        </label>
        <button className="btn">Salvar no caderno</button>
      </form>
      <div className="flex flex-wrap gap-4">
        <input
          className="field flex-1"
          aria-label="Buscar no caderno"
          placeholder="Buscar disciplina ou dificuldade…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pending}
            onChange={(e) => setPending(e.target.checked)}
          />
          Só pendentes
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((m) => (
          <article className="panel p-5" key={m.id}>
            <div className="flex justify-between gap-3">
              <div>
                <p className="kicker">{m.subject}</p>
                <h3 className="font-bold mt-2">{m.question}</h3>
              </div>
              <button
                className="muted"
                aria-label={`Excluir erro ${m.question}`}
                onClick={() => {
                  if (confirm("Excluir este registro?")) s.removeMistake(m.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-sm muted whitespace-pre-wrap my-4">
              {m.explanation || "Adicione a explicação durante sua revisão."}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={m.resolved}
                onChange={() => s.toggleMistake(m.id)}
              />
              Já domino este assunto
            </label>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state panel">
          <NotebookPen size={28} />
          <h3>
            {s.mistakes.length
              ? "Nenhum registro neste filtro"
              : "Seu caderno está vazio"}
          </h3>
          <p>Ao errar uma questão, registre aqui o aprendizado.</p>
        </div>
      )}
    </>
  );
}

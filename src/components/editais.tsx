"use client";
import { useEffect, useRef, useState } from "react";
import { FileSearch, ExternalLink, Search } from "lucide-react";
import { useStudy } from "@/lib/store";
import { exams } from "@/lib/data";
import { isOfficialUrl, officialSources, type Notice } from "@/lib/editais";
import { PdfImporter } from "./pdf-importer";
type Result = { notices: Notice[]; message: string; checkedAt: string };
export function Editais() {
  const s = useStudy();
  const [exam, setExam] = useState(s.preferences.exam);
  const [pdfDirty, setPdfDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function search() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(
        `/api/editais?exam=${encodeURIComponent(exam)}`,
        { signal: abort.signal },
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.notices)) throw new Error();
      setResult(data);
    } catch {
      if (!abort.signal.aborted)
        setError(
          "A consulta não pôde ser concluída. Você pode enviar o PDF diretamente abaixo ou acessar as fontes oficiais.",
        );
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  const lines = content.split("\n").filter((x) => x.trim());
  const parsed = lines.map((line) => {
    const [subject, ...title] = line.split("|");
    return { subject: subject.trim(), title: title.join("|").trim() };
  });
  const valid =
    parsed.length > 0 &&
    parsed.length <= 500 &&
    parsed.every(
      (t) =>
        t.subject.length > 0 &&
        t.subject.length <= 500 &&
        t.title.length > 0 &&
        t.title.length <= 500,
    );
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow">
          <FileSearch size={16} />
          Comece pela fonte certa
        </div>
        <h2>Escolha seu concurso.</h2>
        <p>
          Envie seu PDF ou consulte publicações nos portais oficiais. Encontrar
          um link não confirma que ele seja o edital mais recente ou o documento
          do seu cargo.
        </p>
      </section>
      <section className="panel p-6 space-y-4">
        <div className="grid md:grid-cols-[1fr_auto] gap-3">
          <label className="form-label">
            Concurso para consulta
            <select
              className="field"
              value={exam}
              onChange={(e) => {
                if (
                  (content || pdfDirty) &&
                  !confirm(
                    "Trocar de concurso e descartar a prévia ainda não importada? Seu roadmap será preservado.",
                  )
                )
                  return;
                setPdfDirty(false);
                controller.current?.abort();
                setBusy(false);
                setExam(e.target.value);
                setResult(null);
                setError("");
                setContent("");
                setSource("");
                setStatus("");
              }}
            >
              {exams.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button
            disabled={busy}
            className="btn self-end inline-flex justify-center gap-2 items-center"
            onClick={search}
          >
            <Search size={18} />
            {busy ? "Consultando fontes…" : "Buscar publicações"}
          </button>
        </div>
        <div role="status" className="text-sm muted">
          {error || result?.message}
        </div>
        {result && (
          <p className="muted text-xs">
            Consulta: {new Date(result.checkedAt).toLocaleString("pt-BR")}
          </p>
        )}
        {result?.notices.map((n) => (
          <article className="notice-item" key={n.url}>
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-200"
            >
              {n.title} <ExternalLink size={14} className="inline" />
            </a>
            <button
              className="btn-alt mt-3"
              onClick={() => {
                setSource(n.url);
                setStatus(
                  "Fonte selecionada. Confira o documento antes de importar o conteúdo.",
                );
              }}
            >
              Usar como referência
            </button>
          </article>
        ))}
        {result && !result.notices.length && (
          <p className="text-sm muted">
            Nenhuma publicação foi identificada automaticamente nesta consulta.
            Isso não significa que não exista edital.
          </p>
        )}
        <div className="grid md:grid-cols-3 gap-3">
          {officialSources.map((source) => (
            <a
              key={source.url}
              className="source-card"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.name}
              <ExternalLink size={18} />
            </a>
          ))}
        </div>
      </section>
      <PdfImporter
        key={exam}
        exam={exam}
        onDirtyChange={setPdfDirty}
        onImported={() => {
          s.updatePreferences({ ...s.preferences, exam });
          window.location.hash = "roadmap";
        }}
      />
      <form
        className="panel p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          if (source && !isOfficialUrl(source)) {
            setStatus(
              "Use um endereço HTTPS de um dos portais oficiais indicados.",
            );
            return;
          }
          if (
            !confirm(
              `Adicionar ${parsed.length} assunto(s) ao roadmap de ${exam}? Os assuntos existentes serão preservados.`,
            )
          )
            return;
          const added = s.importTopics(parsed, exam, source);
          setStatus(
            `${added} assunto(s) novo(s) adicionado(s). Duplicados foram ignorados. Se informada, a referência foi salva nas anotações dos novos assuntos.`,
          );
          setContent("");
        }}
      >
        <h3 className="font-bold text-xl">
          Importar conteúdo conferido em lote
        </h3>
        <p className="muted text-sm">
          Você também pode colar o conteúdo conferido, sem enviar PDF. Organize
          uma linha por assunto no formato Disciplina | Assunto. O texto abaixo
          será pré-visualizado antes de entrar no seu roadmap.
        </p>
        <label className="form-label">
          Referência oficial (opcional)
          <input
            className="field"
            type="url"
            maxLength={2048}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="form-label">
          Conteúdo do edital
          <textarea
            className="field"
            rows={7}
            maxLength={100000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Disciplina | Assunto\nDisciplina | Outro assunto"}
          />
        </label>
        {lines.length > 0 && (
          <div className="notice-item">
            <p className="font-bold text-sm">
              Prévia · {parsed.length} assunto(s)
            </p>
            {!valid && (
              <p className="text-amber-200 text-sm mt-2">
                Use Disciplina | Assunto em todas as linhas (até 500 assuntos).
              </p>
            )}
            <ul className="text-sm muted mt-3 space-y-2">
              {parsed.slice(0, 8).map((t, i) => (
                <li key={i}>
                  {t.subject} → {t.title || "Assunto ausente"}
                </li>
              ))}
            </ul>
            {parsed.length > 8 && (
              <p className="text-xs muted mt-2">
                E mais {parsed.length - 8} assunto(s).
              </p>
            )}
          </div>
        )}
        <button disabled={!valid} className="btn">
          Importar para o roadmap
        </button>
        <p role="status" className="text-sm text-blue-200">
          {status}
        </p>
      </form>
    </>
  );
}

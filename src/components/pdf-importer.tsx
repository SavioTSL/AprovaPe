"use client";
import { useEffect, useRef, useState } from "react";
import { FileUp, Check, Trash2, FileText } from "lucide-react";
import { useStudy } from "@/lib/store";
import { readPdf } from "@/lib/pdf-reader";
import { suggestSyllabus, type SuggestedTopic } from "@/lib/syllabus";
type Row = SuggestedTopic & { id: number; selected: boolean };
export function PdfImporter({
  exam,
  onImported,
  onDirtyChange,
}: {
  exam: string;
  onImported: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const s = useStudy();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [pages, setPages] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const task = useRef<{ destroy: () => Promise<void> } | null>(null);
  const run = useRef(0);
  const sequence = useRef(0);
  useEffect(
    () => () => {
      run.current++;
      void task.current?.destroy();
    },
    [],
  );
  function cancel() {
    run.current++;
    void task.current?.destroy();
    task.current = null;
    setBusy(false);
    setProgress("Leitura cancelada.");
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      (text || rows.length) &&
      !confirm(
        "Substituir esta prévia por outro PDF? Os assuntos já importados serão preservados.",
      )
    )
      return;
    cancel();
    const id = ++run.current;
    setBusy(true);
    setError("");
    setStatus("");
    setProgress("Abrindo PDF…");
    try {
      const pdf = await readPdf(
        file,
        (page, total) => {
          if (run.current === id)
            setProgress(`Lendo página ${page} de ${total}…`);
        },
        (loading) => {
          if (run.current !== id) void loading.destroy();
          else task.current = loading;
        },
      );
      if (run.current !== id) return;
      onDirtyChange(true);
      setText(pdf.text);
      setName(pdf.name);
      setPages(pdf.pages);
      setConfirmed(false);
      onDirtyChange(true);
      const suggestions = suggestSyllabus(pdf.text);
      setRows(
        suggestions.topics.map((t) => ({
          ...t,
          id: sequence.current++,
          selected: true,
        })),
      );
      setWarnings(suggestions.warnings);
      setProgress("PDF lido. Confira o texto e os assuntos sugeridos.");
    } catch (e) {
      if (run.current === id)
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível ler o PDF. Tente outro arquivo.",
        );
    } finally {
      if (run.current === id) {
        setBusy(false);
        task.current = null;
      }
      if (input.current) input.current.value = "";
    }
  }
  const selected = rows.filter((r) => r.selected);
  const valid =
    selected.length > 0 &&
    selected.length <= 500 &&
    selected.every(
      (r) =>
        r.subject.trim().length > 0 &&
        r.subject.length <= 500 &&
        r.title.trim().length > 0 &&
        r.title.length <= 500,
    );
  function edit(id: number, key: "subject" | "title", value: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    setConfirmed(false);
    onDirtyChange(true);
    setStatus("");
  }
  return (
    <section className="panel p-6 space-y-5" aria-busy={busy}>
      <div className="flex items-start gap-3">
        <span className="metric-icon">
          <FileUp size={23} />
        </span>
        <div>
          <h3 className="font-bold text-xl">Importar edital em PDF</h3>
          <p className="muted text-sm mt-2">
            Envie o arquivo do seu computador. A leitura acontece no navegador,
            sem depender da busca e sem enviar o PDF a um servidor.
          </p>
        </div>
      </div>
      <div className="pdf-dropzone">
        <FileText size={30} />
        <p className="font-semibold">
          Selecione seu edital ou anexo de disciplinas
        </p>
        <p className="muted text-xs">
          PDF com texto selecionável · até 25 MB e 150 páginas
        </p>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          aria-label="Selecionar edital PDF"
          disabled={busy}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>
      <div role="status" className="text-sm text-blue-200">
        {progress}
      </div>
      {busy && (
        <button className="btn-alt" onClick={cancel}>
          Cancelar leitura
        </button>
      )}
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {name && (
        <div className="notice-item text-sm break-all">
          <strong>{name}</strong>
          <p className="muted text-xs mt-2">
            {pages} página(s) · destino: {exam}
          </p>
        </div>
      )}
      {text && (
        <>
          <details className="notes">
            <summary>Conferir e editar o texto extraído</summary>
            <p className="muted text-xs my-3">
              Se o edital contém vários cargos, mantenha somente o conteúdo do
              cargo escolhido. Colunas e tabelas podem alterar a ordem do texto.
              A organização é uma sugestão, não uma validação oficial.
            </p>
            <textarea
              className="field"
              rows={12}
              maxLength={500000}
              aria-label="Texto extraído do PDF"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setConfirmed(false);
                onDirtyChange(true);
              }}
            />
            <button
              disabled={busy}
              className="btn-alt mt-3"
              onClick={() => {
                const result = suggestSyllabus(text);
                setRows(
                  result.topics.map((t) => ({
                    ...t,
                    id: sequence.current++,
                    selected: true,
                  })),
                );
                setWarnings(result.warnings);
                setConfirmed(false);
                onDirtyChange(true);
                setStatus("");
              }}
            >
              Reorganizar assuntos pelo texto
            </button>
          </details>
          {warnings.length > 0 && (
            <div className="error-banner text-sm">
              <ul className="space-y-2">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h4 className="font-bold">
              Prévia editável · {selected.length} assunto(s) selecionado(s)
            </h4>
            <button
              className="btn-alt text-xs"
              onClick={() => {
                setRows(
                  rows.map((r) => ({
                    ...r,
                    selected: !rows.every((x) => x.selected),
                  })),
                );
                setConfirmed(false);
                onDirtyChange(true);
              }}
            >
              {rows.every((r) => r.selected) && rows.length
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </button>
          </div>
          <div className="pdf-preview space-y-3">
            {rows.map((row, index) => (
              <article className="topic-item" key={row.id}>
                <div className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar assunto ${index + 1}`}
                    checked={row.selected}
                    onChange={(e) => {
                      setRows(
                        rows.map((r) =>
                          r.id === row.id
                            ? { ...r, selected: e.target.checked }
                            : r,
                        ),
                      );
                      setConfirmed(false);
                      onDirtyChange(true);
                    }}
                  />
                  <div className="flex-1 min-w-0 space-y-3">
                    <label className="form-label">
                      Disciplina {index + 1}
                      <input
                        className="field"
                        maxLength={500}
                        aria-label={`Disciplina ${index + 1}`}
                        value={row.subject}
                        onChange={(e) =>
                          edit(row.id, "subject", e.target.value)
                        }
                      />
                    </label>
                    <label className="form-label">
                      Assunto {index + 1}
                      <textarea
                        className="field"
                        rows={2}
                        maxLength={500}
                        aria-label={`Assunto ${index + 1}`}
                        value={row.title}
                        onChange={(e) => edit(row.id, "title", e.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    aria-label={`Remover assunto ${index + 1}`}
                    className="muted"
                    onClick={() => {
                      setRows(rows.filter((r) => r.id !== row.id));
                      setConfirmed(false);
                      onDirtyChange(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <button
            className="btn-alt text-sm"
            disabled={rows.length >= 500}
            onClick={() => {
              setRows([
                ...rows,
                {
                  id: sequence.current++,
                  subject: "",
                  title: "",
                  selected: true,
                },
              ]);
              setConfirmed(false);
              onDirtyChange(true);
            }}
          >
            Adicionar assunto à prévia
          </button>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              Conferi o cargo, o concurso e os assuntos selecionados para{" "}
              <strong>{exam}</strong>.
            </span>
          </label>
          <button
            disabled={busy || !valid || !confirmed}
            className="btn inline-flex items-center gap-2"
            onClick={() => {
              if (
                !confirm(
                  `Importar ${selected.length} assunto(s) para ${exam}? Seu progresso existente será preservado.`,
                )
              )
                return;
              const added = s.importTopics(
                selected,
                exam,
                `PDF enviado: ${name.slice(0, 300)}`,
              );
              setStatus(
                `${added} assunto(s) novo(s) importado(s). Assuntos repetidos foram ignorados. A referência do PDF foi salva nas anotações.`,
              );
              setRows([]);
              setConfirmed(false);
              onDirtyChange(true);
              onDirtyChange(false);
            }}
          >
            <Check size={18} />
            Importar assuntos do PDF
          </button>
        </>
      )}
      <p role="status" className="text-sm text-blue-200">
        {status}
      </p>
      {status && (
        <button className="btn-alt" onClick={onImported}>
          Abrir meu roadmap
        </button>
      )}
    </section>
  );
}

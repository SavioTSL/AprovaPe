"use client";
import { useState } from "react";
import { ChartNoAxesCombined, Download } from "lucide-react";
import { useStudy } from "@/lib/store";
import { studyStats, minutesText, dateKey, addDays } from "@/lib/study";
export function Statistics() {
  const s = useStudy();
  const [range, setRange] = useState("all");
  const start =
    range === "all"
      ? "0000-00-00"
      : addDays(dateKey(new Date()), -(Number(range) - 1));
  const sessions = s.sessions.filter((x) => dateKey(new Date(x.date)) >= start);
  const stats = studyStats(sessions);
  function exportCSV() {
    const quote = (x: string) =>
      `"${(/^[\s]*[=+@-]/.test(x) ? "\'" + x : x).replace(/"/g, '""')}"`;
    const csv =
      "\ufeffData,Disciplina,Minutos\n" +
      sessions
        .map((x) =>
          [
            quote(new Date(x.date).toLocaleString("pt-BR")),
            quote(x.subject),
            x.minutes,
          ].join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "aprovape-sessoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow">
          <ChartNoAxesCombined size={16} />
          Veja a evolução real
        </div>
        <h2>Conheça seu ritmo.</h2>
        <p>
          Todos os valores vêm das suas sessões. Identifique disciplinas com
          pouca dedicação e ajuste o próximo ciclo.
        </p>
      </section>
      <div className="flex flex-wrap gap-3">
        <select
          className="field max-w-xs"
          aria-label="Período das estatísticas"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="all">Todo o histórico</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
        <button
          className="btn-alt inline-flex items-center gap-2"
          disabled={!sessions.length}
          onClick={exportCSV}
        >
          <Download size={16} />
          Exportar sessões CSV
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ["Tempo no período", minutesText(stats.total)],
          ["Sessões", String(sessions.length)],
          [
            "Média por sessão",
            sessions.length
              ? `${Math.round(stats.total / sessions.length)} min`
              : "—",
          ],
        ].map(([label, value]) => (
          <section className="panel p-5" key={label}>
            <p className="muted text-xs">{label}</p>
            <h3 className="text-2xl font-bold mt-3">{value}</h3>
          </section>
        ))}
      </div>
      <section className="panel p-6">
        <h3 className="font-bold text-xl mb-5">Dedicação por disciplina</h3>
        <div className="space-y-5">
          {stats.subjects.map((x) => (
            <div key={x.subject}>
              <div className="flex justify-between gap-3 mb-2">
                <span className="text-sm">{x.subject}</span>
                <strong className="text-sm text-blue-200 whitespace-nowrap">
                  {minutesText(x.minutes)}
                </strong>
              </div>
              <progress
                className="goal-progress"
                aria-label={`Tempo dedicado a ${x.subject}`}
                max={stats.total || 1}
                value={x.minutes}
              />
            </div>
          ))}
          {!sessions.length && (
            <div className="empty-state">
              <ChartNoAxesCombined size={28} />
              <h3>Sem sessões neste período</h3>
              <p>
                Registre seus estudos pelo cronômetro ou pelo formulário manual.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  Clock3,
  BookOpen,
  Flame,
  Target,
  RotateCcw,
  NotebookPen,
} from "lucide-react";
import { useStudy } from "@/lib/store";
import { dateKey, studyStats, minutesText } from "@/lib/study";
export type View =
  | "dashboard"
  | "roadmap"
  | "agenda"
  | "timer"
  | "backup"
  | "goals"
  | "reviews"
  | "mistakes"
  | "editais"
  | "statistics";
export function Dashboard({ navigate }: { navigate: (view: View) => void }) {
  const s = useStudy();
  const stats = studyStats(s.sessions);
  const today = dateKey(new Date());
  const topics = Array.from(
    new Map(s.topics.map((t) => [t.sharedId || t.id, t])).values(),
  );
  const completed = topics.filter((t) => t.done).length;
  const due = s.reviews.filter((r) => r.dueDate <= today).length;
  const tasks = s.tasks.filter(
    (t) =>
      !t.done &&
      (!t.exam || t.exam === s.preferences.exam) &&
      (t.date ? t.date <= today : t.day === new Date().getDay()),
  );
  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="eyebrow">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</div>
          <h2>
            Consistência hoje.
            <br />
            <span>Conquista amanhã.</span>
          </h2>
          <p>
            Seu plano, seu progresso e seu próximo passo.
            <br className="hidden md:block" /> Tudo no mesmo lugar.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="hero-button" onClick={() => navigate("timer")}>
              Começar a estudar <ArrowUpRight size={18} />
            </button>
            <button
              className="hero-secondary"
              onClick={() => navigate("editais")}
            >
              Encontrar meu edital
            </button>
          </div>
        </div>
        <div className="hero-goal">
          <div
            className="goal-ring"
            style={
              {
                "--progress": `${Math.min(100, (stats.today / s.preferences.dailyGoal) * 100)}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <Target size={24} />
              <strong>
                {Math.round((stats.today / s.preferences.dailyGoal) * 100)}%
              </strong>
              <span>da meta diária</span>
            </div>
          </div>
          <p>
            {minutesText(stats.today)} de {minutesText(s.preferences.dailyGoal)}
          </p>
          <button onClick={() => navigate("goals")}>
            Ajustar minhas metas →
          </button>
        </div>
      </section>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: "Tempo total",
            value: minutesText(stats.total),
            detail: `${s.sessions.length} sessões registradas`,
            Icon: Clock3,
          },
          {
            label: "Assuntos concluídos",
            value: `${completed}/${topics.length}`,
            detail: "Tópicos únicos entre concursos",
            Icon: BookOpen,
          },
          {
            label: "Nesta semana",
            value: minutesText(stats.week),
            detail: `Meta: ${minutesText(s.preferences.weeklyGoal)}`,
            Icon: Target,
          },
          {
            label: "Dias de constância",
            value: String(stats.streak),
            detail: "Dias seguidos com estudo registrado",
            Icon: Flame,
          },
        ].map(({ label, value, detail, Icon }) => (
          <section className="metric-card panel" key={label}>
            <div className="flex items-center justify-between gap-2">
              <p className="muted text-xs">{label}</p>
              <span className="metric-icon">
                <Icon size={18} />
              </span>
            </div>
            <h3>{value}</h3>
            <p className="muted text-xs leading-relaxed">{detail}</p>
          </section>
        ))}
      </div>
      <div className="grid xl:grid-cols-[1.25fr_1fr] gap-4">
        <section className="panel p-5 lg:p-6">
          <div className="flex justify-between items-center gap-3 mb-4">
            <div>
              <p className="kicker">Seu ritmo</p>
              <h3 className="font-bold text-lg mt-1">Últimos sete dias</h3>
            </div>
            <button
              className="text-blue-200 text-xs"
              onClick={() => navigate("statistics")}
            >
              Ver estatísticas →
            </button>
          </div>
          {!s.sessions.length && (
            <p className="muted text-sm mb-3">
              Registre sua primeira sessão para acompanhar sua evolução.
            </p>
          )}
          <div
            className="h-60"
            aria-label="Gráfico de minutos estudados nos últimos sete dias"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.days} margin={{ left: -20, right: 10 }}>
                <XAxis
                  dataKey="day"
                  stroke="#93a7c5"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke="#93a7c5"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: "#192d49" }}
                  contentStyle={{
                    background: "#111e33",
                    border: "1px solid #34445f",
                    borderRadius: 12,
                  }}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="minutes"
                  name="Minutos"
                  fill="#5b9cff"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className="notes mt-3">
            <summary>Ver dados do gráfico em texto</summary>
            <ul className="space-y-2 text-sm muted mt-3">
              {stats.days.map((d) => (
                <li key={d.date}>
                  {new Date(`${d.date}T12:00:00`).toLocaleDateString("pt-BR")}:{" "}
                  {d.minutes} min
                </li>
              ))}
            </ul>
          </details>
        </section>
        <section className="panel p-5 lg:p-6">
          <p className="kicker">Seu próximo passo</p>
          <h3 className="font-bold text-lg mt-1 mb-5">Foco de hoje</h3>
          <div className="space-y-3">
            {tasks.slice(0, 4).map((t) => (
              <label key={t.id} className="task-item flex gap-3 items-start">
                <input
                  type="checkbox"
                  aria-label={`Concluir ${t.title}`}
                  checked={t.done}
                  onChange={() => s.toggleTask(t.id)}
                />
                <span className="text-sm">
                  {t.title}
                  {t.subject && (
                    <small className="block muted mt-2">
                      {t.subject} · {t.minutes} min
                    </small>
                  )}
                </span>
              </label>
            ))}
            {!tasks.length && (
              <div className="empty-state">
                <BookOpen size={26} />
                <p>
                  {s.tasks.length
                    ? "Checklist de hoje em dia"
                    : "Dê direção à sua semana"}
                </p>
                <span>
                  {s.tasks.length
                    ? "Você pode adiantar um assunto ou fazer uma revisão."
                    : "Adicione os assuntos do edital e gere seu cronograma."}
                </span>
              </div>
            )}
          </div>
          <button
            className="text-blue-200 text-sm mt-4"
            onClick={() => navigate("agenda")}
          >
            Abrir planejamento →
          </button>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="quick-link" onClick={() => navigate("reviews")}>
              <RotateCcw size={19} />
              <strong>{due}</strong>
              <span>Revisões pendentes</span>
            </button>
            <button className="quick-link" onClick={() => navigate("mistakes")}>
              <NotebookPen size={19} />
              <strong>{s.mistakes.filter((m) => !m.resolved).length}</strong>
              <span>Erros para revisar</span>
            </button>
          </div>
        </section>
      </div>
      {!s.topics.length && (
        <section className="onboarding-strip">
          <div>
            <p className="font-bold">Comece pelo seu concurso</p>
            <p className="muted text-sm mt-1">
              Confira o edital, importe os assuntos e defina sua
              disponibilidade.
            </p>
          </div>
          <button className="btn" onClick={() => navigate("editais")}>
            Preparar minha trilha
          </button>
        </section>
      )}
    </>
  );
}

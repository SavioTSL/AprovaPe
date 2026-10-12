"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  ChartNoAxesCombined,
  CalendarDays,
  Clock3,
  Download,
  Route,
  GraduationCap,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";
import { useStudy } from "@/lib/store";
import { dayNames } from "@/lib/data";
import { StudyTimer } from "@/components/study-timer";
import { Roadmap } from "@/components/roadmap";
import { Planner } from "@/components/planner";
import { BackupPanel } from "@/components/backup-panel";
type View = "dashboard" | "roadmap" | "agenda" | "timer" | "backup";
const menu: [View, string, typeof BookOpen][] = [
  ["dashboard", "Visão geral", ChartNoAxesCombined],
  ["roadmap", "Roadmap", Route],
  ["agenda", "Planejamento", CalendarDays],
  ["timer", "Cronômetro", Clock3],
  ["backup", "Backup", Download],
];
function minutesText(n: number) {
  return `${Math.floor(n / 60)}h ${String(n % 60).padStart(2, "0")}min`;
}
export default function Home() {
  const s = useStudy();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<View>("dashboard");
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    void useStudy.persist.rehydrate();
  }, []);
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === "Escape") setMobile(false);
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    navRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const items = Array.from(
        navRef.current?.querySelectorAll<HTMLButtonElement>("button") || [],
      ).filter((e) => e.getClientRects().length > 0);
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [mobile]);
  const totalMinutes = s.sessions.reduce((a, b) => a + b.minutes, 0);
  const uniqueTopics = Array.from(
    new Map(s.topics.map((t) => [t.sharedId || t.id, t])).values(),
  );
  const done = uniqueTopics.filter((t) => t.done).length;
  const percent = uniqueTopics.length
    ? Math.round((done / uniqueTopics.length) * 100)
    : 0;
  const taskDone = s.tasks.filter((t) => t.done).length;
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - i));
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return {
          day: dayNames[date.getDay()].slice(0, 3),
          minutes: s.sessions
            .filter((x) => localDate(new Date(x.date)) === key)
            .reduce((a, x) => a + x.minutes, 0),
        };
      }),
    [s.sessions],
  );
  const navigate = (v: View) => {
    setView(v);
    setMobile(false);
  };
  if (!s.hydrated)
    return (
      <main className="min-h-screen grid place-items-center text-blue-200">
        Carregando AprovaPE...
      </main>
    );
  return (
    <div className="min-h-screen lg:flex">
      <aside
        ref={navRef}
        className={`${mobile ? "fixed inset-0 z-50 flex bg-[#080f1e]" : "hidden"} lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 flex-col border-r border-[#263650] p-5`}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex gap-3 items-center">
            <div className="bg-blue-600 p-2 rounded-xl">
              <GraduationCap />
            </div>
            <div>
              <strong className="text-xl">AprovaPE</strong>
              <div className="text-xs muted">CENTRAL DE ESTUDOS</div>
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setMobile(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>
        <nav
          id="main-navigation"
          aria-label="Navegação principal"
          className="space-y-2"
        >
          {menu.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              className={`nav-btn ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto panel p-4 text-sm">
          <div className="muted mb-2">Sua jornada</div>
          <div className="text-2xl font-bold">{percent}%</div>
          <div className="h-2 bg-slate-700 rounded-full mt-2">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="muted text-xs mt-3">
            Continue avançando, um tópico por vez.
          </p>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-[#080f1e]/95 backdrop-blur border-b border-[#263650] px-5 lg:px-9 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              ref={menuRef}
              aria-label="Abrir menu"
              aria-expanded={mobile}
              aria-controls="main-navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <div>
              <p className="kicker">Plataforma de estudos</p>
              <h1 className="font-bold text-xl lg:text-2xl">
                {menu.find((x) => x[0] === view)?.[1]}
              </h1>
            </div>
          </div>
          <span className="text-xs rounded-full border border-blue-500/40 px-3 py-2 text-blue-200">
            Dados neste aparelho
          </span>
        </header>
        <div className="max-w-7xl mx-auto p-5 lg:p-9 space-y-6">
          {s.storageError && (
            <p role="alert" className="error-banner">
              {s.storageError}
            </p>
          )}
          {view === "dashboard" && (
            <>
              <section className="rounded-3xl p-6 lg:p-9 bg-gradient-to-r from-blue-700 to-[#172d58]">
                <p className="text-blue-100 text-sm mb-2">
                  Seu espaço de preparação
                </p>
                <h2 className="text-2xl lg:text-4xl font-extrabold mb-3">
                  Sua aprovação começa com constância.
                </h2>
                <p className="text-blue-100 max-w-xl mb-5">
                  Planeje, estude e acompanhe sua evolução em um único lugar.
                </p>
                <button
                  className="bg-white text-blue-800 font-bold rounded-xl px-5 py-3"
                  onClick={() => navigate("roadmap")}
                >
                  Abrir roadmap →
                </button>
              </section>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  ["Horas estudadas", minutesText(totalMinutes), Clock3],
                  [
                    "Tópicos concluídos",
                    `${done}/${uniqueTopics.length}`,
                    BookOpen,
                  ],
                  [
                    "Tarefas concluídas",
                    `${taskDone}/${s.tasks.length}`,
                    CheckCircle2,
                  ],
                  ["Progresso geral", `${percent}%`, Route],
                ].map(([label, value, Icon]) => {
                  const I = Icon as typeof Clock3;
                  return (
                    <div className="panel p-4 lg:p-5" key={label as string}>
                      <I className="text-blue-400 mb-3" />
                      <div className="text-xl lg:text-2xl font-bold">
                        {value as string}
                      </div>
                      <p className="muted text-xs mt-1">{label as string}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid xl:grid-cols-2 gap-4">
                <div className="panel p-5">
                  <h3 className="font-bold mb-5">
                    Tempo de estudo • últimos 7 dias
                  </h3>
                  {!s.sessions.length && (
                    <p className="muted text-sm mb-3">
                      Registre sua primeira sessão para acompanhar sua evolução.
                    </p>
                  )}
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={week}>
                        <XAxis dataKey="day" stroke="#93a7c5" />
                        <YAxis stroke="#93a7c5" />
                        <Tooltip
                          contentStyle={{
                            background: "#111e33",
                            border: "1px solid #34445f",
                          }}
                        />
                        <Bar
                          dataKey="minutes"
                          name="Minutos"
                          fill="#4388ff"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="panel p-5">
                  <h3 className="font-bold mb-4">Próximas tarefas</h3>
                  <div className="space-y-3">
                    {s.tasks
                      .filter((t) => !t.done)
                      .slice(0, 5)
                      .map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-3 p-3 bg-[#0c1729] rounded-xl"
                        >
                          <input
                            type="checkbox"
                            aria-label={`Concluir ${t.title}`}
                            checked={t.done}
                            onChange={() => s.toggleTask(t.id)}
                          />
                          <span className="text-sm">{t.title}</span>
                        </label>
                      ))}
                    {!s.tasks.some((t) => !t.done) && (
                      <p className="muted">Nenhuma tarefa pendente.</p>
                    )}
                  </div>
                  <button
                    className="text-blue-300 text-sm mt-5"
                    onClick={() => navigate("agenda")}
                  >
                    Ver planejamento →
                  </button>
                </div>
              </div>
            </>
          )}
          {view === "roadmap" && <Roadmap />}
          {view === "agenda" && <Planner />}
          {view === "timer" && <StudyTimer />}
          {view === "backup" && <BackupPanel />}
        </div>
      </main>
    </div>
  );
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

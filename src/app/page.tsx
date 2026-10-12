"use client";
import { useEffect, useRef, useState } from "react";
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
  Target,
  RotateCcw,
  NotebookPen,
  FileSearch,
  MoreHorizontal,
} from "lucide-react";
import { useStudy } from "@/lib/store";
import { Dashboard, type View } from "@/components/dashboard";
import { Goals } from "@/components/goals";
import { Reviews } from "@/components/reviews";
import { Mistakes } from "@/components/mistakes";
import { Editais } from "@/components/editais";
import { Statistics } from "@/components/statistics";
import { StudyTimer } from "@/components/study-timer";
import { Roadmap } from "@/components/roadmap";
import { Planner } from "@/components/planner";
import { BackupPanel } from "@/components/backup-panel";
const menu: [View, string, typeof BookOpen][] = [
  ["dashboard", "Visão geral", ChartNoAxesCombined],
  ["roadmap", "Roadmap", Route],
  ["agenda", "Planejamento", CalendarDays],
  ["timer", "Cronômetro", Clock3],
  ["reviews", "Revisões", RotateCcw],
  ["mistakes", "Caderno de erros", NotebookPen],
  ["goals", "Metas", Target],
  ["statistics", "Estatísticas", ChartNoAxesCombined],
  ["editais", "Editais", FileSearch],
  ["backup", "Backup", Download],
];
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
  const uniqueTopics = Array.from(
    new Map(s.topics.map((t) => [t.sharedId || t.id, t])).values(),
  );
  const percent = uniqueTopics.length
    ? Math.round(
        (uniqueTopics.filter((t) => t.done).length / uniqueTopics.length) * 100,
      )
    : 0;
  useEffect(() => {
    function readView() {
      const hash = window.location.hash.slice(1);
      if (menu.some(([id]) => id === hash)) setView(hash as View);
      else setView("dashboard");
    }
    readView();
    window.addEventListener("hashchange", readView);
    function sync(event: StorageEvent) {
      if (event.key === "aprovape-v1") void useStudy.persist.rehydrate();
    }
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hashchange", readView);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const navigate = (v: View) => {
    setView(v);
    window.location.hash = v;
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
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <aside
        ref={navRef}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label={mobile ? "Menu principal" : undefined}
        className={`${mobile ? "fixed inset-0 z-50 flex bg-[#080f1e]" : "hidden"} lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-64 overflow-y-auto lg:shrink-0 flex-col border-r border-[#263650] p-5`}
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
      <main
        id="main-content"
        tabIndex={-1}
        inert={mobile ? true : undefined}
        aria-hidden={mobile ? true : undefined}
        className="flex-1 min-w-0 pb-24 lg:pb-0"
      >
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
          {view === "dashboard" && <Dashboard navigate={navigate} />}
          {view === "roadmap" && <Roadmap />}
          {view === "agenda" && <Planner />}
          {view === "timer" && <StudyTimer />}
          {view === "goals" && <Goals />}
          {view === "reviews" && <Reviews />}
          {view === "mistakes" && <Mistakes />}
          {view === "editais" && <Editais />}
          {view === "statistics" && <Statistics />}
          {view === "backup" && <BackupPanel />}
        </div>
      </main>
      <nav
        inert={mobile ? true : undefined}
        aria-hidden={mobile ? true : undefined}
        aria-label="Acesso rápido"
        className="mobile-tabs lg:hidden"
      >
        {menu.slice(0, 4).map(([id, label, Icon]) => (
          <button
            key={id}
            aria-current={view === id ? "page" : undefined}
            className={view === id ? "active" : ""}
            onClick={() => navigate(id)}
          >
            <Icon size={20} />
            <span>{label === "Visão geral" ? "Início" : label}</span>
          </button>
        ))}
        <button aria-label="Mais opções" onClick={() => setMobile(true)}>
          <MoreHorizontal size={20} />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}

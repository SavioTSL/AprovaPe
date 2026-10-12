"use client";
import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { useStudy } from "@/lib/store";
import type { AppData } from "@/lib/data";
import { parseBackup } from "@/lib/validation";
export function BackupPanel() {
  const s = useStudy();
  const fileRef = useRef<HTMLInputElement>(null);
  function exportBackup() {
    const data: AppData = {
      tasks: s.tasks,
      topics: s.topics,
      sessions: s.sessions,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, data }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "aprovape-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw Error("Arquivo muito grande");
      const d = parseBackup(JSON.parse(await file.text()));
      if (confirm("Substituir todos os dados atuais pelo backup?"))
        s.restore(d);
    } catch {
      alert("Arquivo de backup inválido.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return (
    <section className="panel p-6 max-w-2xl space-y-5">
      <h2 className="text-xl font-bold">Seus dados, sob seu controle</h2>
      <p className="muted text-sm">
        As informações ficam neste navegador. Faça backup regularmente: limpar
        os dados do navegador ou trocar de aparelho pode apagar seu progresso.
      </p>
      <button className="btn flex gap-2 items-center" onClick={exportBackup}>
        <Download size={18} />
        Baixar backup JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => importBackup(e.target.files?.[0])}
      />
      <button
        className="btn-alt flex gap-2 items-center"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={18} />
        Importar backup
      </button>
      <hr className="border-[#34445f]" />
      <button
        className="text-red-300 border border-red-800 rounded-xl px-4 py-3"
        onClick={() => {
          if (
            confirm(
              "Apagar todas as tarefas, tópicos e sessões? Exporte um backup antes de continuar.",
            )
          )
            s.reset();
        }}
      >
        Apagar meus dados
      </button>
    </section>
  );
}

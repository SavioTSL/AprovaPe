"use client";
import { useState } from "react";
import { useStudy } from "@/lib/store";
import type { Topic } from "@/lib/data";
export function TopicNotes({ topic }: { topic: Topic }) {
  const s = useStudy();
  const [notes, setNotes] = useState(topic.notes || "");
  const [saved, setSaved] = useState(false);
  return (
    <details className="notes mt-3">
      <summary>Anotações e revisão</summary>
      <form
        className="space-y-3 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          s.updateTopic(topic.id, notes);
          setSaved(true);
        }}
      >
        <textarea
          aria-label={`Anotações de ${topic.title}`}
          className="field"
          rows={3}
          maxLength={10000}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Resumo, links de aulas e pontos importantes…"
        />
        <div className="flex flex-wrap gap-2">
          <button className="btn-alt text-xs">Salvar anotações</button>
          <button
            type="button"
            disabled={s.reviews.some((r) => r.topicId === topic.id)}
            className="btn-alt text-xs"
            onClick={() => s.scheduleReview(topic.id)}
          >
            {s.reviews.some((r) => r.topicId === topic.id)
              ? "Revisão agendada"
              : "Agendar revisão"}
          </button>
        </div>
        {saved && (
          <p role="status" className="text-xs text-blue-200">
            Anotações salvas.
          </p>
        )}
      </form>
    </details>
  );
}

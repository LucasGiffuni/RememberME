"use client";

import { AgendaItem } from "@/types";

interface DayAgendaProps {
  agenda: AgendaItem[];
}

export default function DayAgenda({ agenda }: DayAgendaProps) {
  if (agenda.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-[var(--color-text-muted)] text-lg">Tu día está libre</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Dime qué tienes que hacer hoy y organizo tu agenda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agenda.map((item) => (
        <div
          key={item.id}
          className="bg-[var(--color-surface)] rounded-xl p-3 flex items-center gap-3 animate-slide-up"
        >
          <div className="text-center min-w-[50px]">
            <p className="text-xs text-[var(--color-text-muted)]">{item.time}</p>
          </div>
          <div className={`w-1 h-8 rounded-full ${
            item.type === "event" ? "bg-[var(--color-primary)]" :
            item.type === "reminder" ? "bg-[var(--color-warning)]" :
            "bg-[var(--color-success)]"
          }`} />
          <div className="flex-1">
            <p className={`text-sm ${item.completed ? "line-through text-[var(--color-text-muted)]" : ""}`}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

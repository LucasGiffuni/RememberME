"use client";

import { AgendaItem } from "@/types";
import { motion } from "framer-motion";

interface DayAgendaProps {
  agenda: AgendaItem[];
}

export default function DayAgenda({ agenda }: DayAgendaProps) {
  if (agenda.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)] font-medium">Tu día está libre</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Dime qué tienes hoy y organizo tu agenda
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {agenda.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="card p-3.5 flex items-center gap-3"
        >
          <div className="text-center min-w-[44px]">
            <p className="text-xs font-semibold text-[var(--color-primary-light)]">{item.time}</p>
          </div>
          <div className={`w-0.5 h-8 rounded-full ${
            item.type === "event" ? "bg-[var(--color-primary)]" :
            item.type === "reminder" ? "bg-[var(--color-warning)]" :
            "bg-[var(--color-success)]"
          }`} />
          <div className="flex-1">
            <p className={`text-sm ${item.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-md ${
            item.type === "event" ? "bg-purple-500/10 text-purple-400" :
            item.type === "reminder" ? "bg-amber-500/10 text-amber-400" :
            "bg-emerald-500/10 text-emerald-400"
          }`}>
            {item.type === "event" ? "Evento" : item.type === "reminder" ? "Recordatorio" : "Tarea"}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

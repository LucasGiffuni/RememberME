"use client";

import { useState } from "react";
import { AgendaItem, Task, Habit } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface SmartDayProps {
  agenda: AgendaItem[];
  tasks: Task[];
  habits: Habit[];
  onOrganizeDay: () => void;
  isOrganizing: boolean;
}

export default function SmartDay({ agenda, tasks, habits, onOrganizeDay, isOrganizing }: SmartDayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todaysHabits = habits.filter((h) => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "custom" && h.customDays) return h.customDays.includes(now.getDay());
    if (h.frequency === "weekly") return now.getDay() === 1;
    return false;
  });
  const pendingHabits = todaysHabits.filter((h) => !h.completedDates.includes(todayStr));

  if (agenda.length === 0 && pendingTasks.length === 0 && pendingHabits.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)] font-medium">Tu día está libre</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
          Agrega tareas y pediré a la IA que organice tu día
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Organize button */}
      <motion.button
        onClick={() => { sounds.tap(); onOrganizeDay(); }}
        disabled={isOrganizing}
        whileTap={{ scale: 0.97 }}
        className="w-full card p-4 flex items-center gap-3 border-dashed border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-glow)] flex items-center justify-center">
          {isOrganizing ? (
            <motion.div
              className="w-5 h-5 border-2 border-[var(--color-primary-light)]/30 border-t-[var(--color-primary-light)] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <svg className="w-5 h-5 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {isOrganizing ? "Organizando tu día..." : "Organizar mi día con IA"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {pendingTasks.length} tareas + {pendingHabits.length} hábitos pendientes
          </p>
        </div>
      </motion.button>

      {/* Timeline */}
      {agenda.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-[var(--color-border)]" />

          <div className="space-y-1">
            <AnimatePresence>
              {agenda.map((item, index) => {
                const isPast = item.time < currentTime;
                const isCurrent = item.time <= currentTime && (!item.endTime || item.endTime > currentTime);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => { sounds.tap(); setExpandedId(expandedId === item.id ? null : item.id); }}
                    className={`relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                      isCurrent ? "bg-[var(--color-primary-glow)] border border-[var(--color-primary)]/20" :
                      isPast ? "opacity-50" : ""
                    }`}
                  >
                    {/* Time dot */}
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        item.completed ? "bg-[var(--color-success)] border-[var(--color-success)]" :
                        isCurrent ? "bg-[var(--color-primary)] border-[var(--color-primary)] glow-primary" :
                        "bg-[var(--color-surface)] border-[var(--color-surface-light)]"
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[var(--color-primary-light)]">
                          {item.time}
                        </span>
                        {item.endTime && (
                          <span className="text-xs text-[var(--color-text-muted)]">→ {item.endTime}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                          item.type === "habit" ? "bg-emerald-500/10 text-emerald-400" :
                          item.type === "reminder" ? "bg-amber-500/10 text-amber-400" :
                          "bg-purple-500/10 text-purple-400"
                        }`}>
                          {item.type === "habit" ? "Hábito" : item.type === "reminder" ? "Recordatorio" : "Tarea"}
                        </span>
                      </div>
                      <p className={`text-sm mt-0.5 ${item.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
                        {item.title}
                      </p>
                      {item.description && expandedId === item.id && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-[var(--color-text-muted)] mt-1"
                        >
                          {item.description}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Pending without time */}
      {agenda.length === 0 && pendingTasks.length > 0 && (
        <div className="card p-4">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Tareas sin organizar
          </p>
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-surface-light)]" />
                <span className="truncate">{task.title}</span>
                {task.deadline && (
                  <span className="text-xs text-[var(--color-warning)] ml-auto flex-shrink-0">
                    {task.deadline.replace("before:", "< ").replace("between:", "").replace("after:", "> ").replace("-", " - ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";
import { Task, Habit } from "@/types";

interface RetrospectiveProps {
  tasks: Task[];
  habits: Habit[];
  onClose: () => void;
  onReschedule: (taskIds: string[]) => void;
}

export default function Retrospective({ tasks, habits, onClose, onReschedule }: RetrospectiveProps) {
  const [step, setStep] = useState(0);
  const [selectedToReschedule, setSelectedToReschedule] = useState<string[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");

  const completedTasks = tasks.filter((t) => t.completed);
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const completedHabits = habits.filter((h) => h.completedDates.includes(todayStr));
  const totalHabitsToday = habits.filter((h) => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "custom" && h.customDays) return h.customDays.includes(new Date().getDay());
    if (h.frequency === "weekly") return new Date().getDay() === 1;
    return false;
  });

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const steps = [
    // Step 0: Summary
    () => (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-[var(--color-text)]">{completionRate}%</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">completado hoy</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-success)]">{completedTasks.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Tareas hechas</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-primary-light)]">{completedHabits.length}/{totalHabitsToday.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Hábitos</p>
          </div>
        </div>

        {incompleteTasks.length > 0 && (
          <div className="card p-3">
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Sin completar</p>
            <div className="space-y-1.5">
              {incompleteTasks.map((t) => (
                <p key={t.id} className="text-sm text-[var(--color-text-secondary)]">• {t.title}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    // Step 1: Mood
    () => (
      <div className="space-y-6 text-center">
        <p className="text-lg font-medium text-[var(--color-text)]">Cómo te sentís hoy?</p>
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => { sounds.tap(); setMood(n); }}
              className={`w-12 h-12 rounded-full text-xl flex items-center justify-center transition-all ${
                mood === n ? "bg-[var(--color-primary)] scale-110" : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {n === 1 ? "😫" : n === 2 ? "😕" : n === 3 ? "😐" : n === 4 ? "🙂" : "🔥"}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {mood === 1 ? "Día difícil" : mood === 2 ? "Podría haber sido mejor" : mood === 3 ? "Normal" : mood === 4 ? "Buen día" : mood === 5 ? "Día excelente!" : "Selecciona tu estado"}
        </p>
      </div>
    ),
    // Step 2: Reschedule
    () => (
      <div className="space-y-4">
        <p className="text-lg font-medium text-[var(--color-text)]">
          {incompleteTasks.length > 0 ? "Mover a mañana?" : "Todo completado!"}
        </p>
        {incompleteTasks.length > 0 ? (
          <>
            <p className="text-sm text-[var(--color-text-muted)]">
              Selecciona las tareas que quieres hacer mañana:
            </p>
            <div className="space-y-2">
              {incompleteTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    sounds.tap();
                    setSelectedToReschedule((prev) =>
                      prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id]
                    );
                  }}
                  className={`w-full card p-3 text-left flex items-center gap-3 transition-all ${
                    selectedToReschedule.includes(task.id) ? "border-[var(--color-primary)] bg-[var(--color-primary-glow)]" : ""
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    selectedToReschedule.includes(task.id) ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--color-surface-light)]"
                  }`}>
                    {selectedToReschedule.includes(task.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[var(--color-text)]">{task.title}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-[var(--color-success)]">Completaste todas tus tareas!</p>
          </div>
        )}
      </div>
    ),
    // Step 3: Reflection (optional)
    () => (
      <div className="space-y-4">
        <p className="text-lg font-medium text-[var(--color-text)]">Algo que aprendiste hoy?</p>
        <p className="text-sm text-[var(--color-text-muted)]">Opcional - te ayuda a mejorar</p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Ej: Necesito empezar más temprano, planifiqué demasiado..."
          className="input !h-24 resize-none"
        />
      </div>
    ),
  ];

  const handleNext = () => {
    sounds.tap();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Finish
      sounds.success();
      if (selectedToReschedule.length > 0) {
        onReschedule(selectedToReschedule);
      }
      // Save reflection to localStorage
      if (reflection || mood) {
        const reflections = JSON.parse(localStorage.getItem("rememberme-reflections") || "[]");
        reflections.push({
          date: new Date().toISOString(),
          mood,
          reflection,
          completionRate,
          tasksCompleted: completedTasks.length,
          tasksTotal: tasks.length,
        });
        localStorage.setItem("rememberme-reflections", JSON.stringify(reflections));
      }
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col p-5 safe-top safe-bottom"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Retrospectiva del día</h2>
        <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-6 bg-[var(--color-primary)]" : i < step ? "w-1.5 bg-[var(--color-primary-light)]" : "w-1.5 bg-[var(--color-surface-light)]"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {steps[step]()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <button onClick={() => { sounds.tap(); setStep(step - 1); }} className="btn btn-ghost flex-1">
            Atrás
          </button>
        )}
        <button onClick={handleNext} className="btn btn-primary flex-1">
          {step === steps.length - 1 ? "Finalizar" : "Siguiente"}
        </button>
      </div>
    </motion.div>
  );
}

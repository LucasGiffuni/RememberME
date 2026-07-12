"use client";

import { useState } from "react";
import { Habit } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface HabitsViewProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
}

export default function HabitsView({ habits, onToggleHabit, onAddHabit, onDeleteHabit }: HabitsViewProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dayOfWeek = today.getDay();

  const todaysHabits = habits.filter((h) => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "custom" && h.customDays) return h.customDays.includes(dayOfWeek);
    if (h.frequency === "weekly") return dayOfWeek === 1;
    return true;
  });

  const isCompletedToday = (habit: Habit) => habit.completedDates.includes(todayStr);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState<{ title: string; frequency: "daily" | "weekly" | "custom" }>({ title: "", frequency: "daily" });

  const handleAdd = () => {
    if (!newHabit.title.trim()) return;
    sounds.success();
    onAddHabit({
      id: `habit-${Date.now()}`,
      title: newHabit.title,
      frequency: newHabit.frequency,
      streak: 0,
      longestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    });
    setNewHabit({ title: "", frequency: "daily" });
    setShowForm(false);
  };

  const handleToggle = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit && !isCompletedToday(habit)) {
      sounds.complete();
    } else {
      sounds.undo();
    }
    onToggleHabit(id);
  };

  const completedCount = todaysHabits.filter((h) => isCompletedToday(h)).length;
  const progress = todaysHabits.length > 0 ? (completedCount / todaysHabits.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress ring */}
      <div className="card p-4 flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-surface-light)" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 1.508} 150.8`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--color-text)]">
            {completedCount}/{todaysHabits.length}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text)]">Hábitos de hoy</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {completedCount === todaysHabits.length && todaysHabits.length > 0
              ? "Todos completados!"
              : `Te faltan ${todaysHabits.length - completedCount}`}
          </p>
        </div>
        <button
          onClick={() => { sounds.tap(); setShowForm(!showForm); }}
          className="btn btn-primary text-xs"
        >
          + Nuevo
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-3.5 space-y-2.5">
              <input
                type="text"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                placeholder="Ej: Ir al gym, Meditar, Leer..."
                className="input"
              />
              <div className="flex gap-2">
                {(["daily", "weekly", "custom"] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setNewHabit({ ...newHabit, frequency: freq })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      newHabit.frequency === freq
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {freq === "daily" ? "Diario" : freq === "weekly" ? "Semanal" : "Custom"}
                  </button>
                ))}
              </div>
              <button onClick={handleAdd} className="btn btn-primary w-full">
                Crear hábito
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits list */}
      {todaysHabits.length === 0 && !showForm ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">Crea tu primer hábito</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Construye rutinas que se mantengan</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {todaysHabits.map((habit, index) => {
              const completed = isCompletedToday(habit);
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-3.5 press-scale"
                >
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={() => handleToggle(habit.id)}
                      whileTap={{ scale: 0.8 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        completed
                          ? "bg-[var(--color-success)] glow-success"
                          : "bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
                      }`}
                    >
                      {completed && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </motion.button>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${completed ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
                        {habit.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--color-warning)] font-medium">
                          {habit.streak} días
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Mejor: {habit.longestStreak}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { sounds.delete(); onDeleteHabit(habit.id); }}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* 7-day streak dots */}
                  <div className="flex gap-1.5 mt-3 justify-end">
                    {last7Days.map((date, i) => (
                      <div
                        key={date}
                        className={`w-3.5 h-3.5 rounded-md transition-all ${
                          habit.completedDates.includes(date)
                            ? "bg-[var(--color-success)]"
                            : i === 6 ? "bg-[var(--color-surface-hover)] border border-dashed border-[var(--color-surface-light)]"
                            : "bg-[var(--color-surface-hover)]"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

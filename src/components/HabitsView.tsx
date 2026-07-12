"use client";

import { useState } from "react";
import { Habit } from "@/types";

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

  // Filter habits that should appear today
  const todaysHabits = habits.filter((h) => {
    if (h.frequency === "daily") return true;
    if (h.frequency === "custom" && h.customDays) return h.customDays.includes(dayOfWeek);
    if (h.frequency === "weekly") return dayOfWeek === 1; // Mondays
    return true;
  });

  const isCompletedToday = (habit: Habit) => habit.completedDates.includes(todayStr);

  // Last 7 days for streak visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState<{ title: string; frequency: "daily" | "weekly" | "custom" }>({ title: "", frequency: "daily" });

  const handleAdd = () => {
    if (!newHabit.title.trim()) return;
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Mis Hábitos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-full"
        >
          + Hábito
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[var(--color-surface)] rounded-xl p-3 space-y-2 animate-slide-up">
          <input
            type="text"
            value={newHabit.title}
            onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
            placeholder="Ej: Ir al gym, Meditar, Leer..."
            className="w-full bg-[var(--color-surface-light)] text-[var(--color-text)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <div className="flex gap-2">
            {(["daily", "weekly", "custom"] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setNewHabit({ ...newHabit, frequency: freq })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  newHabit.frequency === freq
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-light)] text-[var(--color-text-muted)]"
                }`}
              >
                {freq === "daily" ? "Diario" : freq === "weekly" ? "Semanal" : "Personalizado"}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} className="w-full bg-[var(--color-primary)] text-white rounded-lg py-2 text-sm font-medium">
            Crear hábito
          </button>
        </div>
      )}

      {/* Habits list */}
      {todaysHabits.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-[var(--color-text-muted)] text-lg">Sin hábitos todavía</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Crea hábitos para mejorar tu rutina</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysHabits.map((habit) => {
            const completed = isCompletedToday(habit);
            return (
              <div key={habit.id} className="bg-[var(--color-surface)] rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleHabit(habit.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      completed
                        ? "bg-[var(--color-success)] scale-95"
                        : "bg-[var(--color-surface-light)] border-2 border-[var(--color-text-muted)]"
                    }`}
                  >
                    {completed && (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${completed ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
                      {habit.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--color-warning)]">
                        🔥 {habit.streak} días
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Mejor: {habit.longestStreak}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteHabit(habit.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Mini streak calendar */}
                <div className="flex gap-1 mt-2 justify-end">
                  {last7Days.map((date) => (
                    <div
                      key={date}
                      className={`w-4 h-4 rounded-sm ${
                        habit.completedDates.includes(date)
                          ? "bg-[var(--color-success)]"
                          : "bg-[var(--color-surface-light)]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

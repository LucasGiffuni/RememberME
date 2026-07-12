"use client";

import { UserStats, Task, Habit } from "@/types";

interface StatsViewProps {
  stats: UserStats;
  tasks: Task[];
  habits: Habit[];
}

const LEVELS = [
  { level: 1, name: "Principiante", minPoints: 0 },
  { level: 2, name: "Organizado", minPoints: 50 },
  { level: 3, name: "Productivo", minPoints: 150 },
  { level: 4, name: "Imparable", minPoints: 350 },
  { level: 5, name: "Maestro", minPoints: 600 },
  { level: 6, name: "Leyenda", minPoints: 1000 },
];

function getLevel(points: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) current = l;
  }
  return current;
}

function getNextLevel(points: number) {
  for (const l of LEVELS) {
    if (points < l.minPoints) return l;
  }
  return null;
}

export default function StatsView({ stats, tasks, habits }: StatsViewProps) {
  const currentLevel = getLevel(stats.points);
  const nextLevel = getNextLevel(stats.points);
  const progress = nextLevel ? ((stats.points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 : 100;

  const completedToday = tasks.filter((t) => t.completed).length;
  const totalToday = tasks.length;

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const habitsTotalToday = habits.length;

  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const maxWeekly = Math.max(...stats.weeklyCompleted, 1);

  return (
    <div className="space-y-4">
      {/* Level card */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Nivel {currentLevel.level}</p>
            <p className="text-lg font-bold text-[var(--color-text)]">{currentLevel.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-primary-light)]">{stats.points}</p>
            <p className="text-xs text-[var(--color-text-muted)]">puntos</p>
          </div>
        </div>
        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name}</span>
            </div>
            <div className="h-2 bg-[var(--color-surface-light)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
              {nextLevel.minPoints - stats.points} pts para el siguiente nivel
            </p>
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--color-surface)] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-warning)]">🔥 {stats.currentStreak}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Racha actual</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary-light)]">{stats.longestStreak}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Mejor racha</p>
        </div>
      </div>

      {/* Today's progress */}
      <div className="bg-[var(--color-surface)] rounded-xl p-3">
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Progreso de hoy</p>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[var(--color-text)]">Tareas: {completedToday}/{totalToday}</p>
            <p className="text-sm text-[var(--color-text)]">Hábitos: {habitsCompletedToday}/{habitsTotalToday}</p>
          </div>
          <div className="text-3xl font-bold text-[var(--color-success)]">
            {totalToday + habitsTotalToday > 0
              ? Math.round(((completedToday + habitsCompletedToday) / (totalToday + habitsTotalToday)) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-[var(--color-surface)] rounded-xl p-3">
        <p className="text-xs text-[var(--color-text-muted)] mb-3">Esta semana</p>
        <div className="flex items-end justify-between gap-2 h-24">
          {stats.weeklyCompleted.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-[var(--color-primary)] transition-all duration-300"
                style={{ height: `${(count / maxWeekly) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
              />
              <span className="text-xs text-[var(--color-text-muted)]">{dayLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Points breakdown */}
      <div className="bg-[var(--color-surface)] rounded-xl p-3">
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Como ganar puntos</p>
        <div className="space-y-1 text-xs text-[var(--color-text)]">
          <p>+5 pts por cada tarea completada</p>
          <p>+10 pts por cada hábito diario</p>
          <p>+20 pts bonus por completar todo el día</p>
          <p>+5 pts extra por cada día de racha</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { UserStats, Task, Habit } from "@/types";
import { motion } from "framer-motion";

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

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const completedToday = tasks.filter((t) => t.completed).length;
  const habitsToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;

  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const maxWeekly = Math.max(...stats.weeklyCompleted, 1);

  return (
    <div className="space-y-3">
      {/* Level */}
      <motion.div 
        className="card p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-glow)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Nivel {currentLevel.level}</p>
              <p className="text-xl font-bold text-[var(--color-text)] mt-0.5">{currentLevel.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--color-primary-light)]">{stats.points}</p>
              <p className="text-xs text-[var(--color-text-muted)]">puntos</p>
            </div>
          </div>
          {nextLevel && (
            <div>
              <div className="h-2 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                {nextLevel.minPoints - stats.points} pts para <span className="text-[var(--color-primary-light)]">{nextLevel.name}</span>
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          className="card p-4 text-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-3xl font-bold text-[var(--color-warning)]">{stats.currentStreak}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Racha actual</p>
        </motion.div>
        <motion.div 
          className="card p-4 text-center"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-3xl font-bold text-[var(--color-primary-light)]">{stats.longestStreak}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Mejor racha</p>
        </motion.div>
      </div>

      {/* Today */}
      <motion.div 
        className="card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Hoy</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-[var(--color-success)]">{completedToday}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Tareas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-primary-light)]">{habitsToday}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Hábitos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-warning)]">{completedToday * 5 + habitsToday * 10}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Pts hoy</p>
          </div>
        </div>
      </motion.div>

      {/* Weekly chart */}
      <motion.div 
        className="card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Esta semana</p>
        <div className="flex items-end justify-between gap-2 h-20">
          {stats.weeklyCompleted.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <motion.div
                className="w-full rounded-md bg-[var(--color-primary)]"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((count / maxWeekly) * 100, count > 0 ? 8 : 0)}%` }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                style={{ minHeight: count > 0 ? "4px" : "0" }}
              />
              <span className="text-xs text-[var(--color-text-muted)]">{dayLabels[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

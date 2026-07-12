"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";
import { Task } from "@/types";

interface FocusModeProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onClose: () => void;
}

const FOCUS_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

export default function FocusMode({ tasks, onComplete, onClose }: FocusModeProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = phase === "focus" ? FOCUS_TIME : (sessions % 4 === 0 && sessions > 0 ? LONG_BREAK : SHORT_BREAK);
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const startTimer = useCallback(() => {
    sounds.tap();
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    sounds.tap();
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    sounds.tap();
    setIsRunning(false);
    setTimeLeft(FOCUS_TIME);
    setPhase("focus");
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      if (phase === "focus") {
        sounds.levelUp();
        setSessions((prev) => prev + 1);
        const breakTime = (sessions + 1) % 4 === 0 ? LONG_BREAK : SHORT_BREAK;
        setTimeLeft(breakTime);
        setPhase("break");
      } else {
        sounds.success();
        setTimeLeft(FOCUS_TIME);
        setPhase("focus");
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, phase, sessions]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  // Task selection screen
  if (!selectedTask) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col p-5 safe-top safe-bottom"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Modo Focus</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Elige en qué tarea te vas a enfocar:
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 custom-scroll">
          {pendingTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => { sounds.tap(); setSelectedTask(task); }}
              className="w-full card p-3.5 text-left press-scale flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-glow)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text)] truncate">{task.title}</p>
                {task.category && <p className="text-xs text-[var(--color-text-muted)]">{task.category}</p>}
              </div>
            </button>
          ))}
          {pendingTasks.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              No tienes tareas pendientes para enfocarte
            </p>
          )}
        </div>

        <button
          onClick={() => setSelectedTask({ id: "free", title: "Sesión libre", completed: false, createdAt: "" })}
          className="mt-4 btn btn-ghost w-full"
        >
          O iniciar sesión libre sin tarea
        </button>
      </motion.div>
    );
  }

  // Timer screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col items-center justify-center p-5 safe-top safe-bottom"
    >
      {/* Close button */}
      <button 
        onClick={onClose} 
        className="absolute top-5 right-5 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] safe-top"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Phase indicator */}
      <motion.p 
        key={phase}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm font-medium mb-2 ${phase === "focus" ? "text-[var(--color-primary-light)]" : "text-[var(--color-success)]"}`}
      >
        {phase === "focus" ? "ENFOCADO" : "DESCANSO"}
      </motion.p>

      {/* Task name */}
      <p className="text-sm text-[var(--color-text-muted)] mb-8">{selectedTask.title}</p>

      {/* Circular timer */}
      <div className="relative w-56 h-56 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 224 224">
          <circle cx="112" cy="112" r="100" fill="none" stroke="var(--color-surface)" strokeWidth="6" />
          <circle
            cx="112" cy="112" r="100" fill="none"
            stroke={phase === "focus" ? "var(--color-primary)" : "var(--color-success)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${progress * 6.283} 628.3`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p 
            key={timeLeft}
            className="text-5xl font-bold font-mono text-[var(--color-text)] tracking-tight"
          >
            {formatTime(timeLeft)}
          </motion.p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Sesión {sessions + 1}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button onClick={resetTimer} className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] press-scale">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        <motion.button
          onClick={isRunning ? pauseTimer : startTimer}
          whileTap={{ scale: 0.9 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isRunning 
              ? "bg-[var(--color-surface-light)] text-[var(--color-text)]" 
              : "bg-[var(--color-primary)] text-white glow-primary"
          }`}
        >
          {isRunning ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>

        {selectedTask.id !== "free" && (
          <button 
            onClick={() => { sounds.complete(); onComplete(selectedTask.id); onClose(); }}
            className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 flex items-center justify-center text-[var(--color-success)] press-scale"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Sessions dots */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              i < sessions % 4 ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-light)]"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mt-2">
        {4 - (sessions % 4)} sesiones para descanso largo
      </p>
    </motion.div>
  );
}

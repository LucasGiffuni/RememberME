"use client";

import { useState, useEffect, useCallback } from "react";
import VoiceButton from "@/components/VoiceButton";
import TaskList from "@/components/TaskList";
import DayAgenda from "@/components/DayAgenda";
import CalendarView from "@/components/CalendarView";
import ChatInput from "@/components/ChatInput";
import HabitsView from "@/components/HabitsView";
import StatsView from "@/components/StatsView";
import Header from "@/components/Header";
import { useUserData } from "@/hooks/useUserData";
import { useReminders } from "@/hooks/useReminders";
import { CalendarEvent, Habit, UserStats } from "@/types";

const DEFAULT_STATS: UserStats = {
  totalTasksCompleted: 0,
  totalHabitsCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  points: 0,
  level: 1,
  weeklyCompleted: [0, 0, 0, 0, 0, 0, 0],
  joinedAt: new Date().toISOString(),
};

export default function Home() {
  const { tasks, agenda, events, isLoading, updateTasks, updateAgenda, updateEvents } = useUserData();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [activeTab, setActiveTab] = useState<"tasks" | "habits" | "calendar" | "stats" | "chat">("tasks");
  const [isProcessing, setIsProcessing] = useState(false);
  useReminders(tasks, agenda);

  // Load habits and stats from localStorage
  useEffect(() => {
    const savedHabits = localStorage.getItem("rememberme-habits");
    const savedStats = localStorage.getItem("rememberme-stats");
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedStats) setStats(JSON.parse(savedStats));
  }, []);

  // Save habits and stats
  useEffect(() => {
    localStorage.setItem("rememberme-habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("rememberme-stats", JSON.stringify(stats));
  }, [stats]);

  // Points system
  const addPoints = useCallback((points: number) => {
    setStats((prev) => {
      const newPoints = prev.points + points;
      return { ...prev, points: newPoints };
    });
  }, []);

  // Update weekly stats
  const updateWeeklyStats = useCallback(() => {
    const today = new Date().getDay();
    // Convert Sunday=0 to index where Monday=0
    const dayIndex = today === 0 ? 6 : today - 1;
    setStats((prev) => {
      const weekly = [...prev.weeklyCompleted];
      weekly[dayIndex] = (weekly[dayIndex] || 0) + 1;
      return { ...prev, weeklyCompleted: weekly };
    });
  }, []);

  const handleVoiceResult = async (transcript: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript, tasks, agenda, events }),
      });
      const data = await response.json();
      if (data.tasks) updateTasks(data.tasks);
      if (data.agenda) updateAgenda(data.agenda);
      if (data.events) updateEvents(data.events);
    } catch (error) {
      console.error("Error processing:", error);
    }
    setIsProcessing(false);
  };

  const handleTextSubmit = async (text: string) => {
    await handleVoiceResult(text);
  };

  const toggleTask = (id: string) => {
    updateTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (task && !task.completed) {
        addPoints(5);
        updateWeeklyStats();
        setStats((s) => ({ ...s, totalTasksCompleted: s.totalTasksCompleted + 1 }));
      }
      return prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    });
  };

  const deleteTask = (id: string) => {
    updateTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addEvent = (event: CalendarEvent) => {
    updateEvents((prev) => [...prev, event]);
  };

  const deleteEvent = (id: string) => {
    updateEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Habits logic
  const toggleHabit = (id: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const alreadyDone = h.completedDates.includes(todayStr);
        if (alreadyDone) {
          // Undo
          return {
            ...h,
            completedDates: h.completedDates.filter((d) => d !== todayStr),
            streak: Math.max(0, h.streak - 1),
          };
        } else {
          // Complete
          const newStreak = h.streak + 1;
          addPoints(10);
          updateWeeklyStats();
          setStats((s) => ({ ...s, totalHabitsCompleted: s.totalHabitsCompleted + 1 }));
          return {
            ...h,
            completedDates: [...h.completedDates, todayStr],
            streak: newStreak,
            longestStreak: Math.max(h.longestStreak, newStreak),
          };
        }
      })
    );
  };

  const addHabit = (habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  // Text-to-speech summary
  const speakDaySummary = () => {
    if (!("speechSynthesis" in window)) return;
    const pending = tasks.filter((t) => !t.completed);
    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
    const todayEvents = events.filter((e) => e.date === todayStr);
    const pendingHabits = habits.filter((h) => !h.completedDates.includes(todayStr));

    let text = "Hola! Aquí va tu resumen del día. ";
    if (pending.length > 0) {
      text += `Tienes ${pending.length} tareas pendientes: ${pending.map((t) => t.title).join(", ")}. `;
    } else {
      text += "No tienes tareas pendientes, bien hecho! ";
    }
    if (todayEvents.length > 0) {
      text += `Tienes ${todayEvents.length} eventos hoy: ${todayEvents.map((e) => `${e.title} a las ${e.startTime}`).join(", ")}. `;
    }
    if (pendingHabits.length > 0) {
      text += `Te faltan ${pendingHabits.length} hábitos por completar: ${pendingHabits.map((h) => h.title).join(", ")}. `;
    }
    text += `Llevas ${stats.currentStreak} días de racha y ${stats.points} puntos. Vamos!`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const tabs = [
    { key: "tasks" as const, label: "Tareas" },
    { key: "habits" as const, label: "Hábitos" },
    { key: "calendar" as const, label: "Calendario" },
    { key: "stats" as const, label: "Stats" },
    { key: "chat" as const, label: "Chat" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      
      {/* Tab navigation - scrollable */}
      <nav className="flex border-b border-[var(--color-surface-light)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "text-[var(--color-primary-light)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === "tasks" && (
          <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
        )}
        {activeTab === "habits" && (
          <HabitsView habits={habits} onToggleHabit={toggleHabit} onAddHabit={addHabit} onDeleteHabit={deleteHabit} />
        )}
        {activeTab === "calendar" && (
          <CalendarView events={events} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />
        )}
        {activeTab === "stats" && (
          <StatsView stats={stats} tasks={tasks} habits={habits} />
        )}
        {activeTab === "chat" && <ChatInput onSubmit={handleTextSubmit} isProcessing={isProcessing} />}
      </main>

      {/* Bottom bar: voice + summary */}
      <div className="p-4 pb-6 flex items-center justify-center gap-4">
        <button
          onClick={speakDaySummary}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-colors"
          title="Resumen del día por voz"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <VoiceButton onResult={handleVoiceResult} isProcessing={isProcessing} />
      </div>
    </div>
  );
}

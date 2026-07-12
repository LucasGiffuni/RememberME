"use client";

import { useState, useEffect, useCallback } from "react";
import VoiceButton from "@/components/VoiceButton";
import TaskList from "@/components/TaskList";
import SmartDay from "@/components/DayAgenda";
import ChatInput from "@/components/ChatInput";
import HabitsView from "@/components/HabitsView";
import StatsView from "@/components/StatsView";
import FocusMode from "@/components/FocusMode";
import VoiceNotes from "@/components/VoiceNotes";
import Retrospective from "@/components/Retrospective";
import Settings from "@/components/Settings";
import Onboarding from "@/components/Onboarding";
import Header from "@/components/Header";
import { useUserData } from "@/hooks/useUserData";
import { useReminders } from "@/hooks/useReminders";
import { sounds } from "@/lib/sounds";
import { Habit, UserStats, VoiceNote } from "@/types";

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
  const { tasks, agenda, isLoading, updateTasks, updateAgenda } = useUserData();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [activeTab, setActiveTab] = useState<"tasks" | "habits" | "mi-dia" | "stats" | "notes" | "chat">("tasks");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [showRetro, setShowRetro] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  useReminders(tasks, agenda);

  // Check onboarding
  useEffect(() => {
    const onboarded = localStorage.getItem("rememberme-onboarded");
    if (!onboarded) setShowOnboarding(true);
  }, []);

  // Load habits and stats from localStorage
  useEffect(() => {
    const savedHabits = localStorage.getItem("rememberme-habits");
    const savedStats = localStorage.getItem("rememberme-stats");
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedStats) setStats(JSON.parse(savedStats));
  }, []);

  useEffect(() => {
    localStorage.setItem("rememberme-habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("rememberme-stats", JSON.stringify(stats));
  }, [stats]);

  // Load notes
  useEffect(() => {
    const savedNotes = localStorage.getItem("rememberme-notes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  useEffect(() => {
    localStorage.setItem("rememberme-notes", JSON.stringify(notes));
  }, [notes]);

  const addPoints = useCallback((points: number) => {
    setStats((prev) => ({ ...prev, points: prev.points + points }));
  }, []);

  const updateWeeklyStats = useCallback(() => {
    const today = new Date().getDay();
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
        body: JSON.stringify({ message: transcript, tasks, agenda }),
      });
      const data = await response.json();
      if (data.tasks) updateTasks(data.tasks);
      if (data.agenda) updateAgenda(data.agenda);
      sounds.success();
    } catch (error) {
      console.error("Error processing:", error);
      sounds.error();
    }
    setIsProcessing(false);
  };

  const handleTextSubmit = async (text: string) => {
    await handleVoiceResult(text);
  };

  const organizeDay = async () => {
    setIsOrganizing(true);
    try {
      const response = await fetch("/api/organize-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits }),
      });
      const data = await response.json();
      if (data.agenda) {
        updateAgenda(data.agenda);
        sounds.success();
      }
    } catch (error) {
      console.error("Error organizing:", error);
      sounds.error();
    }
    setIsOrganizing(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      sounds.complete();
      addPoints(5);
      updateWeeklyStats();
      setStats((s) => ({ ...s, totalTasksCompleted: s.totalTasksCompleted + 1 }));
    } else {
      sounds.undo();
    }
    updateTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    sounds.delete();
    updateTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Habits
  const toggleHabit = (id: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const alreadyDone = h.completedDates.includes(todayStr);
        if (alreadyDone) {
          sounds.undo();
          return { ...h, completedDates: h.completedDates.filter((d) => d !== todayStr), streak: Math.max(0, h.streak - 1) };
        } else {
          sounds.complete();
          addPoints(10);
          updateWeeklyStats();
          setStats((s) => ({ ...s, totalHabitsCompleted: s.totalHabitsCompleted + 1 }));
          const newStreak = h.streak + 1;
          return { ...h, completedDates: [...h.completedDates, todayStr], streak: newStreak, longestStreak: Math.max(h.longestStreak, newStreak) };
        }
      })
    );
  };

  const addHabit = (habit: Habit) => { setHabits((prev) => [...prev, habit]); };
  const deleteHabit = (id: string) => { sounds.delete(); setHabits((prev) => prev.filter((h) => h.id !== id)); };

  // Voice Notes
  const addNote = (transcript: string) => {
    const note: VoiceNote = {
      id: `note-${Date.now()}`,
      transcript,
      createdAt: new Date().toISOString(),
    };
    sounds.success();
    setNotes((prev) => [note, ...prev]);
  };

  const deleteNote = (id: string) => {
    sounds.delete();
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Focus mode complete
  const handleFocusComplete = (taskId: string) => {
    addPoints(5);
    updateWeeklyStats();
    setStats((s) => ({ ...s, totalTasksCompleted: s.totalTasksCompleted + 1 }));
    updateTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)));
  };

  // Retrospective reschedule
  const handleReschedule = (taskIds: string[]) => {
    // Keep the tasks as pending (they're already not completed)
    // In the future, could move deadline to tomorrow
    sounds.success();
  };

  // TTS
  const speakDaySummary = () => {
    if (!("speechSynthesis" in window)) return;
    sounds.tap();
    const pending = tasks.filter((t) => !t.completed);
    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
    const pendingHabits = habits.filter((h) => !h.completedDates.includes(todayStr));

    let text = "Aquí va tu resumen. ";
    if (pending.length > 0) {
      text += `Tienes ${pending.length} tareas pendientes: ${pending.slice(0, 5).map((t) => t.title).join(", ")}. `;
    } else {
      text += "No tienes tareas pendientes. ";
    }
    if (pendingHabits.length > 0) {
      text += `Te faltan ${pendingHabits.length} hábitos: ${pendingHabits.map((h) => h.title).join(", ")}. `;
    }
    text += `Llevas ${stats.points} puntos. `;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const tabs = [
    { key: "tasks" as const, label: "Tareas" },
    { key: "mi-dia" as const, label: "Mi Día" },
    { key: "habits" as const, label: "Hábitos" },
    { key: "notes" as const, label: "Notas" },
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
      <Header onSettingsClick={() => setShowSettings(true)} />
      
      <nav className="flex border-b border-[var(--color-border)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { sounds.tap(); setActiveTab(tab.key); }}
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

      <main className="flex-1 overflow-y-auto custom-scroll p-4">
        {activeTab === "tasks" && (
          <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
        )}
        {activeTab === "mi-dia" && (
          <SmartDay agenda={agenda} tasks={tasks} habits={habits} onOrganizeDay={organizeDay} isOrganizing={isOrganizing} />
        )}
        {activeTab === "habits" && (
          <HabitsView habits={habits} onToggleHabit={toggleHabit} onAddHabit={addHabit} onDeleteHabit={deleteHabit} />
        )}
        {activeTab === "stats" && (
          <StatsView stats={stats} tasks={tasks} habits={habits} />
        )}
        {activeTab === "notes" && (
          <VoiceNotes notes={notes} onAddNote={addNote} onDeleteNote={deleteNote} />
        )}
        {activeTab === "chat" && <ChatInput onSubmit={handleTextSubmit} isProcessing={isProcessing} />}
      </main>

      <div className="p-4 pb-6 safe-bottom flex items-center justify-center gap-3">
        <button
          onClick={speakDaySummary}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-colors press-scale"
          title="Resumen por voz"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        </button>
        <button
          onClick={() => { sounds.tap(); setShowFocus(true); }}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-warning)] transition-colors press-scale"
          title="Modo Focus"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </button>
        <VoiceButton onResult={handleVoiceResult} isProcessing={isProcessing} />
        <button
          onClick={() => { sounds.tap(); setShowRetro(true); }}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-success-light)] transition-colors press-scale"
          title="Retrospectiva"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </button>
      </div>

      {/* Modals */}
      {showFocus && (
        <FocusMode tasks={tasks} onComplete={handleFocusComplete} onClose={() => setShowFocus(false)} />
      )}
      {showRetro && (
        <Retrospective tasks={tasks} habits={habits} onClose={() => setShowRetro(false)} onReschedule={handleReschedule} />
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

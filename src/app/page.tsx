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
    <div className="flex flex-col h-full md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-[var(--color-border)] md:bg-[var(--color-surface)]/50">
        <div className="p-5">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">RememberME</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { sounds.tap(); setActiveTab(tab.key); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[var(--color-primary-glow)] text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => { sounds.tap(); setShowFocus(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--color-text-muted)] hover:text-[var(--color-warning)] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Modo Focus
          </button>
          <button
            onClick={() => { sounds.tap(); setShowRetro(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--color-text-muted)] hover:text-[var(--color-success-light)] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Retrospectiva
          </button>
          <button
            onClick={() => { sounds.tap(); setShowSettings(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Mobile header */}
        <div className="md:hidden">
          <Header onSettingsClick={() => setShowSettings(true)} />
        </div>

        {/* Desktop top bar with quick input */}
        <div className="hidden md:flex md:items-center md:gap-4 md:px-6 md:py-4 md:border-b md:border-[var(--color-border)]">
          <form
            onSubmit={(e) => { e.preventDefault(); const input = (e.target as HTMLFormElement).elements.namedItem("quickInput") as HTMLInputElement; if (input.value.trim()) { handleVoiceResult(input.value.trim()); input.value = ""; } }}
            className="flex-1 flex gap-2"
          >
            <input
              name="quickInput"
              type="text"
              placeholder="Agregar tarea, pedir algo a la IA... (Enter para enviar)"
              autoComplete="off"
              className="input flex-1 !rounded-full !px-5"
            />
            <button type="submit" disabled={isProcessing} className="btn btn-primary !rounded-full">
              {isProcessing ? "Procesando..." : "Enviar"}
            </button>
          </form>
          <button
            onClick={speakDaySummary}
            className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)] transition-colors press-scale"
            title="Resumen por voz"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </button>
        </div>

        {/* Mobile tab bar */}
        <nav className="flex border-b border-[var(--color-border)] overflow-x-auto no-scrollbar md:hidden">
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6">
          {activeTab === "tasks" && (
            <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
          )}
          {activeTab === "mi-dia" && (
            <SmartDay agenda={agenda} tasks={tasks} habits={habits} onOrganizeDay={organizeDay} isOrganizing={isOrganizing} />
          )}
          {activeTab === "habits" && (
            <HabitsView habits={habits} onToggleHabit={toggleHabit} onAddHabit={addHabit} onDeleteHabit={deleteHabit} />
          )}
          {activeTab === "notes" && (
            <VoiceNotes notes={notes} onAddNote={addNote} onDeleteNote={deleteNote} />
          )}
          {activeTab === "stats" && (
            <StatsView stats={stats} tasks={tasks} habits={habits} />
          )}
          {activeTab === "chat" && <ChatInput onSubmit={handleTextSubmit} isProcessing={isProcessing} />}
        </main>

        {/* Mobile bottom bar */}
        <div className="p-4 pb-6 safe-bottom flex items-center justify-center gap-3 md:hidden">
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

"use client";

import { useState } from "react";
import VoiceButton from "@/components/VoiceButton";
import TaskList from "@/components/TaskList";
import DayAgenda from "@/components/DayAgenda";
import CalendarView from "@/components/CalendarView";
import ChatInput from "@/components/ChatInput";
import Header from "@/components/Header";
import { useUserData } from "@/hooks/useUserData";
import { useReminders } from "@/hooks/useReminders";
import { CalendarEvent } from "@/types";

export default function Home() {
  const { tasks, agenda, events, isLoading, updateTasks, updateAgenda, updateEvents } = useUserData();
  const [activeTab, setActiveTab] = useState<"tasks" | "agenda" | "calendar" | "chat">("tasks");
  const [isProcessing, setIsProcessing] = useState(false);
  useReminders(tasks, agenda);

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
    updateTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
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

  const tabs = [
    { key: "tasks" as const, label: "Tareas" },
    { key: "calendar" as const, label: "Calendario" },
    { key: "agenda" as const, label: "Mi Día" },
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
      
      {/* Tab navigation */}
      <nav className="flex border-b border-[var(--color-surface-light)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
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
        {activeTab === "calendar" && (
          <CalendarView events={events} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />
        )}
        {activeTab === "agenda" && <DayAgenda agenda={agenda} />}
        {activeTab === "chat" && <ChatInput onSubmit={handleTextSubmit} isProcessing={isProcessing} />}
      </main>

      {/* Voice button */}
      <div className="p-4 pb-6 flex justify-center">
        <VoiceButton onResult={handleVoiceResult} isProcessing={isProcessing} />
      </div>
    </div>
  );
}

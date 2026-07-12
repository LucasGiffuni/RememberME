"use client";

import { useState } from "react";
import Calendar from "./Calendar";
import { CalendarEvent } from "@/types";

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export default function CalendarView({ events, onAddEvent, onDeleteEvent }: CalendarViewProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", startTime: "09:00", endTime: "10:00", description: "" });

  const eventsForDate = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      description: newEvent.description || undefined,
      date: selectedDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime || undefined,
      createdAt: new Date().toISOString(),
    };
    onAddEvent(event);
    setNewEvent({ title: "", startTime: "09:00", endTime: "10:00", description: "" });
    setShowForm(false);
  };

  const exportToICS = (event: CalendarEvent) => {
    const [year, month, day] = event.date.split("-");
    const [startH, startM] = event.startTime.split(":");
    const endTime = event.endTime || `${String(Number(startH) + 1).padStart(2, "0")}:${startM}`;
    const [endH, endM] = endTime.split(":");
    
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RememberME//ES
BEGIN:VEVENT
DTSTART:${year}${month}${day}T${startH}${startM}00
DTEND:${year}${month}${day}T${endH}${endM}00
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Calendar events={events} onDaySelect={setSelectedDate} selectedDate={selectedDate} />
      
      {/* Selected day events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold capitalize text-[var(--color-text)]">
            {formatDate(selectedDate)}
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-full"
          >
            + Cita
          </button>
        </div>

        {/* New event form */}
        {showForm && (
          <div className="bg-[var(--color-surface)] rounded-xl p-3 mb-3 space-y-2 animate-slide-up">
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Título de la cita"
              className="w-full bg-[var(--color-surface-light)] text-[var(--color-text)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-[var(--color-text-muted)]">Inicio</label>
                <input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] text-[var(--color-text)] rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--color-text-muted)]">Fin</label>
                <input
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] text-[var(--color-text)] rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <input
              type="text"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Descripción (opcional)"
              className="w-full bg-[var(--color-surface-light)] text-[var(--color-text)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
            <button
              onClick={handleAddEvent}
              className="w-full bg-[var(--color-primary)] text-white rounded-lg py-2 text-sm font-medium"
            >
              Guardar cita
            </button>
          </div>
        )}

        {/* Events list */}
        {eventsForDate.length === 0 && !showForm ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            Sin citas para este día
          </p>
        ) : (
          <div className="space-y-2">
            {eventsForDate.map((event) => (
              <div
                key={event.id}
                className="bg-[var(--color-surface)] rounded-xl p-3 flex items-center gap-3"
              >
                <div className="text-center min-w-[50px]">
                  <p className="text-xs font-medium text-[var(--color-primary-light)]">{event.startTime}</p>
                  {event.endTime && (
                    <p className="text-xs text-[var(--color-text-muted)]">{event.endTime}</p>
                  )}
                </div>
                <div className="w-0.5 h-8 rounded-full bg-[var(--color-primary)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text)] truncate">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{event.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => exportToICS(event)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-light)]"
                    title="Exportar a calendario"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

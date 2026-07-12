"use client";

import { useState } from "react";
import { CalendarEvent } from "@/types";

interface CalendarProps {
  events: CalendarEvent[];
  onDaySelect: (date: string) => void;
  selectedDate: string;
}

export default function Calendar({ events, onDaySelect, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedDate;
  };

  const days = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10" />);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    days.push(
      <button
        key={day}
        onClick={() => onDaySelect(dateStr)}
        className={`h-10 w-10 mx-auto rounded-full flex flex-col items-center justify-center text-sm transition-all relative ${
          isSelected(day)
            ? "bg-[var(--color-primary)] text-white font-bold"
            : isToday(day)
            ? "bg-[var(--color-surface-light)] text-white font-semibold"
            : "text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        }`}
      >
        {day}
        {dayEvents.length > 0 && (
          <div className="absolute bottom-0.5 flex gap-0.5">
            {dayEvents.slice(0, 3).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[var(--color-primary-light)]" />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold capitalize text-[var(--color-text)]">{monthName}</h3>
        <button onClick={nextMonth} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs text-[var(--color-text-muted)] font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days}
      </div>
    </div>
  );
}

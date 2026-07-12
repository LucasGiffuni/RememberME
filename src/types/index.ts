export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  subtasks?: SubTask[];
  dueDate?: string;
  reminder?: string;
  priority?: "high" | "medium" | "low";
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  type: "task" | "reminder" | "event";
  completed: boolean;
}

export interface AIResponse {
  tasks?: Task[];
  agenda?: AgendaItem[];
  message?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  color?: string;
  reminder?: string; // ISO datetime for when to remind
  recurring?: "daily" | "weekly" | "monthly" | "none";
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly" | "custom";
  customDays?: number[]; // 0=Sunday, 1=Monday, etc.
  timeOfDay?: string; // HH:mm preferred time
  streak: number;
  longestStreak: number;
  completedDates: string[]; // ISO date strings YYYY-MM-DD
  createdAt: string;
  color?: string;
  icon?: string;
}

export interface UserStats {
  totalTasksCompleted: number;
  totalHabitsCompleted: number;
  currentStreak: number; // consecutive days with at least 1 task/habit completed
  longestStreak: number;
  points: number;
  level: number;
  weeklyCompleted: number[]; // last 7 days count [Mon, Tue, ...]
  joinedAt: string;
}

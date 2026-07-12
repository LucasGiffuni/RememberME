export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  subtasks?: SubTask[];
  dueDate?: string;
  deadline?: string; // "before:14:00" or "between:16:00-17:00" or "after:09:00"
  estimatedMinutes?: number; // how long the task takes
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
  endTime?: string;
  title: string;
  description?: string;
  type: "task" | "reminder" | "event" | "habit";
  taskId?: string; // reference to the task
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly" | "custom";
  customDays?: number[]; // 0=Sunday, 1=Monday, etc.
  timeOfDay?: string; // HH:mm preferred time
  estimatedMinutes?: number;
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
  currentStreak: number;
  longestStreak: number;
  points: number;
  level: number;
  weeklyCompleted: number[];
  joinedAt: string;
}

export interface SmartDayPlan {
  items: AgendaItem[];
  suggestions?: string[];
  generatedAt: string;
}

export interface AIResponse {
  tasks?: Task[];
  agenda?: AgendaItem[];
  message?: string;
}

"use client";

import { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="text-4xl mb-4">📋</div>
        <p className="text-[var(--color-text-muted)] text-lg">No tienes tareas</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Usa el micrófono para agregar una tarea
        </p>
      </div>
    );
  }

  const grouped = tasks.reduce((acc, task) => {
    const cat = task.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryTasks]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[var(--color-surface)] rounded-xl p-3 flex items-start gap-3 animate-slide-up"
              >
                <button
                  onClick={() => onToggle(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    task.completed
                      ? "bg-[var(--color-success)] border-[var(--color-success)]"
                      : "border-[var(--color-text-muted)]"
                  }`}
                >
                  {task.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? "line-through text-[var(--color-text-muted)]" : ""}`}>
                    {task.title}
                  </p>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2 space-y-1 pl-2 border-l-2 border-[var(--color-surface-light)]">
                      {task.subtasks.map((sub) => (
                        <p key={sub.id} className={`text-xs ${sub.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-muted)]"}`}>
                          {sub.title}
                        </p>
                      ))}
                    </div>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-[var(--color-warning)] mt-1">
                      Vence: {new Date(task.dueDate).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

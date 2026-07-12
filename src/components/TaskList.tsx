"use client";

import { Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)] font-medium">Sin tareas pendientes</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Usa el micrófono para agregar tareas
        </p>
      </motion.div>
    );
  }

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      sounds.complete();
    } else {
      sounds.undo();
    }
    onToggle(id);
  };

  const handleDelete = (id: string) => {
    sounds.delete();
    onDelete(id);
  };

  const TaskItem = ({ task, index }: { task: Task; index: number }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03 }}
      className="card p-3.5 flex items-start gap-3 press-scale"
    >
      <button
        onClick={() => handleToggle(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? "bg-[var(--color-success)] border-[var(--color-success)] glow-success"
            : "border-[var(--color-surface-light)] hover:border-[var(--color-primary)]"
        }`}
      >
        {task.completed && (
          <motion.svg 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="w-3 h-3 text-white" 
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${task.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
          {task.title}
        </p>
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm border ${sub.completed ? "bg-[var(--color-success)] border-[var(--color-success)]" : "border-[var(--color-surface-light)]"}`} />
                <p className={`text-xs ${sub.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-secondary)]"}`}>
                  {sub.title}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {task.priority && (
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
              task.priority === "high" ? "bg-red-500/10 text-red-400" :
              task.priority === "medium" ? "bg-amber-500/10 text-amber-400" :
              "bg-blue-500/10 text-blue-400"
            }`}>
              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
            </span>
          )}
          {task.category && (
            <span className="text-xs text-[var(--color-text-muted)]">{task.category}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => handleDelete(task.id)}
        className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-hover)] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Pendientes ({pending.length})
            </p>
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {pending.map((task, i) => (
                <TaskItem key={task.id} task={task} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Completadas ({completed.length})
            </p>
          </div>
          <div className="space-y-2 opacity-60">
            <AnimatePresence mode="popLayout">
              {completed.map((task, i) => (
                <TaskItem key={task.id} task={task} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

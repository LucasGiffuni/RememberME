"use client";

import { useEffect, useCallback } from "react";
import { Task, AgendaItem } from "@/types";

export function useReminders(tasks: Task[], agenda: AgendaItem[]) {
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icons/icon-192x192.svg",
        badge: "/icons/icon-192x192.svg",
        tag: `reminder-${Date.now()}`,
      });
    }
  }, []);

  // Check for reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      // Check agenda items
      agenda.forEach((item) => {
        if (!item.completed && item.time === currentTime) {
          sendNotification("RememberME", `${item.title}`);
        }
      });

      // Check task reminders
      tasks.forEach((task) => {
        if (!task.completed && task.reminder) {
          const reminderDate = new Date(task.reminder);
          const diffMs = Math.abs(now.getTime() - reminderDate.getTime());
          if (diffMs < 60000) { // within 1 minute
            sendNotification("RememberME - Recordatorio", task.title);
          }
        }
      });

      // Check incomplete high-priority tasks (nag every 2 hours)
      const hours = now.getHours();
      if (hours >= 9 && hours <= 21 && now.getMinutes() === 0 && hours % 2 === 0) {
        const highPriority = tasks.filter((t) => !t.completed && t.priority === "high");
        if (highPriority.length > 0) {
          sendNotification(
            "RememberME - Pendientes importantes",
            `Tienes ${highPriority.length} tarea(s) de alta prioridad sin completar`
          );
        }
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, agenda, sendNotification]);

  return { requestPermission, sendNotification };
}

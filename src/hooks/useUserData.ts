"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Task, AgendaItem } from "@/types";

interface UserData {
  tasks: Task[];
  agenda: AgendaItem[];
}

export function useUserData() {
  const { isSignedIn, isLoaded } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from server or localStorage
  useEffect(() => {
    if (!isLoaded) return;

    const loadData = async () => {
      if (isSignedIn) {
        try {
          const response = await fetch("/api/user-data");
          if (response.ok) {
            const data: UserData = await response.json();
            setTasks(data.tasks || []);
            setAgenda(data.agenda || []);
            // Also update localStorage as cache
            localStorage.setItem("rememberme-tasks", JSON.stringify(data.tasks || []));
            localStorage.setItem("rememberme-agenda", JSON.stringify(data.agenda || []));
          }
        } catch {
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      setIsLoading(false);
    };

    loadData();
  }, [isSignedIn, isLoaded]);

  const loadFromLocalStorage = () => {
    const savedTasks = localStorage.getItem("rememberme-tasks");
    const savedAgenda = localStorage.getItem("rememberme-agenda");
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedAgenda) setAgenda(JSON.parse(savedAgenda));
  };

  // Debounced save to server
  const saveToServer = useCallback(
    (data: UserData) => {
      // Always save to localStorage immediately
      localStorage.setItem("rememberme-tasks", JSON.stringify(data.tasks));
      localStorage.setItem("rememberme-agenda", JSON.stringify(data.agenda));

      if (!isSignedIn) return;

      // Debounce server saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch("/api/user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        } catch (error) {
          console.error("Save to server failed:", error);
        }
      }, 1000); // 1 second debounce
    },
    [isSignedIn]
  );

  // Update functions that also trigger save
  const updateTasks = useCallback(
    (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
      setTasks((prev) => {
        const updated = typeof newTasks === "function" ? newTasks(prev) : newTasks;
        saveToServer({ tasks: updated, agenda });
        return updated;
      });
    },
    [agenda, saveToServer]
  );

  const updateAgenda = useCallback(
    (newAgenda: AgendaItem[] | ((prev: AgendaItem[]) => AgendaItem[])) => {
      setAgenda((prev) => {
        const updated = typeof newAgenda === "function" ? newAgenda(prev) : newAgenda;
        saveToServer({ tasks, agenda: updated });
        return updated;
      });
    },
    [tasks, saveToServer]
  );

  return {
    tasks,
    agenda,
    isLoading,
    updateTasks,
    updateAgenda,
  };
}

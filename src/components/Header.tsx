"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

export default function Header() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const { subscribe, isSubscribed, checkSupport, error, status } = usePushNotifications();
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = checkSupport();
      const notGranted = "Notification" in window && Notification.permission !== "granted";
      setShowNotifBanner(supported && notGranted);
    }
  }, [checkSupport]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    sounds.tap();
    const success = await subscribe();
    if (success) {
      sounds.success();
      setShowNotifBanner(false);
    }
    setIsLoading(false);
  };

  return (
    <header className="px-5 pt-5 pb-3 safe-top">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            className="text-xl font-semibold tracking-tight text-[var(--color-text)]"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {greeting}
          </motion.h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 capitalize">
            {dateStr}
          </p>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 ring-2 ring-[var(--color-border)] ring-offset-2 ring-offset-[var(--color-bg)]",
            },
          }}
        />
      </div>

      <AnimatePresence>
        {showNotifBanner && !isSubscribed && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full card px-4 py-3 flex items-center gap-3 press-scale"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-glow)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {isLoading ? (status || "Activando...") : "Activar recordatorios"}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Recibe alertas de tus tareas</p>
              </div>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-xs text-[var(--color-danger)] text-center">{error}</p>
      )}
    </header>
  );
}

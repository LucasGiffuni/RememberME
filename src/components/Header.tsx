"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function Header() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const { subscribe, isSubscribed, checkSupport, error, status } = usePushNotifications();
  const [showNotifButton, setShowNotifButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = checkSupport();
      const notGranted = "Notification" in window && Notification.permission !== "granted";
      setShowNotifButton(supported && notGranted);
    }
  }, [checkSupport]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    const success = await subscribe();
    setIsLoading(false);
    if (success) {
      setShowNotifButton(false);
    }
  };

  return (
    <header className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">RememberME</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {greeting} — {dateStr}
          </p>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
            },
          }}
        />
      </div>
      {showNotifButton && !isSubscribed && (
        <button
          onClick={handleEnableNotifications}
          disabled={isLoading}
          className="mt-2 w-full bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-primary-light)] rounded-lg py-2 px-3 text-xs font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {status || "Activando..."}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Activar recordatorios
            </>
          )}
        </button>
      )}
      {error && (
        <p className="mt-1 text-xs text-[var(--color-danger)] text-center">{error}</p>
      )}
      {isSubscribed && (
        <p className="mt-1 text-xs text-[var(--color-success)] text-center">Notificaciones activas</p>
      )}
    </header>
  );
}

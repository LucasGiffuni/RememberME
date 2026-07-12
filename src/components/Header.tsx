"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function Header() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const { subscribe, isSubscribed, checkSupport } = usePushNotifications();
  const [showNotifButton, setShowNotifButton] = useState(false);

  useEffect(() => {
    // Only show the button if push is supported and not yet granted
    if (checkSupport() && "Notification" in window && Notification.permission !== "granted") {
      setShowNotifButton(true);
    }
  }, [checkSupport]);

  const handleEnableNotifications = async () => {
    const success = await subscribe();
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
          className="mt-2 w-full bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-primary-light)] rounded-lg py-2 px-3 text-xs font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Activar recordatorios
        </button>
      )}
    </header>
  );
}

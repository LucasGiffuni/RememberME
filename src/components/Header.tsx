"use client";

import { UserButton } from "@clerk/nextjs";

export default function Header() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="px-4 pt-4 pb-2 flex items-center justify-between">
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
    </header>
  );
}

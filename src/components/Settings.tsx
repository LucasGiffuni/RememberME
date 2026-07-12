"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface UserSettings {
  timezone: string;
  notificationStart: string;
  notificationEnd: string;
  googleCalendarConnected: boolean;
  outlookConnected: boolean;
  pomodoroMinutes: number;
  breakMinutes: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notificationStart: "08:00",
  notificationEnd: "22:00",
  googleCalendarConnected: false,
  outlookConnected: false,
  pomodoroMinutes: 25,
  breakMinutes: 5,
};

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem("rememberme-settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem("rememberme-settings", JSON.stringify(newSettings));
    sounds.tap();
  };

  const connectGoogle = async () => {
    sounds.tap();
    // Redirect to Google OAuth
    window.location.href = "/api/auth/google";
  };

  const connectOutlook = async () => {
    sounds.tap();
    window.location.href = "/api/auth/microsoft";
  };

  const disconnectGoogle = () => {
    sounds.delete();
    saveSettings({ ...settings, googleCalendarConnected: false });
    localStorage.removeItem("rememberme-google-token");
  };

  const disconnectOutlook = () => {
    sounds.delete();
    saveSettings({ ...settings, outlookConnected: false });
    localStorage.removeItem("rememberme-outlook-token");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col safe-top safe-bottom overflow-y-auto custom-scroll"
    >
      {/* Header */}
      <div className="sticky top-0 glass border-b border-[var(--color-border)] px-5 py-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Configuración</h2>
        <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] press-scale">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Calendar integrations */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Calendarios</h3>
          
          <div className="space-y-2">
            <div className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Google Calendar</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {settings.googleCalendarConnected ? "Conectado" : "Importa tus eventos"}
                  </p>
                </div>
              </div>
              {settings.googleCalendarConnected ? (
                <button onClick={disconnectGoogle} className="btn btn-ghost text-xs text-[var(--color-danger)]">
                  Desconectar
                </button>
              ) : (
                <button onClick={connectGoogle} className="btn btn-primary text-xs">
                  Conectar
                </button>
              )}
            </div>

            <div className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M2 6l10 6.5L22 6v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#0078D4"/>
                    <path d="M22 6l-10 6.5L2 6a2 2 0 012-2h16a2 2 0 012 2z" fill="#0078D4" opacity=".8"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Outlook / Microsoft 365</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {settings.outlookConnected ? "Conectado" : "Importa tus citas"}
                  </p>
                </div>
              </div>
              {settings.outlookConnected ? (
                <button onClick={disconnectOutlook} className="btn btn-ghost text-xs text-[var(--color-danger)]">
                  Desconectar
                </button>
              ) : (
                <button onClick={connectOutlook} className="btn btn-primary text-xs">
                  Conectar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Notificaciones</h3>
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--color-text)]">Horario activo</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.notificationStart}
                onChange={(e) => saveSettings({ ...settings, notificationStart: e.target.value })}
                className="input !w-auto text-center"
              />
              <span className="text-sm text-[var(--color-text-muted)]">a</span>
              <input
                type="time"
                value={settings.notificationEnd}
                onChange={(e) => saveSettings({ ...settings, notificationEnd: e.target.value })}
                className="input !w-auto text-center"
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Solo recibirás recordatorios entre estas horas
            </p>
          </div>
        </section>

        {/* Focus / Pomodoro */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Modo Focus</h3>
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--color-text)]">Tiempo de enfoque</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveSettings({ ...settings, pomodoroMinutes: Math.max(5, settings.pomodoroMinutes - 5) })}
                  className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-center text-sm"
                >-</button>
                <span className="text-sm font-mono text-[var(--color-text)] w-8 text-center">{settings.pomodoroMinutes}</span>
                <button
                  onClick={() => saveSettings({ ...settings, pomodoroMinutes: Math.min(60, settings.pomodoroMinutes + 5) })}
                  className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-center text-sm"
                >+</button>
                <span className="text-xs text-[var(--color-text-muted)]">min</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--color-text)]">Descanso</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveSettings({ ...settings, breakMinutes: Math.max(1, settings.breakMinutes - 1) })}
                  className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-center text-sm"
                >-</button>
                <span className="text-sm font-mono text-[var(--color-text)] w-8 text-center">{settings.breakMinutes}</span>
                <button
                  onClick={() => saveSettings({ ...settings, breakMinutes: Math.min(30, settings.breakMinutes + 1) })}
                  className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-center text-sm"
                >+</button>
                <span className="text-xs text-[var(--color-text-muted)]">min</span>
              </div>
            </div>
          </div>
        </section>

        {/* Timezone */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-3">General</h3>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--color-text)]">Zona horaria</label>
              <span className="text-xs text-[var(--color-primary-light)]">{settings.timezone}</span>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <div className="card p-4 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">RememberME</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">v1.0.0 — Tu asistente personal con IA</p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

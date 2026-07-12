"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Bienvenido a RememberME",
      description: "Tu asistente personal que te ayuda a no olvidar nada y ser más productivo.",
      icon: (
        <svg className="w-12 h-12 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
      action: null,
    },
    {
      title: "Habla, escribe o dicta",
      description: "Usa tu voz para agregar tareas, crear listas o pedirle a la IA que organice tu día. La IA entiende todo.",
      icon: (
        <svg className="w-12 h-12 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
      action: null,
    },
    {
      title: "Conecta tu calendario",
      description: "Importa tus eventos de Google Calendar u Outlook para que la IA los tenga en cuenta al organizar tu día.",
      icon: (
        <svg className="w-12 h-12 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      action: "calendar",
    },
    {
      title: "Notificaciones inteligentes",
      description: "RememberME te recuerda cada hora tus pendientes y te envía alertas de eventos importantes.",
      icon: (
        <svg className="w-12 h-12 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      action: "notifications",
    },
    {
      title: "Listo para empezar!",
      description: "Usa el micrófono para decirme tu primera tarea. Estoy acá para ayudarte.",
      icon: (
        <svg className="w-12 h-12 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: null,
    },
  ];

  const handleAction = (action: string | null) => {
    if (action === "calendar") {
      // Will be connected later from settings
      sounds.tap();
    } else if (action === "notifications") {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
      sounds.tap();
    }
  };

  const handleNext = () => {
    sounds.tap();
    const currentStep = steps[step];
    if (currentStep.action) {
      handleAction(currentStep.action);
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      sounds.success();
      localStorage.setItem("rememberme-onboarded", "true");
      onComplete();
    }
  };

  const handleSkip = () => {
    sounds.tap();
    localStorage.setItem("rememberme-onboarded", "true");
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col p-6 safe-top safe-bottom"
    >
      {/* Skip button */}
      <div className="flex justify-end">
        <button onClick={handleSkip} className="btn btn-ghost text-xs">
          Saltar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface)] flex items-center justify-center mb-8">
              {steps[step].icon}
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-3">
              {steps[step].title}
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
              {steps[step].description}
            </p>

            {steps[step].action === "calendar" && (
              <div className="mt-6 space-y-2 w-full max-w-xs">
                <button
                  onClick={() => { sounds.tap(); window.location.href = "/api/auth/google"; }}
                  className="w-full card p-3 flex items-center gap-3 press-scale"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-sm text-[var(--color-text)]">Google Calendar</span>
                </button>
                <button
                  onClick={() => { sounds.tap(); window.location.href = "/api/auth/microsoft"; }}
                  className="w-full card p-3 flex items-center gap-3 press-scale"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                  <span className="text-sm text-[var(--color-text)]">Outlook / Microsoft 365</span>
                </button>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">Puedes hacerlo después desde Settings</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress + Next button */}
      <div className="space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-[var(--color-primary)]" : i < step ? "w-1.5 bg-[var(--color-primary-light)]" : "w-1.5 bg-[var(--color-surface-light)]"
              }`}
            />
          ))}
        </div>
        <button onClick={handleNext} className="btn btn-primary w-full py-3">
          {step === steps.length - 1 ? "Empezar" : "Siguiente"}
        </button>
      </div>
    </motion.div>
  );
}

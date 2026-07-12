"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface VoiceButtonProps {
  onResult: (transcript: string) => void;
  isProcessing: boolean;
}

export default function VoiceButton({ onResult, isProcessing }: VoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened (triggers iOS keyboard with dictation mic)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleOpen = () => {
    sounds.tap();
    setIsOpen(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;
    sounds.success();
    onResult(input.trim());
    setInput("");
    setIsOpen(false);
  };

  const handleClose = () => {
    sounds.tap();
    setInput("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Main button */}
      <motion.button
        onClick={handleOpen}
        disabled={isProcessing}
        whileTap={{ scale: 0.9 }}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          isProcessing
            ? "bg-[var(--color-surface-light)]"
            : "bg-[var(--color-primary)] glow-primary hover:bg-[var(--color-primary-light)]"
        }`}
      >
        {isProcessing ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        )}
      </motion.button>

      {/* Quick input overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
            
            {/* Input panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative glass border-t border-[var(--color-border)] p-4 pb-8 safe-bottom"
            >
              <div className="w-10 h-1 rounded-full bg-[var(--color-surface-light)] mx-auto mb-4" />
              
              <p className="text-xs text-[var(--color-text-muted)] text-center mb-3">
                Escribí o usá el micrófono del teclado para dictar
              </p>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ej: Tengo que ir al super a comprar leche..."
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="on"
                  className="input flex-1 !rounded-full !px-4 !py-3"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-30 transition-opacity flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </motion.button>
              </form>

              {/* Quick suggestions */}
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                {["Organizar mi día", "Lista del super", "Recordame a las..."].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); sounds.tap(); }}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] press-scale"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

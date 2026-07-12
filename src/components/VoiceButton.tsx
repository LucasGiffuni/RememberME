"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface VoiceButtonProps {
  onResult: (transcript: string) => void;
  isProcessing: boolean;
}

export default function VoiceButton({ onResult, isProcessing }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      sounds.error();
      return;
    }

    sounds.startRecording();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      onResult(transcript);
      stopListening();
    };

    recognition.onerror = () => {
      sounds.error();
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    sounds.stopRecording();
    setIsListening(false);
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring animation when listening */}
      {isListening && (
        <motion.div
          className="absolute w-[72px] h-[72px] rounded-full border-2 border-[var(--color-danger)]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <motion.button
        onClick={handleClick}
        disabled={isProcessing}
        whileTap={{ scale: 0.9 }}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
          isListening
            ? "bg-[var(--color-danger)] animate-recording"
            : isProcessing
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
        ) : isListening ? (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-white rounded-full"
                animate={{ height: [8, 20, 8] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}

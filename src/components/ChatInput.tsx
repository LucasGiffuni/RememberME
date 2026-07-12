"use client";

import { useState, useRef } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

export default function ChatInput({ onSubmit, isProcessing }: ChatInputProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    onSubmit(input);
    setInput("");
    
    // Simulate AI response (will be replaced by actual API)
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Listo, lo tengo anotado." }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-[var(--color-text-muted)] text-lg">Hablemos</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Escríbeme lo que necesites y te ayudo a organizarlo
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === "user"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text)]"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe aquí..."
          className="flex-1 bg-[var(--color-surface)] text-[var(--color-text)] rounded-full px-4 py-3 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="bg-[var(--color-primary)] text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}

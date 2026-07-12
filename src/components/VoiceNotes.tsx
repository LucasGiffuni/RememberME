"use client";

import { useState, useRef } from "react";
import { VoiceNote } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { sounds } from "@/lib/sounds";

interface VoiceNotesProps {
  notes: VoiceNote[];
  onAddNote: (transcript: string) => void;
  onDeleteNote: (id: string) => void;
}

export default function VoiceNotes({ notes, onAddNote, onDeleteNote }: VoiceNotesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const noteInputRef = useRef<HTMLInputElement>(null);

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    sounds.success();
    onAddNote(noteInput.trim());
    setNoteInput("");
  };

  const filteredNotes = searchQuery
    ? notes.filter((n) =>
        n.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-4">
      {/* Add note input */}
      <form onSubmit={(e) => { e.preventDefault(); handleAddNote(); }} className="flex gap-2">
        <input
          ref={noteInputRef}
          type="text"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Dictá o escribí una nota rápida..."
          enterKeyHint="send"
          autoCorrect="on"
          className="input flex-1"
        />
        <motion.button
          type="submit"
          disabled={!noteInput.trim()}
          whileTap={{ scale: 0.9 }}
          className="w-11 h-11 rounded-xl bg-[var(--color-primary)] glow-primary flex items-center justify-center flex-shrink-0 disabled:opacity-30"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </motion.button>
      </form>

      {/* Search */}
      {notes.length > 3 && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar notas..."
          className="input"
        />
      )}

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            {searchQuery ? "Sin resultados" : "Sin notas de voz"}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {searchQuery ? "Intenta con otra búsqueda" : "Graba una idea rápida con el micrófono"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: index * 0.03 }}
                className="card p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text)] leading-relaxed">
                      {note.transcript}
                    </p>
                    {note.summary && (
                      <p className="text-xs text-[var(--color-primary-light)] mt-1.5 italic">
                        {note.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(note.createdAt)}
                      </span>
                      {note.tags && note.tags.map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { sounds.delete(); onDeleteNote(note.id); }}
                    className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

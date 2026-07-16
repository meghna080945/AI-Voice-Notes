"use client";

import { NoteItem } from "./NoteItem";
import type { Note } from "@/lib/db";

interface NotesListProps {
  notes: Note[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function NotesList({ notes, loading, onDelete }: NotesListProps) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading notes…</p>;
  }
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-500">
        No notes yet. Record your first one above.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <NoteItem key={n.id} note={n} onDelete={onDelete} />
      ))}
    </ul>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { addNote, deleteNote, getAllNotes, type Note } from "./db";

// Hook that loads notes from IndexedDB on mount and exposes CRUD operations.
// We re-fetch after every mutation; for an MVP this is simpler than a live
// query and the dataset is small.

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await getAllNotes();
    setNotes(all);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getAllNotes();
        if (!cancelled) setNotes(all);
      } catch (err) {
        // IndexedDB unavailable (SSR or restricted env) — leave the list empty.
        console.error("Failed to load notes", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveNote = useCallback(
    async (input: Omit<Note, "id" | "createdAt">) => {
      const note: Note = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      await addNote(note);
      await refresh();
      return note;
    },
    [refresh],
  );

  const removeNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
      await refresh();
    },
    [refresh],
  );

  return { notes, loading, saveNote, removeNote, refresh };
}

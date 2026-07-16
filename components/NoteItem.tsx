"use client";

import { useEffect, useState } from "react";
import type { Note } from "@/lib/db";

interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => void;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function NoteItem({ note, onDelete }: NoteItemProps) {
  // Create an object URL per-mount and revoke on unmount to avoid memory leaks.
  // We store the URL in state so it doesn't change between renders.
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(note.audio);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [note.audio]);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{note.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(note.createdAt)} · {formatDuration(note.duration)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          aria-label={`Delete ${note.title}`}
        >
          Delete
        </button>
      </div>

      {url ? (
        <audio controls src={url} className="mt-3 w-full" preload="metadata" />
      ) : null}

      {note.transcript ? (
        <details className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <summary className="cursor-pointer text-slate-500">Transcript</summary>
          <p className="mt-2 whitespace-pre-wrap">{note.transcript}</p>
        </details>
      ) : null}
    </li>
  );
}

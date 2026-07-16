"use client";

import { Recorder } from "@/components/Recorder";
import { NotesList } from "@/components/NotesList";
import { useNotes } from "@/lib/useNotes";

export default function HomePage() {
  const { notes, loading, saveNote, removeNote } = useNotes();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Voice Notes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Record, save, and play back voice notes. Everything stays on your device.
        </p>
      </header>

      <div className="space-y-8">
        <Recorder
          onSave={async ({ title, audio, duration, transcript }) => {
            await saveNote({ title, audio, duration, transcript });
          }}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your notes
          </h2>
          <NotesList notes={notes} loading={loading} onDelete={removeNote} />
        </section>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRecorder } from "@/lib/useRecorder";

interface RecorderProps {
  onSave: (input: { title: string; audio: Blob; duration: number; transcript: string }) => Promise<void>;
}

function defaultTitle(): string {
  const d = new Date();
  return `Note — ${d.toLocaleString()}`;
}

export function Recorder({ onSave }: RecorderProps) {
  const { status, audioBlob, transcript, durationMs, error, isSupported, startRecording, stopRecording, reset } =
    useRecorder();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const recording = status === "recording";
  const hasRecording = !!audioBlob;

  async function handleSave() {
    if (!audioBlob) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim() || defaultTitle(),
        audio: audioBlob,
        duration: Math.round(durationMs / 1000),
        transcript,
      });
      setTitle("");
      reset();
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setTitle("");
    reset();
  }

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        Audio recording isn&apos;t supported in this browser. Try Chrome or Edge.
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {!hasRecording ? (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={
              "inline-flex h-12 w-12 items-center justify-center rounded-full text-white transition " +
              (recording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-900 hover:bg-slate-800")
            }
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? (
              <span className="block h-4 w-4 rounded-sm bg-white" />
            ) : (
              <span className="block h-4 w-4 rounded-full bg-white" />
            )}
          </button>
        ) : null}

        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">
            {recording
              ? "Recording… click to stop"
              : hasRecording
                ? "Recording captured"
                : "Click to record"}
          </p>
          {hasRecording ? (
            <p className="text-xs text-slate-500">
              {(durationMs / 1000).toFixed(1)}s
              {transcript ? " · transcript ready" : ""}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Audio is saved locally in your browser.
            </p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {hasRecording ? (
        <div className="mt-5 space-y-3">
          {transcript ? (
            <details className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700" open>
              <summary className="cursor-pointer text-slate-500">Transcript</summary>
              <p className="mt-2 whitespace-pre-wrap">{transcript}</p>
            </details>
          ) : null}

          <label className="block text-sm">
            <span className="text-slate-700">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle()}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save note"}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

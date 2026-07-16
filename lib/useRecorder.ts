"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Recorder hook: captures audio via MediaRecorder and (when available) a transcript
// via the Web Speech API running in parallel. The audio is the source of truth;
// the transcript is a nice-to-have that gracefully no-ops on browsers that don't
// support SpeechRecognition (Firefox, Safari).

export type RecorderStatus = "idle" | "recording" | "stopped" | "error";

export interface RecorderResult {
  status: RecorderStatus;
  audioBlob: Blob | null;
  transcript: string;
  durationMs: number;
  error: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

// Browser-provided types are not in the standard lib. Keep them local so we
// don't need @types/dom-speech-recognition in package.json.
interface SpeechRecognitionEvent extends Event {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string };
    };
  };
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

export function useRecorder(): RecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs let us tear down from async callbacks without re-binding handlers
  // every render.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startedAtRef = useRef<number>(0);
  const stopResolveRef = useRef<(() => void) | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  // Cleanup on unmount: stop tracks, abort recognition.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.abort();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Audio recording is not supported in this browser.");
      setStatus("error");
      return;
    }
    setError(null);
    setAudioBlob(null);
    setTranscript("");
    setDurationMs(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (stopResolveRef.current) {
          stopResolveRef.current();
          stopResolveRef.current = null;
        }
      };
      recorder.onerror = (e) => {
        setError(`Recorder error: ${(e as ErrorEvent).message ?? "unknown"}`);
        setStatus("error");
      };

      startedAtRef.current = Date.now();
      recorder.start();

      // Best-effort transcript capture. Failures here are silent — audio still works.
      const SR = getSpeechRecognitionCtor();
      if (SR) {
        try {
          const rec = new SR();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
          rec.onresult = (event) => {
            let combined = "";
            for (let i = 0; i < event.results.length; i++) {
              const r = event.results[i];
              combined += r[0]?.transcript ?? "";
            }
            setTranscript(combined.trim());
          };
          rec.onerror = () => {
            // no-op: noisy, and we don't want to fail the recording
          };
          rec.start();
          recognitionRef.current = rec;
        } catch {
          // ignore
        }
      }

      setStatus("recording");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access the microphone.";
      setError(message);
      setStatus("error");
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      setStatus("stopped");
      setDurationMs(Date.now() - startedAtRef.current);
      recorder.stop();
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setTranscript("");
    setDurationMs(0);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    audioBlob,
    transcript,
    durationMs,
    error,
    isSupported,
    startRecording,
    stopRecording,
    reset,
  };
}

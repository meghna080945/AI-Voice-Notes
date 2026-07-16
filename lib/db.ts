// IndexedDB schema and CRUD helpers for voice notes.
// We store audio as a Blob alongside metadata. IndexedDB can hold Blobs natively,
// which keeps everything in one place and avoids quota gymnastics with separate stores.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Note {
  id: string;
  title: string;
  audio: Blob;
  duration: number; // seconds
  createdAt: number; // epoch ms
  transcript: string;
}

interface VoiceNotesDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "voice-notes";
const DB_VERSION = 1;
const STORE = "notes";

let dbPromise: Promise<IDBPDatabase<VoiceNotesDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<VoiceNotesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function addNote(note: Note): Promise<void> {
  const db = await getDB();
  await db.put(STORE, note);
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDB();
  // Newest first
  const all = await db.getAllFromIndex(STORE, "by-createdAt");
  return all.reverse();
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

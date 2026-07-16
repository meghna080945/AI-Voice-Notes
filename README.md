# Voice Notes

> Built with `minimax-m3`, the open-source model that's been my escape hatch from Claude Code's pricing.

Capture thoughts the moment they happen — speak, transcribe, and replay. **All in your browser, nothing on a server.**

A privacy-first, locally-running voice notes app built with **Next.js 14**, **React 18**, **TypeScript**, **Tailwind CSS**, and the browser's native **MediaRecorder + Web Speech APIs**. Audio and transcripts are persisted in **IndexedDB**, so recordings survive a refresh and never leave the device.

---

## Why `minimax-m3`, and Why Not Claude Code

I built this project on `minimax-m3:cloud` because I want to ship products, not pay Claude Code's per-token bill. Context window pricing has been the single biggest blocker between me and actually finishing side projects — every long conversation, every multi-file refactor, every back-and-forth during debugging adds up fast, and on Claude Code it adds up *every single time*.

`minimax-m3` is open-source and effectively free to run, which means I can use it as a real pair-programmer across an entire project without watching a meter tick in the corner. For a solo dev shipping personal tools, that changes the math completely: I can iterate, throw things away, restart, ask "what's wrong with this approach" ten times in a row, and the cost is still zero.

This doesn't mean `minimax-m3` is the best model in the world. It means it's *good enough to ship with*, the licensing is open, and the cost doesn't punish me for thinking out loud. That's the trade-off I care about, and it's why every project in my portfolio is going to be built on it from now on.

If you're reading this and you're in the same boat — tired of pricing shaping what you're allowed to build — try a free open-source model. You'll be surprised how much you can ship when the context window isn't a budget line.

---

## The Everyday Problem

You know the moment — you're walking, cooking, commuting, half-asleep, or in the middle of something else, and a thought worth keeping pops into your head:

- A product idea you don't want to lose
- A quick item to add to tomorrow's list
- A paragraph you want to remember for the blog you're writing
- A reminder to message a friend about something
- A meeting takeaway scribbled in your head because you can't type right now

By the time you reach for a keyboard, the thought is gone.

**Voice is the fastest capture medium humans have** — about 3x faster than typing. So why don't I use voice notes more?

Because every mainstream voice-notes app has the same trade-off:

| Pain point | What it costs you |
|---|---|
| They upload to a cloud | Your voice — and therefore your identity, mood, surroundings, sensitive context — is on someone else's server. |
| They require an account | Friction before you can even start. |
| They depend on a network | No internet = no notes. |
| They make you install an app | You don't always want a 200 MB install for a 10-second thought. |
| The UI is bloated | Notes buried in tabs, folders, sync settings, paywalls. |
| Search is weak or paid | You can listen, but you can't *find* what you said. |

**Voice Notes is the antidote**: a single-page web app I can open in any modern browser, click a button, speak, and have my words instantly transcribed and saved — with zero network round-trips and zero accounts.

---

## What This App Solves

1. **Zero-friction capture** — one click to record, one click to stop, one click to save.
2. **Local-first storage** — audio Blobs and transcripts live in the browser's IndexedDB. No backend, no cloud, no telemetry.
3. **Live transcription** — speech is converted to text *as I speak* using the Web Speech API, so I can read what I said without replaying.
4. **Instant playback** — every saved note gets a native `<audio>` player with metadata preload.
5. **Searchable-by-eye** — transcripts are expandable under each note; scan a list to find what I need.
6. **Resilient design** — if the browser doesn't support the Speech API (Firefox, Safari), the audio still records and plays. The transcript is a bonus, not a blocker.
7. **No account, no install** — open the URL, grant mic permission, done.

---

## The AI Solution — Design

The "AI" component of this app is deliberately light, browser-native, and **non-blocking**. Here's how it's wired:

### 1. Audio capture — `MediaRecorder`
- I request the mic via `navigator.mediaDevices.getUserMedia({ audio: true })`.
- I pick the best supported MIME type from a candidate list (`audio/webm;codecs=opus` -> `audio/webm` -> `audio/mp4`).
- Audio is sliced into chunks and assembled into a single `Blob` on stop.
- Duration is computed from `Date.now()` deltas around the recorder lifecycle.

### 2. Live transcription — `SpeechRecognition` / `webkitSpeechRecognition`
- Runs in **parallel** with the recorder, on the same mic stream.
- `continuous: true` + `interimResults: true` so I get a running transcript during the recording.
- Each `onresult` event concatenates all final segments into a single transcript string.
- **Best-effort by design**: if the constructor is missing, the constructor throws, or `onerror` fires, I swallow the failure and let the audio capture succeed anyway.
- Language defaults to `navigator.language` so it follows the user's browser settings.

### 3. Persistence — IndexedDB via `idb`
- Single object store `notes` keyed by a UUID v4 (`crypto.randomUUID()`).
- A `by-createdAt` index lets me list newest-first with one call.
- Each record holds `{ id, title, audio: Blob, duration, createdAt, transcript }` — Blob storage in IndexedDB is native, so I don't need a separate file store.
- Notes survive reloads, browser restarts, and even offline use.

### 4. React hooks glue — `useRecorder`, `useNotes`
- **`useRecorder`** owns all recorder/speech state. It exposes a stable API (`startRecording`, `stopRecording`, `reset`) and tears down streams + recognition on unmount.
- **`useNotes`** owns the IndexedDB CRUD lifecycle. It re-fetches after every mutation (simple, correct, and cheap for a small dataset).
- The page-level component composes them: a `Recorder` for capture, a `NotesList`/`NoteItem` for playback.

### 5. Playback — native `<audio>`
- I mint a fresh `URL.createObjectURL(blob)` per note, render the native player, and `revokeObjectURL` on unmount to avoid leaks.

### Why this design?

- **Local-first by default.** No server = no auth, no quota, no breach surface, no latency.
- **Graceful degradation.** The transcript is a value-add; audio is the source of truth. If the browser can't transcribe, I still have a recording.
- **No lock-in.** The data is in IndexedDB; the schema is four fields. I can export or migrate easily.

---

## Project Structure

```
voice-notes/
|-- app/                        # Next.js App Router
|   |-- globals.css             # Tailwind base + minimal global styles
|   |-- layout.tsx              # Root <html>/<body> wrapper + metadata
|   +-- page.tsx                # Home page — Recorder + NotesList composition
|
|-- components/                 # Presentational + interactive React components
|   |-- Recorder.tsx            # Record/stop/save UI, title input, transcript preview
|   |-- NotesList.tsx           # Loading / empty / list states
|   +-- NoteItem.tsx            # One saved note: title, timestamp, audio player, transcript
|
|-- lib/                        # All business logic (browser-only)
|   |-- useRecorder.ts          # Hook wrapping MediaRecorder + SpeechRecognition
|   |-- useNotes.ts             # Hook wrapping IndexedDB CRUD
|   +-- db.ts                   # idb schema, open/upgrade, addNote/getAllNotes/deleteNote
|
|-- public/                     # Static assets served as-is
|
|-- .gitignore                  # node_modules, .next, .env*, logs, macOS noise
|-- next.config.js              # Default Next.js config
|-- tailwind.config.ts          # Tailwind content globs
|-- postcss.config.js           # Tailwind/PostCSS pipeline
|-- tsconfig.json               # Strict TS, @/* path alias to project root
|-- package.json                # next, react, idb, tailwind, typescript
+-- README.md                   # You are here
```

### Data model

```ts
interface Note {
  id: string;          // crypto.randomUUID()
  title: string;       // user-provided or auto-stamped
  audio: Blob;         // webm/opus or mp4 depending on browser
  duration: number;    // seconds (rounded)
  createdAt: number;   // epoch ms — used for ordering
  transcript: string;  // "" if SpeechRecognition was unavailable
}
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | File-based routing, zero-config TS, fast dev loop, great DX. |
| UI | **React 18** | Hooks, concurrent rendering, broad ecosystem. |
| Language | **TypeScript (strict)** | Catches the boring bugs before they reach users. |
| Styling | **Tailwind CSS 3** | Utility-first, no design-system overhead for an MVP. |
| Local DB | **IndexedDB** via [`idb`](https://github.com/jakearchibald/idb) | Native Blob storage, no quota dance. |
| Audio | **`MediaRecorder` API** | No server, no encoding pipeline, browser-native. |
| Transcription | **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) | Live, on-device on Chromium-backed browsers. |
| AI assistant during dev | **`minimax-m3`** | Open-source, zero context-cost, good enough to ship with. |

---

## How to Run Locally

### Prerequisites

- **Node.js 18.17+** (Next.js 14 requirement)
- **npm** (or pnpm / yarn — commands below use `npm`)
- A **Chromium-based browser** (Chrome, Edge, Brave, Arc) for full recording + transcription support
  - Firefox / Safari will record and play audio; the transcript will be empty because the Web Speech API isn't available there yet.

### 1. Clone & install

```bash
git clone https://github.com/meghna080945/AI-Voice-Notes.git
cd AI-Voice-Notes
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in the browser.

### 3. Grant microphone permission

The browser will prompt for mic access on the first record. You must allow it — without it, the MediaRecorder can't start. (This is a browser-level policy; the app can't bypass it.)

### 4. Build for production (optional)

```bash
npm run build   # production build into .next/
npm run start   # serve the production build on :3000
```

### 5. Lint

```bash
npm run lint
```

> **Heads up:** IndexedDB is per-origin. If you switch from `localhost` to a LAN IP (e.g. `http://192.168.1.10:3000`), you'll see a fresh empty database. That data is still yours, just stored under the new origin.

---

## Browser Support

| Browser | Record | Transcribe | Playback |
|---|---|---|---|
| Chrome / Edge / Brave / Arc (desktop & Android) | Yes | Yes | Yes |
| Safari (macOS / iOS) | Yes | No (no `SpeechRecognition`) | Yes |
| Firefox | Yes | No (no `SpeechRecognition`) | Yes |

When transcription isn't available, the recorder silently skips it; the note saves with an empty transcript field.

---

## Privacy

- **No backend.** The repo has no API routes, no server actions, no analytics.
- **No telemetry.** The app never calls out to a third party.
- **No accounts.** Nothing to sign up for, nothing to leak.
- **Local data.** Audio Blobs and transcripts live in *your* browser. Clearing site data deletes them — permanently.

This is intentional. The threat model is "I don't want a stranger's server to know what I said to myself at 2am."

---

## What `minimax-m3` Helped Me With on This Project

`minimax-m3` was my thinking partner for this build. Concretely, it helped with:

- **Architecture & scope discipline** — pushing back on over-engineering. The temptation with a "voice notes" app is to bolt on sync, sharing, summarization, embeddings, accounts, etc. The right MVP is *capture -> store -> play back* and nothing more. `minimax-m3` kept the surface area honest.
- **API quirk handling** — `MediaRecorder` and `SpeechRecognition` both have footguns (mime-type support varies, `webkitSpeechRecognition` only on Safari, `onerror` can fire for non-fatal network issues, etc.). The hook in `lib/useRecorder.ts` is intentionally defensive: best-effort transcript capture, typed browser-provided shapes kept local so I don't need extra type packages, and `try/catch` around anything that can fail before the user has had a chance to do anything wrong.
- **IndexedDB schema choices** — deciding to store the `Blob` *inside* the note record (rather than a separate file store) avoided a whole class of quota / cleanup bugs. Single store, one index, one round trip per CRUD.
- **React idioms** — `useRef` for state that needs to survive across async callbacks without re-binding handlers, `useCallback` for stable hook APIs, and a `cancelled` flag in `useNotes`'s mount effect to avoid setting state after unmount.
- **Code review** — catching things like *forgetting to revoke object URLs* on `NoteItem` unmount (memory leak) and *not handling SSR* in the IndexedDB layer.

In short: the app's design is simple on purpose, and `minimax-m3` was a multiplier on getting the simple thing to be *correct* — at a cost I can actually afford.

---

## Possible Next Steps

These are deliberately *not* in the current build, but they're obvious extensions:

- **Export / import** — download all notes as a single `.zip` (JSON metadata + audio files) and re-import on another device. Pure client-side using `JSZip` + `File System Access API`.
- **Search across transcripts** — client-side full-text search using something like [MiniSearch](https://lucaong.github.io/minisearch/) or [Lunr](https://lunrjs.com/).
- **Tagging & folders** — add a `tags: string[]` field to the `Note` schema and a new IndexedDB index.
- **Cloud sync (opt-in)** — end-to-end encrypted, gated behind a feature flag. The current local-first design is the privacy floor, not an oversight.
- **Smarter AI summaries** — pipe a saved transcript through a hosted model to produce titles, summaries, or action items.
- **Waveform visualization** — render the audio waveform under each note for at-a-glance scanning.
- **PWA / offline** — add a service worker so the app installs as a PWA and works fully offline (it already works offline, but a manifest + installable shell would make it feel native).

---

## Credits

- Built by **Meghna Gupta**.
- AI pair-programmer: **`minimax-m3`**, running on `minimax-m3:cloud`.
- Inspired by the universal frustration of losing a thought to the moment.

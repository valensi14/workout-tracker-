# Workout Tracker App — Design Spec

**Date:** 2026-04-17
**Status:** Approved

---

## Overview

A cross-platform workout tracking app inspired by Strong. Primary goals for v1:
1. Track progress over time (PRs, volume charts, history)
2. Follow structured programs (built-in and custom)

Local-only storage, no user accounts in v1.

---

## Architecture

**Monorepo** (pnpm workspaces):

```
apps/
  mobile/        ← Expo app (iOS + Android)
  web/           ← Vite web app

packages/
  core/          ← shared business logic (hooks, stores, utils)
  ui/            ← shared components (adapted per platform)
  db/            ← storage abstraction (SQLite on mobile, IndexedDB on web)
```

**Key technology choices:**
- **Framework:** Expo (React Native) for mobile, Vite for web
- **Navigation:** Expo Router (file-based, works on both mobile and web)
- **State:** Zustand for in-memory state (active workout session)
- **Storage:** `packages/db` wraps `expo-sqlite` on mobile and `idb` (IndexedDB) on web — same API, different driver
- **Charts:** Victory Native on mobile, Victory on web

---

## Data Model

```
Exercise
  id            TEXT PRIMARY KEY
  name          TEXT NOT NULL
  category      TEXT  -- push | pull | legs | core | cardio
  muscle_group  TEXT
  equipment     TEXT

Program
  id            TEXT PRIMARY KEY
  name          TEXT NOT NULL
  description   TEXT
  created_at    INTEGER  -- unix timestamp

Routine                    -- a day within a program (e.g. "Day A - Push")
  id            TEXT PRIMARY KEY
  program_id    TEXT REFERENCES Program(id)
  name          TEXT NOT NULL
  order         INTEGER

RoutineExercise            -- exercise slot in a routine
  id            TEXT PRIMARY KEY
  routine_id    TEXT REFERENCES Routine(id)
  exercise_id   TEXT REFERENCES Exercise(id)
  sets          INTEGER
  reps          TEXT  -- e.g. "5" or "8-12"
  order         INTEGER

WorkoutSession             -- a completed workout
  id            TEXT PRIMARY KEY
  routine_id    TEXT REFERENCES Routine(id)  -- nullable (freeform workouts)
  started_at    INTEGER
  finished_at   INTEGER
  notes         TEXT

WorkoutSet                 -- individual logged set
  id            TEXT PRIMARY KEY
  session_id    TEXT REFERENCES WorkoutSession(id)
  exercise_id   TEXT REFERENCES Exercise(id)
  set_number    INTEGER
  weight        REAL  -- stored in kg, converted on display
  reps          INTEGER
  rpe           REAL  -- nullable
  completed_at  INTEGER
```

**Key decisions:**
- `routine_id` on `WorkoutSession` is nullable — supports freeform workouts outside any program
- Weight stored in kg universally; unit preference (kg/lbs) is a display setting
- No user table — local-only, v1

---

## Features & Screens

### Mobile navigation (Expo Router tabs)

```
(tabs)/
  index          ← Today / Start Workout
  history        ← Past sessions list + detail view
  programs       ← Browse & follow programs
  exercises      ← Exercise library
  progress       ← Charts & PRs per exercise
```

### Core flows

**Active Workout**
- Start from a scheduled routine or freeform
- Each exercise displays sets as rows: weight × reps
- Tap a row to mark the set complete; swipe to delete
- Rest timer auto-starts after each completed set
- Finish workout persists the full session to db
- Crash recovery: Zustand state is mirrored to a `draft_session` in db after every set; restored on next open if session was never finished

**Programs**
- Built-in programs: PPL, 5/3/1, GZCLP
- Preview all days and exercises before starting
- "Start Program" sets it as active; Today tab shows next scheduled day automatically
- Custom programs: create routines, add exercises, set order

**Progress**
- Select any exercise → view:
  - All-time PR (best weight × reps)
  - Estimated 1RM over time (line chart)
  - Volume per session (sets × reps × weight)
  - Best set per session

**Web**
- Same screens and logic as mobile
- Sidebar navigation replaces tab bar
- Charts use additional horizontal space for wider date ranges

---

## Error Handling

- All db writes wrapped in try/catch; toast on failure: "Couldn't save — try again"
- Active workout crash recovery via `draft_session` (written after every set)
- No network error handling needed (local-only v1)
- Weight unit conversion handled in display layer only — raw data always kg

---

## Testing Strategy

- **Unit tests (Vitest):** `packages/core` — 1RM formula, volume calculations, program progression logic
- **Integration tests (Vitest + better-sqlite3):** `packages/db` layer with real in-memory SQLite — no mocks
- **E2E:** deferred to v2 — manual device testing covers the in-gym flow for v1
- No UI snapshot tests

---

## Out of Scope (v1)

- User accounts and cloud sync
- Social features
- Wearable / rep counting integrations
- AI-generated programs
- Notifications / rest timer push alerts

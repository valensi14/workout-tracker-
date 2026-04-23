# Workout Tracker

A cross-platform workout tracking app — web + mobile — built with React, Expo, and a shared TypeScript core.

---

## What it does

- **Start workouts** from templates or from scratch
- **Log sets** (weight + reps) with a green ✓ button per set
- **Rest timer** — add a countdown timer between sets (30s / 1m / 1.5m / 2m / 3m), adjust on the fly, beeps when done
- **Create templates** — build your own workout routines with exercises picked from a library of 250 real gym exercises grouped by muscle group
- **Workout history** — see all past sessions with duration
- **Progress charts** — volume over time per exercise
- **250 exercises** across 12 muscle groups (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Core, Full Body)

---

## Project structure

```
Elad/
├── apps/
│   ├── web/          ← Vite + React web app
│   └── mobile/       ← Expo (React Native) mobile app
├── packages/
│   ├── core/         ← Shared TypeScript types + business logic
│   ├── db/           ← Database layer (IndexedDB for web, SQLite for mobile)
│   └── ui/           ← Shared UI components
```

---

## Running the web app locally

**Requirements:** Node.js, pnpm

```bash
# Install dependencies (run once)
cd C:\Users\Mamriot_User\Desktop\Elad
pnpm install

# Start the web app
cd apps/web
node_modules\.bin\vite

# Open in browser
http://localhost:5173
```

**To open on your iPhone** (must be on same WiFi):
```bash
node_modules\.bin\vite --host
# Then open the "Network" URL shown in your browser on your iPhone
```

---

## Running the mobile app

**Requirements:** Expo Go app installed on your phone (free from App Store / Play Store)

```bash
cd apps/mobile
npx expo start
# Scan the QR code with your iPhone camera
```

---

## Deploying the web app

The app deploys automatically to GitHub Pages on every push to `master` via GitHub Actions.

**Live URL:** https://valensi14.github.io/workout-tracker-/

To trigger a deploy manually, just push any commit to `master`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Web frontend | React 18, Vite, React Router, Zustand |
| Mobile frontend | Expo, React Native, Expo Router |
| Shared logic | TypeScript, `@workout/core` |
| Web database | IndexedDB via `idb` |
| Mobile database | SQLite via `expo-sqlite` |
| Charts | Victory (web) + Victory Native (mobile) |
| Tests | Vitest + better-sqlite3 |

---

## Pages

| Page | Description |
|---|---|
| **Start Workout** | Quick start + template cards (2-col grid) |
| **Active Workout** | Log sets, add rest timers, finish workout |
| **History** | All past sessions with date and duration |
| **Exercises** | Full library of 250 exercises, searchable |
| **Progress** | Volume charts per exercise over time |
| **New Template** | Create a workout template with exercise picker |
| **Manage Templates** | View, start, or delete templates |

---

## Features breakdown

### Rest Timer
- Add via **"+ Add Timer"** button next to **"+ Add Set"**
- Presets: 30s, 1m, 1.5m, 2m, 3m
- Adjust with −15s / +15s while running
- Turns red in last 10 seconds
- Plays 3 beep sounds when time is up
- Can add multiple timers per exercise

### Exercise Library
- 250 real gym exercises
- 12 muscle groups
- Equipment types: free weight, machine, cable, bodyweight
- Searchable with live filtering

### Templates
- Create custom templates with any exercises
- Built-in example templates: 5/3/1, GZCLP, Push Pull Legs
- Start a workout directly from a template card

---

## Running tests

```bash
pnpm test
```

Tests cover: exercises, sessions, settings (packages/db/tests/queries.test.ts)

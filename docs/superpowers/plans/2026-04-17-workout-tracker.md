# Workout Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform workout tracking app (Expo mobile + Vite web) with local-only storage, structured program support, and progress charts.

**Architecture:** pnpm monorepo with shared `packages/core` (business logic), `packages/db` (storage abstraction), and `packages/ui` (shared components). Mobile uses `expo-sqlite`; web uses `idb` (IndexedDB). Both apps share the same Zustand stores and query layer via a common driver interface.

**Tech Stack:** Expo (React Native), Vite, TypeScript, Zustand, expo-sqlite, idb, Victory Native / Victory, Vitest, better-sqlite3 (tests only)

---

## File Map

```
workout-tracker/
  package.json                        ← pnpm workspace root
  pnpm-workspace.yaml
  tsconfig.base.json

  packages/
    core/
      package.json
      tsconfig.json
      src/
        types.ts                      ← shared domain types
        calculations.ts               ← 1RM formula, volume
        program.ts                    ← next-routine logic
        index.ts
      tests/
        calculations.test.ts
        program.test.ts

    db/
      package.json
      tsconfig.json
      src/
        interface.ts                  ← platform-agnostic DB interface
        schema.ts                     ← CREATE TABLE SQL + migration runner
        drivers/
          mobile.ts                   ← expo-sqlite driver
          web.ts                      ← idb driver
        queries/
          exercises.ts
          programs.ts
          sessions.ts
          settings.ts
        seed/
          exercises.ts                ← ~50 built-in exercises
          programs.ts                 ← PPL, 5/3/1, GZCLP definitions
        index.ts
      tests/
        queries.test.ts               ← integration tests (better-sqlite3)

    ui/
      package.json
      tsconfig.json
      src/
        SetRow.tsx
        ExerciseSection.tsx
        RestTimer.tsx
        ProgressChart.tsx
        ProgramCard.tsx
        index.ts

  apps/
    mobile/
      package.json
      app.json
      tsconfig.json
      db.ts                           ← init mobile driver
      store/
        workout.ts                    ← Zustand active-session store
      app/
        _layout.tsx
        (tabs)/
          _layout.tsx
          index.tsx                   ← Today
          history.tsx
          programs.tsx
          exercises.tsx
          progress.tsx
        workout/
          [id].tsx                    ← Active workout screen

    web/
      package.json
      tsconfig.json
      vite.config.ts
      index.html
      src/
        main.tsx
        App.tsx
        db.ts                         ← init web driver
        store/
          workout.ts                  ← Zustand active-session store
        components/
          Sidebar.tsx
          Layout.tsx
        pages/
          Today.tsx
          History.tsx
          Programs.tsx
          Exercises.tsx
          Progress.tsx
          ActiveWorkout.tsx
```

---

## Phase 1: Foundation (packages/core + packages/db)

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `packages/core/package.json`
- Create: `packages/db/package.json`
- Create: `packages/ui/package.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "workout-tracker",
  "private": true,
  "scripts": {
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "jsx": "react-native",
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

- [ ] **Step 4: Create packages/core/package.json**

```json
{
  "name": "@workout/core",
  "version": "0.0.1",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 5: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 6: Create packages/db/package.json**

```json
{
  "name": "@workout/db",
  "version": "0.0.1",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "@workout/core": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "better-sqlite3": "^9.6.0",
    "@types/better-sqlite3": "^7.6.10",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 7: Create packages/db/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 8: Create packages/ui/package.json**

```json
{
  "name": "@workout/ui",
  "version": "0.0.1",
  "main": "src/index.ts",
  "dependencies": {
    "@workout/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  },
  "peerDependencies": {
    "react": "*",
    "react-native": "*"
  }
}
```

- [ ] **Step 9: Install dependencies**

```bash
cd /path/to/workout-tracker
pnpm install
```

Expected: packages installed, `node_modules` at root and in each package.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json packages/
git commit -m "chore: monorepo scaffold with pnpm workspaces"
```

---

### Task 2: packages/core — domain types

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: Create types.ts**

```ts
// packages/core/src/types.ts

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders'
  | 'biceps' | 'triceps' | 'legs'
  | 'core' | 'cardio' | 'full_body';

export type Category = 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscleGroup: MuscleGroup;
  equipment: string | null;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: number; // unix ms
}

export interface Routine {
  id: string;
  programId: string;
  name: string;
  order: number;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  sets: number;
  reps: string; // e.g. "5" or "8-12"
  order: number;
}

export interface WorkoutSession {
  id: string;
  routineId: string | null;
  startedAt: number;
  finishedAt: number | null; // null = in-progress draft
  notes: string | null;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number; // kg
  reps: number;
  rpe: number | null;
  completedAt: number;
}

export interface UserSetting {
  key: string;
  value: string;
}

export type WeightUnit = 'kg' | 'lbs';
```

- [ ] **Step 2: Create index.ts**

```ts
// packages/core/src/index.ts
export * from './types';
export * from './calculations';
export * from './program';
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/
git commit -m "feat(core): add domain types"
```

---

### Task 3: packages/core — calculations (TDD)

**Files:**
- Create: `packages/core/tests/calculations.test.ts`
- Create: `packages/core/src/calculations.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { epley1RM, displayWeight, calculateVolume } from '../src/calculations';

describe('epley1RM', () => {
  it('returns weight when reps is 1', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });

  it('estimates 1RM from multiple reps', () => {
    // Epley: weight * (1 + reps/30)
    expect(epley1RM(90, 10)).toBeCloseTo(120, 0);
  });

  it('rounds to nearest 0.5', () => {
    const result = epley1RM(85, 5);
    expect(result % 0.5).toBe(0);
  });
});

describe('displayWeight', () => {
  it('returns kg value unchanged', () => {
    expect(displayWeight(100, 'kg')).toBe(100);
  });

  it('converts kg to lbs', () => {
    expect(displayWeight(100, 'lbs')).toBeCloseTo(220.5, 0);
  });
});

describe('calculateVolume', () => {
  it('sums weight * reps across sets', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 100, reps: 5 },
      { weight: 100, reps: 4 },
    ];
    expect(calculateVolume(sets)).toBe(1400);
  });

  it('returns 0 for empty sets', () => {
    expect(calculateVolume([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd packages/core && pnpm test
```

Expected: FAIL — `calculations` not found.

- [ ] **Step 3: Implement calculations.ts**

```ts
// packages/core/src/calculations.ts
import type { WeightUnit } from './types';

/** Epley formula: estimated 1-rep max */
export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  const raw = weight * (1 + reps / 30);
  return Math.round(raw * 2) / 2; // round to nearest 0.5
}

/** Convert weight for display */
export function displayWeight(weightKg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? Math.round(weightKg * 2.20462 * 10) / 10 : weightKg;
}

/** Total volume (kg) across a set of logged sets */
export function calculateVolume(
  sets: Array<{ weight: number; reps: number }>
): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd packages/core && pnpm test
```

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/calculations.ts packages/core/tests/calculations.test.ts
git commit -m "feat(core): add 1RM, volume, and weight display calculations"
```

---

### Task 4: packages/core — program progression (TDD)

**Files:**
- Create: `packages/core/tests/program.test.ts`
- Create: `packages/core/src/program.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/program.test.ts
import { describe, it, expect } from 'vitest';
import { getNextRoutineIndex } from '../src/program';

describe('getNextRoutineIndex', () => {
  it('returns 0 for first session of a program', () => {
    expect(getNextRoutineIndex(null, 3)).toBe(0);
  });

  it('increments index by 1', () => {
    expect(getNextRoutineIndex(0, 3)).toBe(1);
  });

  it('wraps back to 0 after last routine', () => {
    expect(getNextRoutineIndex(2, 3)).toBe(0);
  });

  it('handles single-routine programs', () => {
    expect(getNextRoutineIndex(0, 1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd packages/core && pnpm test
```

Expected: FAIL — `program` not found.

- [ ] **Step 3: Implement program.ts**

```ts
// packages/core/src/program.ts

/**
 * Returns the index of the next routine to run.
 * @param currentIndex - last completed routine index, or null if program just started
 * @param totalRoutines - total number of routines in the program
 */
export function getNextRoutineIndex(
  currentIndex: number | null,
  totalRoutines: number
): number {
  if (currentIndex === null) return 0;
  return (currentIndex + 1) % totalRoutines;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd packages/core && pnpm test
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/program.ts packages/core/tests/program.test.ts
git commit -m "feat(core): add program progression logic"
```

---

### Task 5: packages/db — schema and interface

**Files:**
- Create: `packages/db/src/interface.ts`
- Create: `packages/db/src/schema.ts`

- [ ] **Step 1: Create interface.ts**

```ts
// packages/db/src/interface.ts
import type {
  Exercise, Program, Routine, RoutineExercise,
  WorkoutSession, WorkoutSet, UserSetting
} from '@workout/core';

export interface DB {
  // exercises
  getExercises(): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | null>;

  // programs + routines
  getPrograms(): Promise<Program[]>;
  getRoutinesByProgram(programId: string): Promise<Routine[]>;
  getRoutineExercises(routineId: string): Promise<RoutineExercise[]>;

  // sessions
  getDraftSession(): Promise<WorkoutSession | null>;
  createSession(session: WorkoutSession): Promise<void>;
  finishSession(id: string, finishedAt: number): Promise<void>;
  getSessions(limit?: number): Promise<WorkoutSession[]>;
  getSessionById(id: string): Promise<WorkoutSession | null>;

  // sets
  addSet(set: WorkoutSet): Promise<void>;
  deleteSet(id: string): Promise<void>;
  getSetsBySession(sessionId: string): Promise<WorkoutSet[]>;
  getSetsByExercise(exerciseId: string): Promise<WorkoutSet[]>;

  // settings
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  // seed
  seedExercises(exercises: Exercise[]): Promise<void>;
  seedPrograms(
    programs: Program[],
    routines: Routine[],
    routineExercises: RoutineExercise[]
  ): Promise<void>;
}
```

- [ ] **Step 2: Create schema.ts**

```ts
// packages/db/src/schema.ts

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS exercise (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment    TEXT
  );

  CREATE TABLE IF NOT EXISTS program (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    created_at   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS routine (
    id         TEXT PRIMARY KEY,
    program_id TEXT NOT NULL REFERENCES program(id),
    name       TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS routine_exercise (
    id          TEXT PRIMARY KEY,
    routine_id  TEXT NOT NULL REFERENCES routine(id),
    exercise_id TEXT NOT NULL REFERENCES exercise(id),
    sets        INTEGER NOT NULL,
    reps        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS workout_session (
    id          TEXT PRIMARY KEY,
    routine_id  TEXT REFERENCES routine(id),
    started_at  INTEGER NOT NULL,
    finished_at INTEGER,
    notes       TEXT
  );

  CREATE TABLE IF NOT EXISTS workout_set (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES workout_session(id),
    exercise_id  TEXT NOT NULL REFERENCES exercise(id),
    set_number   INTEGER NOT NULL,
    weight       REAL NOT NULL,
    reps         INTEGER NOT NULL,
    rpe          REAL,
    completed_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_setting (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;
```

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/interface.ts packages/db/src/schema.ts
git commit -m "feat(db): add DB interface and schema SQL"
```

---

### Task 6: packages/db — query layer + integration tests

**Files:**
- Create: `packages/db/src/queries/exercises.ts`
- Create: `packages/db/src/queries/programs.ts`
- Create: `packages/db/src/queries/sessions.ts`
- Create: `packages/db/src/queries/settings.ts`
- Create: `packages/db/tests/queries.test.ts`

> Note: Tests use `better-sqlite3` (sync Node.js SQLite) to exercise the query SQL directly — no mocking, no drivers. The query functions accept a generic `RunFn` / `GetFn` so they work with any SQLite-compatible backend.

- [ ] **Step 1: Write failing integration test**

```ts
// packages/db/tests/queries.test.ts
import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach } from 'vitest';
import { CREATE_TABLES_SQL } from '../src/schema';
import { getExercises, seedExercises } from '../src/queries/exercises';
import { createSession, getDraftSession, finishSession } from '../src/queries/sessions';
import { getSetting, setSetting } from '../src/queries/settings';

function makeDb() {
  const db = new Database(':memory:');
  db.exec(CREATE_TABLES_SQL);
  return db;
}

type SyncDb = ReturnType<typeof makeDb>;

function run(db: SyncDb) {
  return (sql: string, params: unknown[] = []) => { db.prepare(sql).run(...params); };
}

function get(db: SyncDb) {
  return <T>(sql: string, params: unknown[] = []): T | null =>
    (db.prepare(sql).get(...params) as T) ?? null;
}

function all(db: SyncDb) {
  return <T>(sql: string, params: unknown[] = []): T[] =>
    db.prepare(sql).all(...params) as T[];
}

describe('exercises', () => {
  let db: SyncDb;
  beforeEach(() => { db = makeDb(); });

  it('returns empty list when no exercises', () => {
    expect(getExercises(all(db))).toEqual([]);
  });

  it('returns seeded exercises', () => {
    const ex = [{ id: '1', name: 'Squat', category: 'legs' as const, muscleGroup: 'legs' as const, equipment: null }];
    seedExercises(run(db), ex);
    const result = getExercises(all(db));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Squat');
  });
});

describe('sessions', () => {
  let db: SyncDb;
  beforeEach(() => { db = makeDb(); });

  it('returns null when no draft session', () => {
    expect(getDraftSession(get(db))).toBeNull();
  });

  it('returns in-progress session as draft', () => {
    const session = { id: 's1', routineId: null, startedAt: 1000, finishedAt: null, notes: null };
    createSession(run(db), session);
    expect(getDraftSession(get(db))?.id).toBe('s1');
  });

  it('draft is null after finishing session', () => {
    const session = { id: 's1', routineId: null, startedAt: 1000, finishedAt: null, notes: null };
    createSession(run(db), session);
    finishSession(run(db), 's1', 2000);
    expect(getDraftSession(get(db))).toBeNull();
  });
});

describe('settings', () => {
  let db: SyncDb;
  beforeEach(() => { db = makeDb(); });

  it('returns null for missing key', () => {
    expect(getSetting(get(db), 'weight_unit')).toBeNull();
  });

  it('stores and retrieves a setting', () => {
    setSetting(run(db), 'weight_unit', 'lbs');
    expect(getSetting(get(db), 'weight_unit')).toBe('lbs');
  });

  it('overwrites an existing setting', () => {
    setSetting(run(db), 'weight_unit', 'kg');
    setSetting(run(db), 'weight_unit', 'lbs');
    expect(getSetting(get(db), 'weight_unit')).toBe('lbs');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd packages/db && pnpm test
```

Expected: FAIL — query modules not found.

- [ ] **Step 3: Implement queries/exercises.ts**

```ts
// packages/db/src/queries/exercises.ts
import type { Exercise } from '@workout/core';

type RunFn = (sql: string, params?: unknown[]) => void;
type AllFn = <T>(sql: string, params?: unknown[]) => T[];

interface ExerciseRow {
  id: string; name: string; category: string;
  muscle_group: string; equipment: string | null;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Exercise['category'],
    muscleGroup: row.muscle_group as Exercise['muscleGroup'],
    equipment: row.equipment,
  };
}

export function getExercises(all: AllFn): Exercise[] {
  return all<ExerciseRow>('SELECT * FROM exercise ORDER BY name').map(rowToExercise);
}

export function getExerciseById(
  get: <T>(sql: string, params?: unknown[]) => T | null,
  id: string
): Exercise | null {
  const row = get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [id]);
  return row ? rowToExercise(row) : null;
}

export function seedExercises(run: RunFn, exercises: Exercise[]): void {
  for (const e of exercises) {
    run(
      `INSERT OR IGNORE INTO exercise (id, name, category, muscle_group, equipment)
       VALUES (?, ?, ?, ?, ?)`,
      [e.id, e.name, e.category, e.muscleGroup, e.equipment]
    );
  }
}
```

- [ ] **Step 4: Implement queries/sessions.ts**

```ts
// packages/db/src/queries/sessions.ts
import type { WorkoutSession, WorkoutSet } from '@workout/core';

type RunFn = (sql: string, params?: unknown[]) => void;
type GetFn = <T>(sql: string, params?: unknown[]) => T | null;
type AllFn = <T>(sql: string, params?: unknown[]) => T[];

interface SessionRow {
  id: string; routine_id: string | null;
  started_at: number; finished_at: number | null; notes: string | null;
}
interface SetRow {
  id: string; session_id: string; exercise_id: string;
  set_number: number; weight: number; reps: number;
  rpe: number | null; completed_at: number;
}

function rowToSession(r: SessionRow): WorkoutSession {
  return { id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes };
}

export function getDraftSession(get: GetFn): WorkoutSession | null {
  const row = get<SessionRow>('SELECT * FROM workout_session WHERE finished_at IS NULL LIMIT 1');
  return row ? rowToSession(row) : null;
}

export function createSession(run: RunFn, session: WorkoutSession): void {
  run(
    `INSERT INTO workout_session (id, routine_id, started_at, finished_at, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [session.id, session.routineId, session.startedAt, session.finishedAt, session.notes]
  );
}

export function finishSession(run: RunFn, id: string, finishedAt: number): void {
  run('UPDATE workout_session SET finished_at = ? WHERE id = ?', [finishedAt, id]);
}

export function getSessions(all: AllFn, limit = 50): WorkoutSession[] {
  return all<SessionRow>(
    'SELECT * FROM workout_session WHERE finished_at IS NOT NULL ORDER BY started_at DESC LIMIT ?',
    [limit]
  ).map(rowToSession);
}

export function getSessionById(get: GetFn, id: string): WorkoutSession | null {
  const row = get<SessionRow>('SELECT * FROM workout_session WHERE id = ?', [id]);
  return row ? rowToSession(row) : null;
}

export function addSet(run: RunFn, set: WorkoutSet): void {
  run(
    `INSERT INTO workout_set (id, session_id, exercise_id, set_number, weight, reps, rpe, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [set.id, set.sessionId, set.exerciseId, set.setNumber, set.weight, set.reps, set.rpe, set.completedAt]
  );
}

export function deleteSet(run: RunFn, id: string): void {
  run('DELETE FROM workout_set WHERE id = ?', [id]);
}

export function getSetsBySession(all: AllFn, sessionId: string): WorkoutSet[] {
  return all<SetRow>(
    'SELECT * FROM workout_set WHERE session_id = ? ORDER BY set_number',
    [sessionId]
  ).map(r => ({
    id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id,
    setNumber: r.set_number, weight: r.weight, reps: r.reps,
    rpe: r.rpe, completedAt: r.completed_at,
  }));
}

export function getSetsByExercise(all: AllFn, exerciseId: string): WorkoutSet[] {
  return all<SetRow>(
    `SELECT ws.* FROM workout_set ws
     JOIN workout_session s ON s.id = ws.session_id
     WHERE ws.exercise_id = ? AND s.finished_at IS NOT NULL
     ORDER BY ws.completed_at DESC`,
    [exerciseId]
  ).map(r => ({
    id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id,
    setNumber: r.set_number, weight: r.weight, reps: r.reps,
    rpe: r.rpe, completedAt: r.completed_at,
  }));
}
```

- [ ] **Step 5: Implement queries/settings.ts**

```ts
// packages/db/src/queries/settings.ts

type RunFn = (sql: string, params?: unknown[]) => void;
type GetFn = <T>(sql: string, params?: unknown[]) => T | null;

export function getSetting(get: GetFn, key: string): string | null {
  const row = get<{ value: string }>('SELECT value FROM user_setting WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(run: RunFn, key: string, value: string): void {
  run('INSERT OR REPLACE INTO user_setting (key, value) VALUES (?, ?)', [key, value]);
}
```

- [ ] **Step 6: Implement queries/programs.ts**

```ts
// packages/db/src/queries/programs.ts
import type { Program, Routine, RoutineExercise } from '@workout/core';

type RunFn = (sql: string, params?: unknown[]) => void;
type AllFn = <T>(sql: string, params?: unknown[]) => T[];

export function getPrograms(all: AllFn): Program[] {
  return all<{ id: string; name: string; description: string; created_at: number }>(
    'SELECT * FROM program ORDER BY name'
  ).map(r => ({ id: r.id, name: r.name, description: r.description, createdAt: r.created_at }));
}

export function getRoutinesByProgram(all: AllFn, programId: string): Routine[] {
  return all<{ id: string; program_id: string; name: string; sort_order: number }>(
    'SELECT * FROM routine WHERE program_id = ? ORDER BY sort_order',
    [programId]
  ).map(r => ({ id: r.id, programId: r.program_id, name: r.name, order: r.sort_order }));
}

export function getRoutineExercises(all: AllFn, routineId: string): RoutineExercise[] {
  return all<{ id: string; routine_id: string; exercise_id: string; sets: number; reps: string; sort_order: number }>(
    'SELECT * FROM routine_exercise WHERE routine_id = ? ORDER BY sort_order',
    [routineId]
  ).map(r => ({
    id: r.id, routineId: r.routine_id, exerciseId: r.exercise_id,
    sets: r.sets, reps: r.reps, order: r.sort_order,
  }));
}

export function seedPrograms(
  run: RunFn,
  programs: Program[],
  routines: Routine[],
  routineExercises: RoutineExercise[]
): void {
  for (const p of programs) {
    run('INSERT OR IGNORE INTO program (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      [p.id, p.name, p.description, p.createdAt]);
  }
  for (const r of routines) {
    run('INSERT OR IGNORE INTO routine (id, program_id, name, sort_order) VALUES (?, ?, ?, ?)',
      [r.id, r.programId, r.name, r.order]);
  }
  for (const re of routineExercises) {
    run('INSERT OR IGNORE INTO routine_exercise (id, routine_id, exercise_id, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [re.id, re.routineId, re.exerciseId, re.sets, re.reps, re.order]);
  }
}
```

- [ ] **Step 7: Run tests to verify pass**

```bash
cd packages/db && pnpm test
```

Expected: PASS — 8 tests.

- [ ] **Step 8: Commit**

```bash
git add packages/db/src/queries/ packages/db/tests/
git commit -m "feat(db): query layer with integration tests"
```

---

### Task 7: packages/db — seed data

**Files:**
- Create: `packages/db/src/seed/exercises.ts`
- Create: `packages/db/src/seed/programs.ts`

- [ ] **Step 1: Create seed/exercises.ts**

```ts
// packages/db/src/seed/exercises.ts
import type { Exercise } from '@workout/core';

export const BUILT_IN_EXERCISES: Exercise[] = [
  // Push
  { id: 'ex-bench-press', name: 'Bench Press', category: 'push', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'ex-incline-bench', name: 'Incline Bench Press', category: 'push', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'ex-ohp', name: 'Overhead Press', category: 'push', muscleGroup: 'shoulders', equipment: 'barbell' },
  { id: 'ex-db-ohp', name: 'Dumbbell Shoulder Press', category: 'push', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { id: 'ex-tricep-pushdown', name: 'Tricep Pushdown', category: 'push', muscleGroup: 'triceps', equipment: 'cable' },
  { id: 'ex-skull-crusher', name: 'Skull Crusher', category: 'push', muscleGroup: 'triceps', equipment: 'barbell' },
  { id: 'ex-lateral-raise', name: 'Lateral Raise', category: 'push', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  // Pull
  { id: 'ex-deadlift', name: 'Deadlift', category: 'pull', muscleGroup: 'back', equipment: 'barbell' },
  { id: 'ex-barbell-row', name: 'Barbell Row', category: 'pull', muscleGroup: 'back', equipment: 'barbell' },
  { id: 'ex-pullup', name: 'Pull-Up', category: 'pull', muscleGroup: 'back', equipment: 'bodyweight' },
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', category: 'pull', muscleGroup: 'back', equipment: 'cable' },
  { id: 'ex-cable-row', name: 'Seated Cable Row', category: 'pull', muscleGroup: 'back', equipment: 'cable' },
  { id: 'ex-barbell-curl', name: 'Barbell Curl', category: 'pull', muscleGroup: 'biceps', equipment: 'barbell' },
  { id: 'ex-db-curl', name: 'Dumbbell Curl', category: 'pull', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { id: 'ex-hammer-curl', name: 'Hammer Curl', category: 'pull', muscleGroup: 'biceps', equipment: 'dumbbell' },
  // Legs
  { id: 'ex-squat', name: 'Squat', category: 'legs', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-front-squat', name: 'Front Squat', category: 'legs', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-leg-press', name: 'Leg Press', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-rdl', name: 'Romanian Deadlift', category: 'legs', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-leg-curl', name: 'Leg Curl', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-leg-extension', name: 'Leg Extension', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-calf-raise', name: 'Calf Raise', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-lunge', name: 'Lunge', category: 'legs', muscleGroup: 'legs', equipment: 'dumbbell' },
  // Core
  { id: 'ex-plank', name: 'Plank', category: 'core', muscleGroup: 'core', equipment: null },
  { id: 'ex-ab-wheel', name: 'Ab Wheel Rollout', category: 'core', muscleGroup: 'core', equipment: 'ab wheel' },
  { id: 'ex-cable-crunch', name: 'Cable Crunch', category: 'core', muscleGroup: 'core', equipment: 'cable' },
];
```

- [ ] **Step 2: Create seed/programs.ts**

```ts
// packages/db/src/seed/programs.ts
import type { Program, Routine, RoutineExercise } from '@workout/core';

export const BUILT_IN_PROGRAMS: Program[] = [
  { id: 'prog-ppl', name: 'Push Pull Legs (PPL)', description: '6-day push/pull/legs split', createdAt: 0 },
  { id: 'prog-531', name: '5/3/1', description: 'Jim Wendler\'s 4-day strength program', createdAt: 0 },
];

export const BUILT_IN_ROUTINES: Routine[] = [
  // PPL
  { id: 'r-ppl-push', programId: 'prog-ppl', name: 'Push', order: 0 },
  { id: 'r-ppl-pull', programId: 'prog-ppl', name: 'Pull', order: 1 },
  { id: 'r-ppl-legs', programId: 'prog-ppl', name: 'Legs', order: 2 },
  // 5/3/1
  { id: 'r-531-squat', programId: 'prog-531', name: 'Squat Day', order: 0 },
  { id: 'r-531-bench', programId: 'prog-531', name: 'Bench Day', order: 1 },
  { id: 'r-531-deadlift', programId: 'prog-531', name: 'Deadlift Day', order: 2 },
  { id: 'r-531-ohp', programId: 'prog-531', name: 'OHP Day', order: 3 },
];

export const BUILT_IN_ROUTINE_EXERCISES: RoutineExercise[] = [
  // PPL Push
  { id: 're-ppl-push-1', routineId: 'r-ppl-push', exerciseId: 'ex-bench-press', sets: 4, reps: '6-10', order: 0 },
  { id: 're-ppl-push-2', routineId: 'r-ppl-push', exerciseId: 'ex-ohp', sets: 3, reps: '8-12', order: 1 },
  { id: 're-ppl-push-3', routineId: 'r-ppl-push', exerciseId: 'ex-lateral-raise', sets: 3, reps: '12-15', order: 2 },
  { id: 're-ppl-push-4', routineId: 'r-ppl-push', exerciseId: 'ex-tricep-pushdown', sets: 3, reps: '10-15', order: 3 },
  // PPL Pull
  { id: 're-ppl-pull-1', routineId: 'r-ppl-pull', exerciseId: 'ex-deadlift', sets: 3, reps: '5', order: 0 },
  { id: 're-ppl-pull-2', routineId: 'r-ppl-pull', exerciseId: 'ex-barbell-row', sets: 4, reps: '6-10', order: 1 },
  { id: 're-ppl-pull-3', routineId: 'r-ppl-pull', exerciseId: 'ex-lat-pulldown', sets: 3, reps: '10-12', order: 2 },
  { id: 're-ppl-pull-4', routineId: 'r-ppl-pull', exerciseId: 'ex-barbell-curl', sets: 3, reps: '10-12', order: 3 },
  // PPL Legs
  { id: 're-ppl-legs-1', routineId: 'r-ppl-legs', exerciseId: 'ex-squat', sets: 4, reps: '6-10', order: 0 },
  { id: 're-ppl-legs-2', routineId: 'r-ppl-legs', exerciseId: 'ex-leg-press', sets: 3, reps: '10-15', order: 1 },
  { id: 're-ppl-legs-3', routineId: 'r-ppl-legs', exerciseId: 'ex-rdl', sets: 3, reps: '8-10', order: 2 },
  { id: 're-ppl-legs-4', routineId: 'r-ppl-legs', exerciseId: 'ex-leg-curl', sets: 3, reps: '10-12', order: 3 },
  { id: 're-ppl-legs-5', routineId: 'r-ppl-legs', exerciseId: 'ex-calf-raise', sets: 4, reps: '15-20', order: 4 },
  // 5/3/1 days
  { id: 're-531-sq-1', routineId: 'r-531-squat', exerciseId: 'ex-squat', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-sq-2', routineId: 'r-531-squat', exerciseId: 'ex-leg-press', sets: 5, reps: '10', order: 1 },
  { id: 're-531-b-1', routineId: 'r-531-bench', exerciseId: 'ex-bench-press', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-b-2', routineId: 'r-531-bench', exerciseId: 'ex-db-ohp', sets: 5, reps: '10', order: 1 },
  { id: 're-531-dl-1', routineId: 'r-531-deadlift', exerciseId: 'ex-deadlift', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-dl-2', routineId: 'r-531-deadlift', exerciseId: 'ex-barbell-row', sets: 5, reps: '10', order: 1 },
  { id: 're-531-ohp-1', routineId: 'r-531-ohp', exerciseId: 'ex-ohp', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-ohp-2', routineId: 'r-531-ohp', exerciseId: 'ex-db-curl', sets: 5, reps: '10', order: 1 },
];
```

- [ ] **Step 3: Add GZCLP to seed/programs.ts**

Append to `BUILT_IN_PROGRAMS`:

```ts
{ id: 'prog-gzclp', name: 'GZCLP', description: 'Greyskull Linear Progression — 3-day full-body', createdAt: 0 },
```

Append to `BUILT_IN_ROUTINES`:

```ts
{ id: 'r-gzclp-a', programId: 'prog-gzclp', name: 'Workout A', order: 0 },
{ id: 'r-gzclp-b', programId: 'prog-gzclp', name: 'Workout B', order: 1 },
```

Append to `BUILT_IN_ROUTINE_EXERCISES`:

```ts
// GZCLP Workout A
{ id: 're-gzclp-a-1', routineId: 'r-gzclp-a', exerciseId: 'ex-squat', sets: 3, reps: '5', order: 0 },
{ id: 're-gzclp-a-2', routineId: 'r-gzclp-a', exerciseId: 'ex-bench-press', sets: 3, reps: '5', order: 1 },
{ id: 're-gzclp-a-3', routineId: 'r-gzclp-a', exerciseId: 'ex-deadlift', sets: 1, reps: '5', order: 2 },
// GZCLP Workout B
{ id: 're-gzclp-b-1', routineId: 'r-gzclp-b', exerciseId: 'ex-squat', sets: 3, reps: '5', order: 0 },
{ id: 're-gzclp-b-2', routineId: 'r-gzclp-b', exerciseId: 'ex-ohp', sets: 3, reps: '5', order: 1 },
{ id: 're-gzclp-b-3', routineId: 'r-gzclp-b', exerciseId: 'ex-deadlift', sets: 1, reps: '5', order: 2 },
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/seed/
git commit -m "feat(db): add built-in exercise and program seed data (PPL, 5/3/1, GZCLP)"
```

---

### Task 8: packages/db — index + drivers

**Files:**
- Create: `packages/db/src/drivers/mobile.ts`
- Create: `packages/db/src/drivers/web.ts`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Create drivers/mobile.ts**

```ts
// packages/db/src/drivers/mobile.ts
// Requires: expo-sqlite installed in apps/mobile
import type { DB } from '../interface';
import { CREATE_TABLES_SQL } from '../schema';
import { getExercises, getExerciseById, seedExercises } from '../queries/exercises';
import { getPrograms, getRoutinesByProgram, getRoutineExercises, seedPrograms } from '../queries/programs';
import { getDraftSession, createSession, finishSession, getSessions, getSessionById, addSet, deleteSet, getSetsBySession, getSetsByExercise } from '../queries/sessions';
import { getSetting, setSetting } from '../queries/settings';
import { BUILT_IN_EXERCISES } from '../seed/exercises';
import { BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from '../seed/programs';

export async function createMobileDB(SQLite: any): Promise<DB> {
  const db = await SQLite.openDatabaseAsync('workout.db');
  await db.execAsync(CREATE_TABLES_SQL);

  const run = (sql: string, params: unknown[] = []) =>
    db.runAsync(sql, params);
  const get = <T>(sql: string, params: unknown[] = []): Promise<T | null> =>
    db.getFirstAsync(sql, params);
  const all = <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
    db.getAllAsync(sql, params);

  // Seed on first open
  await seedExercises(run as any, BUILT_IN_EXERCISES);
  await seedPrograms(run as any, BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES);

  return {
    getExercises: () => all('SELECT * FROM exercise ORDER BY name').then(rows => (rows as any[]).map(r => ({ id: r.id, name: r.name, category: r.category, muscleGroup: r.muscle_group, equipment: r.equipment }))),
    getExerciseById: (id) => get<any>('SELECT * FROM exercise WHERE id = ?', [id]).then(r => r ? { id: r.id, name: r.name, category: r.category, muscleGroup: r.muscle_group, equipment: r.equipment } : null),
    getPrograms: () => all<any>('SELECT * FROM program ORDER BY name').then(rows => rows.map(r => ({ id: r.id, name: r.name, description: r.description, createdAt: r.created_at }))),
    getRoutinesByProgram: (programId) => all<any>('SELECT * FROM routine WHERE program_id = ? ORDER BY sort_order', [programId]).then(rows => rows.map(r => ({ id: r.id, programId: r.program_id, name: r.name, order: r.sort_order }))),
    getRoutineExercises: (routineId) => all<any>('SELECT * FROM routine_exercise WHERE routine_id = ? ORDER BY sort_order', [routineId]).then(rows => rows.map(r => ({ id: r.id, routineId: r.routine_id, exerciseId: r.exercise_id, sets: r.sets, reps: r.reps, order: r.sort_order }))),
    getDraftSession: () => get<any>('SELECT * FROM workout_session WHERE finished_at IS NULL LIMIT 1').then(r => r ? { id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes } : null),
    createSession: (s) => run('INSERT INTO workout_session (id, routine_id, started_at, finished_at, notes) VALUES (?, ?, ?, ?, ?)', [s.id, s.routineId, s.startedAt, s.finishedAt, s.notes]).then(() => {}),
    finishSession: (id, finishedAt) => run('UPDATE workout_session SET finished_at = ? WHERE id = ?', [finishedAt, id]).then(() => {}),
    getSessions: (limit = 50) => all<any>('SELECT * FROM workout_session WHERE finished_at IS NOT NULL ORDER BY started_at DESC LIMIT ?', [limit]).then(rows => rows.map(r => ({ id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes }))),
    getSessionById: (id) => get<any>('SELECT * FROM workout_session WHERE id = ?', [id]).then(r => r ? { id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes } : null),
    addSet: (s) => run('INSERT INTO workout_set (id, session_id, exercise_id, set_number, weight, reps, rpe, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.sessionId, s.exerciseId, s.setNumber, s.weight, s.reps, s.rpe, s.completedAt]).then(() => {}),
    deleteSet: (id) => run('DELETE FROM workout_set WHERE id = ?', [id]).then(() => {}),
    getSetsBySession: (sessionId) => all<any>('SELECT * FROM workout_set WHERE session_id = ? ORDER BY set_number', [sessionId]).then(rows => rows.map(r => ({ id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id, setNumber: r.set_number, weight: r.weight, reps: r.reps, rpe: r.rpe, completedAt: r.completed_at }))),
    getSetsByExercise: (exerciseId) => all<any>('SELECT ws.* FROM workout_set ws JOIN workout_session s ON s.id = ws.session_id WHERE ws.exercise_id = ? AND s.finished_at IS NOT NULL ORDER BY ws.completed_at DESC', [exerciseId]).then(rows => rows.map(r => ({ id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id, setNumber: r.set_number, weight: r.weight, reps: r.reps, rpe: r.rpe, completedAt: r.completed_at }))),
    getSetting: (key) => get<any>('SELECT value FROM user_setting WHERE key = ?', [key]).then(r => r?.value ?? null),
    setSetting: (key, value) => run('INSERT OR REPLACE INTO user_setting (key, value) VALUES (?, ?)', [key, value]).then(() => {}),
    seedExercises: (exercises) => Promise.resolve(),
    seedPrograms: () => Promise.resolve(),
  };
}
```

- [ ] **Step 2: Create drivers/web.ts**

```ts
// packages/db/src/drivers/web.ts
// Requires: idb installed in apps/web
import type { DB } from '../interface';

// The web driver delegates to sql.js-httpvfs or a simple IndexedDB key-value approach.
// For simplicity, we use a structured IndexedDB via idb with the same table semantics.
// Install: pnpm add idb (in apps/web)

export async function createWebDB(openDB: any): Promise<DB> {
  const db = await openDB('workout-db', 1, {
    upgrade(db: any) {
      if (!db.objectStoreNames.contains('exercise')) db.createObjectStore('exercise', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('program')) db.createObjectStore('program', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('routine')) { const s = db.createObjectStore('routine', { keyPath: 'id' }); s.createIndex('programId', 'programId'); }
      if (!db.objectStoreNames.contains('routine_exercise')) { const s = db.createObjectStore('routine_exercise', { keyPath: 'id' }); s.createIndex('routineId', 'routineId'); }
      if (!db.objectStoreNames.contains('workout_session')) { const s = db.createObjectStore('workout_session', { keyPath: 'id' }); s.createIndex('finishedAt', 'finishedAt'); }
      if (!db.objectStoreNames.contains('workout_set')) { const s = db.createObjectStore('workout_set', { keyPath: 'id' }); s.createIndex('sessionId', 'sessionId'); s.createIndex('exerciseId', 'exerciseId'); }
      if (!db.objectStoreNames.contains('user_setting')) db.createObjectStore('user_setting', { keyPath: 'key' });
    },
  });

  return {
    getExercises: () => db.getAll('exercise'),
    getExerciseById: (id) => db.get('exercise', id),
    getPrograms: () => db.getAll('program'),
    getRoutinesByProgram: (programId) => db.getAllFromIndex('routine', 'programId', programId),
    getRoutineExercises: (routineId) => db.getAllFromIndex('routine_exercise', 'routineId', routineId),
    getDraftSession: async () => {
      const all = await db.getAll('workout_session') as any[];
      return all.find(s => s.finishedAt == null) ?? null;
    },
    createSession: (s) => db.put('workout_session', s).then(() => {}),
    finishSession: async (id, finishedAt) => { const s = await db.get('workout_session', id); if (s) await db.put('workout_session', { ...s, finishedAt }); },
    getSessions: async (limit = 50) => { const all = await db.getAll('workout_session') as any[]; return all.filter(s => s.finishedAt != null).sort((a, b) => b.startedAt - a.startedAt).slice(0, limit); },
    getSessionById: (id) => db.get('workout_session', id),
    addSet: (s) => db.put('workout_set', s).then(() => {}),
    deleteSet: (id) => db.delete('workout_set', id).then(() => {}),
    getSetsBySession: (sessionId) => db.getAllFromIndex('workout_set', 'sessionId', sessionId),
    getSetsByExercise: async (exerciseId) => {
      const sets = await db.getAllFromIndex('workout_set', 'exerciseId', exerciseId) as any[];
      const sessions = await db.getAll('workout_session') as any[];
      const finishedIds = new Set(sessions.filter(s => s.finishedAt != null).map(s => s.id));
      return sets.filter(s => finishedIds.has(s.sessionId)).sort((a, b) => b.completedAt - a.completedAt);
    },
    getSetting: async (key) => { const r = await db.get('user_setting', key); return r?.value ?? null; },
    setSetting: (key, value) => db.put('user_setting', { key, value }).then(() => {}),
    seedExercises: async (exercises) => { for (const e of exercises) await db.put('exercise', e); },
    seedPrograms: async (programs, routines, routineExercises) => {
      for (const p of programs) await db.put('program', p);
      for (const r of routines) await db.put('routine', r);
      for (const re of routineExercises) await db.put('routine_exercise', re);
    },
  };
}
```

- [ ] **Step 3: Create packages/db/src/index.ts**

```ts
// packages/db/src/index.ts
export type { DB } from './interface';
export { CREATE_TABLES_SQL } from './schema';
export { createMobileDB } from './drivers/mobile';
export { createWebDB } from './drivers/web';
export { BUILT_IN_EXERCISES } from './seed/exercises';
export { BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from './seed/programs';
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/drivers/ packages/db/src/index.ts
git commit -m "feat(db): add mobile and web storage drivers"
```

---

## Phase 2: Mobile App (apps/mobile)

---

### Task 9: apps/mobile scaffold

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create apps/mobile/package.json**

```json
{
  "name": "@workout/mobile",
  "version": "0.0.1",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android"
  },
  "dependencies": {
    "@workout/core": "workspace:*",
    "@workout/db": "workspace:*",
    "@workout/ui": "workspace:*",
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-sqlite": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "zustand": "^4.5.0",
    "victory-native": "^41.0.0",
    "react-native-svg": "^15.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "~18.3.0"
  }
}
```

- [ ] **Step 2: Create apps/mobile/app.json**

```json
{
  "expo": {
    "name": "WorkoutTracker",
    "slug": "workout-tracker",
    "version": "1.0.0",
    "scheme": "workout",
    "platforms": ["ios", "android"],
    "newArchEnabled": true
  }
}
```

- [ ] **Step 3: Create apps/mobile/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts"]
}
```

- [ ] **Step 4: Create apps/mobile/app/_layout.tsx**

```tsx
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { DBProvider } from '../db';

export default function RootLayout() {
  return (
    <DBProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout', presentation: 'modal' }} />
      </Stack>
    </DBProvider>
  );
}
```

- [ ] **Step 5: Create apps/mobile/db.ts (DB context)**

```tsx
// apps/mobile/db.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { createMobileDB } from '@workout/db';
import type { DB } from '@workout/db';
import { BUILT_IN_EXERCISES } from '@workout/db';
import { BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from '@workout/db';

const DBContext = createContext<DB | null>(null);

export function DBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);

  useEffect(() => {
    createMobileDB(SQLite).then(setDb);
  }, []);

  if (!db) return null; // or a loading spinner
  return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}

export function useDB(): DB {
  const db = useContext(DBContext);
  if (!db) throw new Error('useDB must be used within DBProvider');
  return db;
}
```

- [ ] **Step 6: Create apps/mobile/app/(tabs)/_layout.tsx**

```tsx
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="programs" options={{ title: 'Programs' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
```

- [ ] **Step 7: Install dependencies and verify Expo starts**

```bash
cd apps/mobile && pnpm install
pnpm start
```

Expected: Expo dev server starts, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/
git commit -m "feat(mobile): scaffold Expo app with tab navigation and DB context"
```

---

### Task 10: apps/mobile — Zustand workout store

**Files:**
- Create: `apps/mobile/store/workout.ts`

- [ ] **Step 1: Create store/workout.ts**

```ts
// apps/mobile/store/workout.ts
import { create } from 'zustand';
import type { WorkoutSession, WorkoutSet } from '@workout/core';

interface WorkoutStore {
  activeSession: WorkoutSession | null;
  sets: WorkoutSet[];
  restTimerStart: number | null;

  startSession: (session: WorkoutSession) => void;
  addSet: (set: WorkoutSet) => void;
  removeSet: (id: string) => void;
  finishSession: () => void;
  restoreSession: (session: WorkoutSession, sets: WorkoutSet[]) => void;
  startRestTimer: () => void;
  clearRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeSession: null,
  sets: [],
  restTimerStart: null,

  startSession: (session) => set({ activeSession: session, sets: [] }),
  addSet: (newSet) => set((state) => ({ sets: [...state.sets, newSet] })),
  removeSet: (id) => set((state) => ({ sets: state.sets.filter((s) => s.id !== id) })),
  finishSession: () => set({ activeSession: null, sets: [], restTimerStart: null }),
  restoreSession: (session, sets) => set({ activeSession: session, sets }),
  startRestTimer: () => set({ restTimerStart: Date.now() }),
  clearRestTimer: () => set({ restTimerStart: null }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/store/workout.ts
git commit -m "feat(mobile): add Zustand workout session store"
```

---

### Task 11: apps/mobile — Today screen

**Files:**
- Create: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Create Today screen**

```tsx
// apps/mobile/app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDB } from '../../db';
import { useWorkoutStore } from '../../store/workout';
import type { Routine, WorkoutSession, WorkoutSet } from '@workout/core';
import { randomUUID } from 'expo-crypto';

export default function TodayScreen() {
  const db = useDB();
  const router = useRouter();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [nextRoutine, setNextRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    (async () => {
      // Restore draft session if one exists
      const draft = await db.getDraftSession();
      if (draft) {
        const sets = await db.getSetsBySession(draft.id);
        restoreSession(draft, sets);
      }

      // Load next scheduled routine
      const activeProgramId = await db.getSetting('active_program_id');
      if (activeProgramId) {
        const indexStr = await db.getSetting('active_routine_index');
        const index = indexStr ? parseInt(indexStr, 10) : 0;
        const routines = await db.getRoutinesByProgram(activeProgramId);
        if (routines.length > 0) setNextRoutine(routines[index % routines.length]);
      }
    })();
  }, []);

  async function startWorkout(routine: Routine | null) {
    const session: WorkoutSession = {
      id: randomUUID(),
      routineId: routine?.id ?? null,
      startedAt: Date.now(),
      finishedAt: null,
      notes: null,
    };
    await db.createSession(session);
    startSession(session);
    router.push(`/workout/${session.id}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>

      {activeSession ? (
        <TouchableOpacity style={styles.resumeButton} onPress={() => router.push(`/workout/${activeSession.id}`)}>
          <Text style={styles.resumeText}>Resume Workout</Text>
        </TouchableOpacity>
      ) : (
        <>
          {nextRoutine && (
            <TouchableOpacity style={styles.startButton} onPress={() => startWorkout(nextRoutine)}>
              <Text style={styles.startText}>Start: {nextRoutine.name}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.emptyButton} onPress={() => startWorkout(null)}>
            <Text style={styles.emptyText}>Start Empty Workout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  startButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  startText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  resumeButton: { backgroundColor: '#34C759', borderRadius: 12, padding: 16, marginBottom: 12 },
  resumeText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptyButton: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 12, padding: 16 },
  emptyText: { color: '#007AFF', fontSize: 16, textAlign: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): Today screen with draft session restore and program scheduling"
```

---

### Task 12: apps/mobile — Active Workout screen

**Files:**
- Create: `apps/mobile/app/workout/[id].tsx`

- [ ] **Step 1: Create active workout screen**

```tsx
// apps/mobile/app/workout/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDB } from '../../db';
import { useWorkoutStore } from '../../store/workout';
import type { Exercise, RoutineExercise } from '@workout/core';
import { randomUUID } from 'expo-crypto';
import { getNextRoutineIndex } from '@workout/core';

interface SetEntry { id: string; exerciseId: string; weight: string; reps: string; done: boolean; }

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDB();
  const router = useRouter();
  const { activeSession, sets, addSet, removeSet, finishSession } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [localSets, setLocalSets] = useState<SetEntry[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!activeSession) return;
      if (activeSession.routineId) {
        const res = await db.getRoutineExercises(activeSession.routineId);
        setRoutineExercises(res);
        const exList = await Promise.all(res.map(re => db.getExerciseById(re.exerciseId)));
        setExercises(exList.filter(Boolean) as Exercise[]);
      }
    })();
  }, [activeSession]);

  // Rest timer countdown
  useEffect(() => {
    if (restSeconds === null) return;
    if (restSeconds <= 0) { setRestSeconds(null); return; }
    const t = setTimeout(() => setRestSeconds(s => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [restSeconds]);

  function addLocalSet(exerciseId: string) {
    setLocalSets(prev => [...prev, { id: randomUUID(), exerciseId, weight: '', reps: '', done: false }]);
  }

  async function completeSet(entry: SetEntry) {
    const weight = parseFloat(entry.weight);
    const reps = parseInt(entry.reps, 10);
    if (isNaN(weight) || isNaN(reps)) { Alert.alert('Invalid', 'Enter valid weight and reps'); return; }
    const set = { id: entry.id, sessionId: id, exerciseId: entry.exerciseId, setNumber: sets.filter(s => s.exerciseId === entry.exerciseId).length + 1, weight, reps, rpe: null, completedAt: Date.now() };
    await db.addSet(set);
    addSet(set);
    setLocalSets(prev => prev.map(s => s.id === entry.id ? { ...s, done: true } : s));
    setRestSeconds(90);
  }

  async function handleFinish() {
    if (!activeSession) return;
    await db.finishSession(id, Date.now());

    // Advance program index
    const activeProgramId = await db.getSetting('active_program_id');
    if (activeProgramId && activeSession.routineId) {
      const routines = await db.getRoutinesByProgram(activeProgramId);
      const currentIdx = routines.findIndex(r => r.id === activeSession.routineId);
      const nextIdx = getNextRoutineIndex(currentIdx, routines.length);
      await db.setSetting('active_routine_index', String(nextIdx));
    }

    finishSession();
    router.back();
  }

  return (
    <View style={styles.container}>
      {restSeconds !== null && (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>Rest: {restSeconds}s</Text>
          <TouchableOpacity onPress={() => setRestSeconds(null)}><Text style={styles.skipRest}>Skip</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={exercises.length > 0 ? exercises : []}
        keyExtractor={e => e.id}
        ListEmptyComponent={<Text style={styles.empty}>No exercises. Add some below.</Text>}
        renderItem={({ item: exercise }) => {
          const exSets = localSets.filter(s => s.exerciseId === exercise.id);
          return (
            <View style={styles.exerciseBlock}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exSets.map(entry => (
                <View key={entry.id} style={styles.setRow}>
                  <TextInput style={styles.input} placeholder="kg" value={entry.weight} onChangeText={v => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, weight: v } : s))} keyboardType="numeric" editable={!entry.done} />
                  <TextInput style={styles.input} placeholder="reps" value={entry.reps} onChangeText={v => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, reps: v } : s))} keyboardType="numeric" editable={!entry.done} />
                  {entry.done
                    ? <Text style={styles.done}>✓</Text>
                    : <TouchableOpacity onPress={() => completeSet(entry)}><Text style={styles.logBtn}>Log</Text></TouchableOpacity>}
                </View>
              ))}
              <TouchableOpacity onPress={() => addLocalSet(exercise.id)} style={styles.addSet}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishText}>Finish Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  restBanner: { backgroundColor: '#FF9500', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  skipRest: { color: '#fff', textDecorationLine: 'underline' },
  exerciseBlock: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  exerciseName: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: 70, textAlign: 'center' },
  logBtn: { color: '#007AFF', fontWeight: '600' },
  done: { color: '#34C759', fontWeight: 'bold', fontSize: 18 },
  addSet: { marginTop: 4 },
  addSetText: { color: '#007AFF' },
  finishButton: { margin: 16, backgroundColor: '#FF3B30', borderRadius: 12, padding: 16 },
  finishText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/workout/
git commit -m "feat(mobile): active workout screen with set logging and rest timer"
```

---

### Task 13: apps/mobile — History screen

**Files:**
- Create: `apps/mobile/app/(tabs)/history.tsx`

- [ ] **Step 1: Create History screen**

```tsx
// apps/mobile/app/(tabs)/history.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDB } from '../../db';
import type { WorkoutSession } from '@workout/core';

export default function HistoryScreen() {
  const db = useDB();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(useCallback(() => {
    db.getSessions(50).then(setSessions);
  }, [db]));

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatDuration(start: number, end: number | null) {
    if (!end) return '';
    const mins = Math.round((end - start) / 60000);
    return `${mins} min`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        ListEmptyComponent={<Text style={styles.empty}>No workouts yet. Start one from Today!</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.date}>{formatDate(item.startedAt)}</Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
            <Text style={styles.duration}>{formatDuration(item.startedAt, item.finishedAt)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  date: { fontSize: 16, fontWeight: '500' },
  notes: { fontSize: 13, color: '#888', marginTop: 2 },
  duration: { fontSize: 14, color: '#888' },
  empty: { marginTop: 60, textAlign: 'center', color: '#aaa' },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(tabs)/history.tsx
git commit -m "feat(mobile): workout history screen"
```

---

### Task 14: apps/mobile — Programs screen

**Files:**
- Create: `apps/mobile/app/(tabs)/programs.tsx`

- [ ] **Step 1: Create Programs screen**

```tsx
// apps/mobile/app/(tabs)/programs.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDB } from '../../db';
import type { Program } from '@workout/core';

export default function ProgramsScreen() {
  const db = useDB();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    db.getPrograms().then(setPrograms);
    db.getSetting('active_program_id').then(setActiveId);
  }, []);

  async function activateProgram(program: Program) {
    await db.setSetting('active_program_id', program.id);
    await db.setSetting('active_routine_index', '0');
    setActiveId(program.id);
    Alert.alert('Program Started', `${program.name} is now your active program.`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programs</Text>
      <FlatList
        data={programs}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.programName}>{item.name}</Text>
              {activeId === item.id && <Text style={styles.activeBadge}>Active</Text>}
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            {activeId !== item.id && (
              <TouchableOpacity style={styles.startBtn} onPress={() => activateProgram(item)}>
                <Text style={styles.startBtnText}>Start Program</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  programName: { fontSize: 17, fontWeight: '600' },
  activeBadge: { backgroundColor: '#34C759', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 12 },
  desc: { color: '#666', fontSize: 14, marginBottom: 10 },
  startBtn: { backgroundColor: '#007AFF', borderRadius: 8, padding: 10 },
  startBtnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(tabs)/programs.tsx
git commit -m "feat(mobile): programs screen with active program selection"
```

---

### Task 15: apps/mobile — Exercises screen

**Files:**
- Create: `apps/mobile/app/(tabs)/exercises.tsx`

- [ ] **Step 1: Create Exercises screen**

```tsx
// apps/mobile/app/(tabs)/exercises.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { useDB } from '../../db';
import type { Exercise } from '@workout/core';

export default function ExercisesScreen() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => { db.getExercises().then(setExercises); }, []);

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercises</Text>
      <TextInput
        style={styles.search}
        placeholder="Search exercises..."
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.muscleGroup} · {item.equipment ?? 'no equipment'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 15 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontSize: 16, fontWeight: '500' },
  meta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(tabs)/exercises.tsx
git commit -m "feat(mobile): exercises screen with search"
```

---

### Task 16: apps/mobile — Progress screen

**Files:**
- Create: `apps/mobile/app/(tabs)/progress.tsx`

- [ ] **Step 1: Create Progress screen**

```tsx
// apps/mobile/app/(tabs)/progress.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDB } from '../../db';
import type { Exercise, WorkoutSet } from '@workout/core';
import { epley1RM, calculateVolume } from '@workout/core';
import { LineChart, CartesianChart } from 'victory-native';

export default function ProgressScreen() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<WorkoutSet[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, []);

  async function selectExercise(ex: Exercise) {
    setSelected(ex);
    const sets = await db.getSetsByExercise(ex.id);
    setHistory(sets);
  }

  // Group sets by session date to get best set per session
  const sessionBests = React.useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    for (const s of history) { (groups[s.sessionId] ??= []).push(s); }
    return Object.entries(groups).map(([, sets]) => {
      const best = sets.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b);
      return { date: best.completedAt, estimated1RM: epley1RM(best.weight, best.reps), bestWeight: best.weight, bestReps: best.reps };
    }).sort((a, b) => a.date - b.date);
  }, [history]);

  const allTimePR = history.length > 0
    ? history.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b)
    : null;

  if (!selected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Select an exercise</Text>
        <FlatList
          data={exercises}
          keyExtractor={e => e.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => selectExercise(item)}>
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelected(null)}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{selected.name}</Text>

      {allTimePR && (
        <View style={styles.prCard}>
          <Text style={styles.prLabel}>All-Time PR</Text>
          <Text style={styles.prValue}>{allTimePR.weight}kg × {allTimePR.reps} reps</Text>
          <Text style={styles.prEst}>Est. 1RM: {epley1RM(allTimePR.weight, allTimePR.reps)}kg</Text>
        </View>
      )}

      {sessionBests.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartLabel}>Estimated 1RM Over Time</Text>
          <LineChart.Chart
            data={sessionBests.map((b, i) => ({ x: i, y: b.estimated1RM }))}
            height={200}
          >
            <LineChart.Line color="#007AFF" />
          </LineChart.Chart>
        </View>
      )}

      {sessionBests.length === 0 && (
        <Text style={styles.empty}>No logged sets for this exercise yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 16 },
  back: { color: '#007AFF', marginBottom: 8 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontSize: 16 },
  prCard: { backgroundColor: '#f0f7ff', borderRadius: 12, padding: 16, marginVertical: 16 },
  prLabel: { color: '#007AFF', fontWeight: '600', marginBottom: 4 },
  prValue: { fontSize: 22, fontWeight: 'bold' },
  prEst: { color: '#555', marginTop: 4 },
  chartContainer: { marginTop: 8 },
  chartLabel: { fontWeight: '600', marginBottom: 8, color: '#333' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(tabs)/progress.tsx
git commit -m "feat(mobile): progress screen with PR card and 1RM chart"
```

---

## Phase 3: Web App (apps/web)

---

### Task 17: apps/web scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/db.ts`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@workout/web",
  "version": "0.0.1",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "@workout/core": "workspace:*",
    "@workout/db": "workspace:*",
    "idb": "^8.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.0",
    "victory": "^37.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM"],
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create apps/web/vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 4: Create apps/web/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workout Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create apps/web/src/db.ts**

```ts
// apps/web/src/db.ts
import { openDB } from 'idb';
import { createWebDB } from '@workout/db';
import { BUILT_IN_EXERCISES, BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from '@workout/db';
import type { DB } from '@workout/db';

let instance: DB | null = null;

export async function getDB(): Promise<DB> {
  if (instance) return instance;
  instance = await createWebDB(openDB);
  await instance.seedExercises(BUILT_IN_EXERCISES);
  await instance.seedPrograms(BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES);
  return instance;
}
```

- [ ] **Step 6: Create apps/web/src/main.tsx**

```tsx
// apps/web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 7: Create apps/web/src/App.tsx**

```tsx
// apps/web/src/App.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getDB } from './db';
import type { DB } from '@workout/db';
import Layout from './components/Layout';
import Today from './pages/Today';
import History from './pages/History';
import Programs from './pages/Programs';
import Exercises from './pages/Exercises';
import Progress from './pages/Progress';
import ActiveWorkout from './pages/ActiveWorkout';

export const DBContext = React.createContext<DB | null>(null);
export function useDB(): DB {
  const db = React.useContext(DBContext);
  if (!db) throw new Error('DB not ready');
  return db;
}

export default function App() {
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => { getDB().then(setDb); }, []);
  if (!db) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <DBContext.Provider value={db}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="history" element={<History />} />
          <Route path="programs" element={<Programs />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="progress" element={<Progress />} />
          <Route path="workout/:id" element={<ActiveWorkout />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </DBContext.Provider>
  );
}
```

- [ ] **Step 8: Create apps/web/src/components/Layout.tsx**

```tsx
// apps/web/src/components/Layout.tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/programs', label: 'Programs' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/progress', label: 'Progress' },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ width: 200, borderRight: '1px solid #eee', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700 }}>Workout</h2>
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
              color: isActive ? '#007AFF' : '#333',
              backgroundColor: isActive ? '#f0f7ff' : 'transparent',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 9: Install and verify dev server**

```bash
cd apps/web && pnpm install
pnpm dev
```

Expected: Vite starts at http://localhost:5173, app loads with sidebar.

- [ ] **Step 10: Commit**

```bash
git add apps/web/
git commit -m "feat(web): scaffold Vite app with sidebar layout and DB context"
```

---

### Task 18: apps/web — all page components

**Files:**
- Create: `apps/web/src/pages/Today.tsx`
- Create: `apps/web/src/pages/History.tsx`
- Create: `apps/web/src/pages/Programs.tsx`
- Create: `apps/web/src/pages/Exercises.tsx`
- Create: `apps/web/src/pages/Progress.tsx`
- Create: `apps/web/src/pages/ActiveWorkout.tsx`
- Create: `apps/web/src/store/workout.ts`

- [ ] **Step 1: Create apps/web/src/store/workout.ts**

```ts
// apps/web/src/store/workout.ts
// Identical interface to mobile store — same Zustand shape
import { create } from 'zustand';
import type { WorkoutSession, WorkoutSet } from '@workout/core';

interface WorkoutStore {
  activeSession: WorkoutSession | null;
  sets: WorkoutSet[];
  startSession: (session: WorkoutSession) => void;
  addSet: (set: WorkoutSet) => void;
  removeSet: (id: string) => void;
  finishSession: () => void;
  restoreSession: (session: WorkoutSession, sets: WorkoutSet[]) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeSession: null,
  sets: [],
  startSession: (session) => set({ activeSession: session, sets: [] }),
  addSet: (newSet) => set((state) => ({ sets: [...state.sets, newSet] })),
  removeSet: (id) => set((state) => ({ sets: state.sets.filter((s) => s.id !== id) })),
  finishSession: () => set({ activeSession: null, sets: [] }),
  restoreSession: (session, sets) => set({ activeSession: session, sets }),
}));
```

- [ ] **Step 2: Create apps/web/src/pages/Today.tsx**

```tsx
// apps/web/src/pages/Today.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useWorkoutStore } from '../store/workout';
import type { Routine, WorkoutSession } from '@workout/core';

function uuid() { return crypto.randomUUID(); }

export default function Today() {
  const db = useDB();
  const navigate = useNavigate();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [nextRoutine, setNextRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    (async () => {
      const draft = await db.getDraftSession();
      if (draft) { const sets = await db.getSetsBySession(draft.id); restoreSession(draft, sets); }
      const pid = await db.getSetting('active_program_id');
      if (pid) {
        const idx = parseInt((await db.getSetting('active_routine_index')) ?? '0', 10);
        const routines = await db.getRoutinesByProgram(pid);
        if (routines.length) setNextRoutine(routines[idx % routines.length]);
      }
    })();
  }, []);

  async function startWorkout(routine: Routine | null) {
    const session: WorkoutSession = { id: uuid(), routineId: routine?.id ?? null, startedAt: Date.now(), finishedAt: null, notes: null };
    await db.createSession(session);
    startSession(session);
    navigate(`/workout/${session.id}`);
  }

  return (
    <div>
      <h1>Today</h1>
      {activeSession ? (
        <button onClick={() => navigate(`/workout/${activeSession.id}`)} style={btn('#34C759')}>Resume Workout</button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          {nextRoutine && <button onClick={() => startWorkout(nextRoutine)} style={btn('#007AFF')}>Start: {nextRoutine.name}</button>}
          <button onClick={() => startWorkout(null)} style={{ ...btn('transparent'), color: '#007AFF', border: '1px solid #007AFF' }}>Start Empty Workout</button>
        </div>
      )}
    </div>
  );
}

function btn(bg: string) {
  return { background: bg, color: bg === 'transparent' ? undefined : '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 15, cursor: 'pointer', fontWeight: 600 } as React.CSSProperties;
}
```

- [ ] **Step 3: Create apps/web/src/pages/History.tsx**

```tsx
// apps/web/src/pages/History.tsx
import React, { useEffect, useState } from 'react';
import { useDB } from '../App';
import type { WorkoutSession } from '@workout/core';

export default function History() {
  const db = useDB();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  useEffect(() => { db.getSessions(50).then(setSessions); }, []);

  return (
    <div>
      <h1>History</h1>
      {sessions.length === 0 && <p style={{ color: '#aaa' }}>No workouts yet.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th>Date</th><th>Duration</th><th>Notes</th></tr></thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '12px 0' }}>{new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
              <td style={{ padding: '12px 0', color: '#888' }}>{s.finishedAt ? `${Math.round((s.finishedAt - s.startedAt) / 60000)} min` : '—'}</td>
              <td style={{ padding: '12px 0', color: '#888' }}>{s.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/pages/Programs.tsx**

```tsx
// apps/web/src/pages/Programs.tsx
import React, { useEffect, useState } from 'react';
import { useDB } from '../App';
import type { Program } from '@workout/core';

export default function Programs() {
  const db = useDB();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    db.getPrograms().then(setPrograms);
    db.getSetting('active_program_id').then(setActiveId);
  }, []);

  async function activate(p: Program) {
    await db.setSetting('active_program_id', p.id);
    await db.setSetting('active_routine_index', '0');
    setActiveId(p.id);
  }

  return (
    <div>
      <h1>Programs</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {programs.map(p => (
          <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              {activeId === p.id && <span style={{ background: '#34C759', color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 12 }}>Active</span>}
            </div>
            <p style={{ color: '#666', fontSize: 14 }}>{p.description}</p>
            {activeId !== p.id && <button onClick={() => activate(p)} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Start Program</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create apps/web/src/pages/Exercises.tsx**

```tsx
// apps/web/src/pages/Exercises.tsx
import React, { useEffect, useState } from 'react';
import { useDB } from '../App';
import type { Exercise } from '@workout/core';

export default function Exercises() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  useEffect(() => { db.getExercises().then(setExercises); }, []);

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.muscleGroup.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <h1>Exercises</h1>
      <input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 15, marginBottom: 16, width: 300 }} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th>Name</th><th>Category</th><th>Muscle</th><th>Equipment</th></tr></thead>
        <tbody>
          {filtered.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '10px 0' }}>{e.name}</td>
              <td style={{ padding: '10px 0', color: '#888', textTransform: 'capitalize' }}>{e.category}</td>
              <td style={{ padding: '10px 0', color: '#888', textTransform: 'capitalize' }}>{e.muscleGroup}</td>
              <td style={{ padding: '10px 0', color: '#888' }}>{e.equipment ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 6: Create apps/web/src/pages/Progress.tsx**

```tsx
// apps/web/src/pages/Progress.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useDB } from '../App';
import type { Exercise, WorkoutSet } from '@workout/core';
import { epley1RM } from '@workout/core';
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory';

export default function Progress() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<WorkoutSet[]>([]);
  useEffect(() => { db.getExercises().then(setExercises); }, []);

  async function select(ex: Exercise) { setSelected(ex); setHistory(await db.getSetsByExercise(ex.id)); }

  const sessionBests = useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    for (const s of history) (groups[s.sessionId] ??= []).push(s);
    return Object.entries(groups).map(([, sets], i) => {
      const best = sets.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b);
      return { x: i + 1, y: epley1RM(best.weight, best.reps), weight: best.weight, reps: best.reps };
    });
  }, [history]);

  const pr = history.length ? history.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b) : null;

  if (!selected) return (
    <div>
      <h1>Progress</h1>
      <p style={{ color: '#888' }}>Select an exercise to view progress</p>
      <div style={{ maxWidth: 400 }}>
        {exercises.map(e => <div key={e.id} onClick={() => select(e)} style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}>{e.name}</div>)}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', marginBottom: 8 }}>← Back</button>
      <h1>{selected.name}</h1>
      {pr && (
        <div style={{ background: '#f0f7ff', borderRadius: 12, padding: 20, marginBottom: 24, display: 'inline-block' }}>
          <div style={{ color: '#007AFF', fontWeight: 600, marginBottom: 4 }}>All-Time PR</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{pr.weight}kg × {pr.reps} reps</div>
          <div style={{ color: '#555' }}>Est. 1RM: {epley1RM(pr.weight, pr.reps)}kg</div>
        </div>
      )}
      {sessionBests.length > 1 && (
        <div>
          <h3>Estimated 1RM Over Time</h3>
          <VictoryChart width={600} height={250}>
            <VictoryAxis />
            <VictoryAxis dependentAxis />
            <VictoryLine data={sessionBests} style={{ data: { stroke: '#007AFF', strokeWidth: 2 } }} />
          </VictoryChart>
        </div>
      )}
      {history.length === 0 && <p style={{ color: '#aaa' }}>No logged sets yet.</p>}
    </div>
  );
}
```

- [ ] **Step 7: Create apps/web/src/pages/ActiveWorkout.tsx**

```tsx
// apps/web/src/pages/ActiveWorkout.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useWorkoutStore } from '../store/workout';
import type { Exercise, RoutineExercise } from '@workout/core';
import { getNextRoutineIndex } from '@workout/core';

interface SetEntry { id: string; exerciseId: string; weight: string; reps: string; done: boolean; }

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const navigate = useNavigate();
  const { activeSession, sets, addSet, finishSession } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [localSets, setLocalSets] = useState<SetEntry[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSession?.routineId) return;
    (async () => {
      const res = await db.getRoutineExercises(activeSession.routineId!);
      const exList = (await Promise.all(res.map(re => db.getExerciseById(re.exerciseId)))).filter(Boolean) as Exercise[];
      setExercises(exList);
    })();
  }, [activeSession]);

  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) { if (restSeconds === 0) setRestSeconds(null); return; }
    const t = setTimeout(() => setRestSeconds(s => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [restSeconds]);

  function addRow(exerciseId: string) {
    setLocalSets(p => [...p, { id: crypto.randomUUID(), exerciseId, weight: '', reps: '', done: false }]);
  }

  async function completeSet(entry: SetEntry) {
    const weight = parseFloat(entry.weight);
    const reps = parseInt(entry.reps, 10);
    if (isNaN(weight) || isNaN(reps)) return;
    const s = { id: entry.id, sessionId: id!, exerciseId: entry.exerciseId, setNumber: sets.filter(s => s.exerciseId === entry.exerciseId).length + 1, weight, reps, rpe: null, completedAt: Date.now() };
    await db.addSet(s);
    addSet(s);
    setLocalSets(p => p.map(r => r.id === entry.id ? { ...r, done: true } : r));
    setRestSeconds(90);
  }

  async function handleFinish() {
    if (!id) return;
    await db.finishSession(id, Date.now());
    const pid = await db.getSetting('active_program_id');
    if (pid && activeSession?.routineId) {
      const routines = await db.getRoutinesByProgram(pid);
      const idx = routines.findIndex(r => r.id === activeSession.routineId);
      await db.setSetting('active_routine_index', String(getNextRoutineIndex(idx, routines.length)));
    }
    finishSession();
    navigate('/');
  }

  return (
    <div>
      {restSeconds !== null && (
        <div style={{ background: '#FF9500', color: '#fff', padding: '10px 20px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span>Rest: {restSeconds}s</span>
          <button onClick={() => setRestSeconds(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}>Skip</button>
        </div>
      )}

      {exercises.map(ex => {
        const exSets = localSets.filter(s => s.exerciseId === ex.id);
        return (
          <div key={ex.id} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <h3>{ex.name}</h3>
            {exSets.map(entry => (
              <div key={entry.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input placeholder="kg" value={entry.weight} onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, weight: e.target.value } : s))} style={{ width: 70, padding: 6, border: '1px solid #ccc', borderRadius: 6 }} disabled={entry.done} />
                <input placeholder="reps" value={entry.reps} onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, reps: e.target.value } : s))} style={{ width: 70, padding: 6, border: '1px solid #ccc', borderRadius: 6 }} disabled={entry.done} />
                {entry.done ? <span style={{ color: '#34C759', fontWeight: 'bold' }}>✓</span> : <button onClick={() => completeSet(entry)} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Log</button>}
              </div>
            ))}
            <button onClick={() => addRow(ex.id)} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer' }}>+ Add Set</button>
          </div>
        );
      })}

      <button onClick={handleFinish} style={{ background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, cursor: 'pointer', marginTop: 8 }}>Finish Workout</button>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): all page components — Today, History, Programs, Exercises, Progress, ActiveWorkout"
```

---

---

### Task 19: Volume per session on Progress screens

Add a volume bar/line to both mobile and web Progress screens. Volume = sum of weight × reps per session.

**Files:**
- Modify: `apps/mobile/app/(tabs)/progress.tsx`
- Modify: `apps/web/src/pages/Progress.tsx`

- [ ] **Step 1: Add volume to sessionBests in mobile progress.tsx**

Replace the `sessionBests` memo in `apps/mobile/app/(tabs)/progress.tsx`:

```ts
const sessionBests = React.useMemo(() => {
  const groups: Record<string, WorkoutSet[]> = {};
  for (const s of history) { (groups[s.sessionId] ??= []).push(s); }
  return Object.entries(groups).map(([, sets], i) => {
    const best = sets.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b);
    return {
      date: best.completedAt,
      estimated1RM: epley1RM(best.weight, best.reps),
      volume: calculateVolume(sets),
      bestWeight: best.weight,
      bestReps: best.reps,
    };
  }).sort((a, b) => a.date - b.date);
}, [history]);
```

Then below the 1RM chart, add a volume section:

```tsx
{sessionBests.length > 1 && (
  <View style={styles.chartContainer}>
    <Text style={styles.chartLabel}>Volume per Session (kg)</Text>
    <LineChart.Chart
      data={sessionBests.map((b, i) => ({ x: i, y: b.volume }))}
      height={200}
    >
      <LineChart.Line color="#FF9500" />
    </LineChart.Chart>
  </View>
)}
```

- [ ] **Step 2: Add volume to sessionBests in web Progress.tsx**

Replace the `sessionBests` memo in `apps/web/src/pages/Progress.tsx`:

```ts
const sessionBests = useMemo(() => {
  const groups: Record<string, WorkoutSet[]> = {};
  for (const s of history) (groups[s.sessionId] ??= []).push(s);
  return Object.entries(groups).map(([, sets], i) => {
    const best = sets.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b);
    return {
      x: i + 1,
      y: epley1RM(best.weight, best.reps),
      volume: calculateVolume(sets),
      weight: best.weight,
      reps: best.reps,
    };
  });
}, [history]);
```

Add the volume chart below the 1RM chart:

```tsx
{sessionBests.length > 1 && (
  <div>
    <h3>Volume per Session (kg)</h3>
    <VictoryChart width={600} height={250}>
      <VictoryAxis />
      <VictoryAxis dependentAxis />
      <VictoryLine
        data={sessionBests.map(b => ({ x: b.x, y: b.volume }))}
        style={{ data: { stroke: '#FF9500', strokeWidth: 2 } }}
      />
    </VictoryChart>
  </div>
)}
```

- [ ] **Step 3: Add `calculateVolume` import to both progress files**

In `apps/mobile/app/(tabs)/progress.tsx`, update the import:
```ts
import { epley1RM, calculateVolume } from '@workout/core';
```

In `apps/web/src/pages/Progress.tsx`, update the import:
```ts
import { epley1RM, calculateVolume } from '@workout/core';
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(tabs)/progress.tsx apps/web/src/pages/Progress.tsx
git commit -m "feat: add volume per session chart to progress screens"
```

---

### Task 20: Error handling — db write toasts

**Files:**
- Create: `apps/mobile/hooks/useToast.ts`
- Create: `apps/web/src/hooks/useToast.ts`
- Modify: `apps/mobile/app/workout/[id].tsx`
- Modify: `apps/web/src/pages/ActiveWorkout.tsx`

- [ ] **Step 1: Create mobile toast hook**

```ts
// apps/mobile/hooks/useToast.ts
import { Alert } from 'react-native';

export function useToast() {
  return {
    error: (msg: string) => Alert.alert('Error', msg),
  };
}
```

- [ ] **Step 2: Create web toast hook**

```ts
// apps/web/src/hooks/useToast.ts
export function useToast() {
  return {
    error: (msg: string) => {
      const el = document.createElement('div');
      el.textContent = msg;
      Object.assign(el.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: '#FF3B30', color: '#fff', padding: '10px 20px',
        borderRadius: '8px', fontSize: '14px', zIndex: '9999',
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    },
  };
}
```

- [ ] **Step 3: Wrap completeSet in try/catch in mobile ActiveWorkout**

In `apps/mobile/app/workout/[id].tsx`, add the import and wrap the db call:

```ts
import { useToast } from '../../hooks/useToast';

// inside component:
const { error } = useToast();

async function completeSet(entry: SetEntry) {
  const weight = parseFloat(entry.weight);
  const reps = parseInt(entry.reps, 10);
  if (isNaN(weight) || isNaN(reps)) { Alert.alert('Invalid', 'Enter valid weight and reps'); return; }
  const set = { /* same as before */ };
  try {
    await db.addSet(set);
    addSet(set);
    setLocalSets(prev => prev.map(s => s.id === entry.id ? { ...s, done: true } : s));
    setRestSeconds(90);
  } catch {
    error("Couldn't save set — try again");
  }
}
```

- [ ] **Step 4: Wrap completeSet and handleFinish in try/catch in web ActiveWorkout**

In `apps/web/src/pages/ActiveWorkout.tsx`, add the import and wrap both db calls:

```ts
import { useToast } from '../hooks/useToast';

// inside component:
const { error } = useToast();

async function completeSet(entry: SetEntry) {
  const weight = parseFloat(entry.weight);
  const reps = parseInt(entry.reps, 10);
  if (isNaN(weight) || isNaN(reps)) return;
  const s = { /* same as before */ };
  try {
    await db.addSet(s);
    addSet(s);
    setLocalSets(p => p.map(r => r.id === entry.id ? { ...r, done: true } : r));
    setRestSeconds(90);
  } catch {
    error("Couldn't save set — try again");
  }
}

async function handleFinish() {
  if (!id) return;
  try {
    await db.finishSession(id, Date.now());
    // ... rest of finish logic unchanged
    finishSession();
    navigate('/');
  } catch {
    error("Couldn't finish workout — try again");
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/hooks/ apps/web/src/hooks/ apps/mobile/app/workout/[id].tsx apps/web/src/pages/ActiveWorkout.tsx
git commit -m "feat: add error toast on db write failures"
```

---

### Task 21: Custom program creation (mobile + web)

**Files:**
- Create: `apps/mobile/app/programs/new.tsx`
- Create: `apps/web/src/pages/NewProgram.tsx`
- Modify: `apps/mobile/app/(tabs)/programs.tsx`
- Modify: `apps/web/src/pages/Programs.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Create mobile new-program screen**

```tsx
// apps/mobile/app/programs/new.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDB } from '../../db';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';
import { randomUUID } from 'expo-crypto';

export default function NewProgramScreen() {
  const db = useDB();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routines, setRoutines] = useState<Array<{ name: string; exercises: Array<{ exerciseId: string; sets: number; reps: string }> }>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, []);

  function addRoutine() {
    setRoutines(prev => [...prev, { name: `Day ${prev.length + 1}`, exercises: [] }]);
  }

  function addExerciseToRoutine(routineIdx: number, exerciseId: string) {
    setRoutines(prev => prev.map((r, i) =>
      i === routineIdx ? { ...r, exercises: [...r.exercises, { exerciseId, sets: 3, reps: '8-12' }] } : r
    ));
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const programId = randomUUID();
    const program = { id: programId, name: name.trim(), description: description.trim(), createdAt: Date.now() };
    const rList: Routine[] = routines.map((r, i) => ({ id: randomUUID(), programId, name: r.name, order: i }));
    const reList: RoutineExercise[] = routines.flatMap((r, ri) =>
      r.exercises.map((e, ei) => ({ id: randomUUID(), routineId: rList[ri].id, exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, order: ei }))
    );
    await db.seedPrograms([program], rList, reList);
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Program</Text>
      <TextInput style={styles.input} placeholder="Program name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Description (optional)" value={description} onChangeText={setDescription} />

      <Text style={styles.section}>Days</Text>
      {routines.map((routine, ri) => (
        <View key={ri} style={styles.routineBlock}>
          <TextInput style={styles.input} value={routine.name} onChangeText={v => setRoutines(prev => prev.map((r, i) => i === ri ? { ...r, name: v } : r))} />
          {routine.exercises.map((e, ei) => {
            const ex = exercises.find(x => x.id === e.exerciseId);
            return <Text key={ei} style={styles.exerciseItem}>{ex?.name ?? e.exerciseId} — {e.sets}×{e.reps}</Text>;
          })}
          <TouchableOpacity onPress={() => {
            Alert.alert('Add Exercise', 'Choose exercise', exercises.slice(0, 10).map(ex => ({ text: ex.name, onPress: () => addExerciseToRoutine(ri, ex.id) })));
          }}>
            <Text style={styles.addEx}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addRoutine} style={styles.addDay}>
        <Text style={styles.addDayText}>+ Add Day</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={save} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>Save Program</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  section: { fontWeight: '600', fontSize: 16, marginVertical: 12 },
  routineBlock: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 10 },
  exerciseItem: { color: '#555', fontSize: 14, marginBottom: 4 },
  addEx: { color: '#007AFF', fontSize: 14 },
  addDay: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 10, padding: 12, marginBottom: 12 },
  addDayText: { color: '#007AFF', textAlign: 'center' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 14 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
```

- [ ] **Step 2: Add "New Program" button to mobile programs.tsx**

In `apps/mobile/app/(tabs)/programs.tsx`, add a button at the top of the return:

```tsx
import { useRouter } from 'expo-router';
// inside component:
const router = useRouter();

// add below the title:
<TouchableOpacity style={styles.newBtn} onPress={() => router.push('/programs/new')}>
  <Text style={styles.newBtnText}>+ New Program</Text>
</TouchableOpacity>
```

Add to styles:
```ts
newBtn: { backgroundColor: '#f0f7ff', borderRadius: 10, padding: 12, marginBottom: 16 },
newBtnText: { color: '#007AFF', textAlign: 'center', fontWeight: '600' },
```

- [ ] **Step 3: Create web NewProgram.tsx**

```tsx
// apps/web/src/pages/NewProgram.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';

export default function NewProgram() {
  const db = useDB();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routines, setRoutines] = useState<Array<{ name: string; exercises: Array<{ exerciseId: string; sets: number; reps: string }> }>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, []);

  function addRoutine() {
    setRoutines(p => [...p, { name: `Day ${p.length + 1}`, exercises: [] }]);
  }

  function addExercise(routineIdx: number, exerciseId: string) {
    setRoutines(p => p.map((r, i) => i === routineIdx ? { ...r, exercises: [...r.exercises, { exerciseId, sets: 3, reps: '8-12' }] } : r));
  }

  async function save() {
    if (!name.trim()) return;
    const programId = crypto.randomUUID();
    const program = { id: programId, name: name.trim(), description: description.trim(), createdAt: Date.now() };
    const rList: Routine[] = routines.map((r, i) => ({ id: crypto.randomUUID(), programId, name: r.name, order: i }));
    const reList: RoutineExercise[] = routines.flatMap((r, ri) =>
      r.exercises.map((e, ei) => ({ id: crypto.randomUUID(), routineId: rList[ri].id, exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, order: ei }))
    );
    await db.seedPrograms([program], rList, reList);
    navigate('/programs');
  }

  const inputStyle: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 15, width: '100%', boxSizing: 'border-box', marginBottom: 10 };

  return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={() => navigate('/programs')} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', marginBottom: 8 }}>← Back</button>
      <h1>New Program</h1>
      <input style={inputStyle} placeholder="Program name" value={name} onChange={e => setName(e.target.value)} />
      <input style={inputStyle} placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />

      <h3>Days</h3>
      {routines.map((routine, ri) => (
        <div key={ri} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <input style={{ ...inputStyle, fontWeight: 600 }} value={routine.name} onChange={e => setRoutines(p => p.map((r, i) => i === ri ? { ...r, name: e.target.value } : r))} />
          {routine.exercises.map((e, ei) => {
            const ex = exercises.find(x => x.id === e.exerciseId);
            return <div key={ei} style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>{ex?.name ?? e.exerciseId} — {e.sets}×{e.reps}</div>;
          })}
          <select onChange={e => { if (e.target.value) { addExercise(ri, e.target.value); e.target.value = ''; } }} style={{ ...inputStyle, marginTop: 8 }}>
            <option value="">+ Add exercise…</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
      ))}

      <button onClick={addRoutine} style={{ border: '1px solid #007AFF', background: 'none', color: '#007AFF', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', marginBottom: 16, width: '100%' }}>+ Add Day</button>
      <button onClick={save} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, cursor: 'pointer', width: '100%' }}>Save Program</button>
    </div>
  );
}
```

- [ ] **Step 4: Wire NewProgram into web App.tsx**

In `apps/web/src/App.tsx`, add the import and route:

```tsx
import NewProgram from './pages/NewProgram';

// inside <Routes>:
<Route path="programs/new" element={<NewProgram />} />
```

- [ ] **Step 5: Add "New Program" link to web Programs.tsx**

In `apps/web/src/pages/Programs.tsx`, add a button:

```tsx
import { useNavigate } from 'react-router-dom';
// inside component:
const navigate = useNavigate();

// below <h1>:
<button onClick={() => navigate('/programs/new')} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', marginBottom: 20 }}>+ New Program</button>
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/programs/ apps/mobile/app/(tabs)/programs.tsx apps/web/src/pages/NewProgram.tsx apps/web/src/pages/Programs.tsx apps/web/src/App.tsx
git commit -m "feat: custom program creation on mobile and web"
```

---

## Final verification

- [ ] **Run all tests**

```bash
pnpm test
```

Expected: All Vitest tests pass across `packages/core` and `packages/db`.

- [ ] **Run mobile**

```bash
cd apps/mobile && pnpm start
```

Expected: Expo starts, Today screen loads, no TypeScript errors.

- [ ] **Run web**

```bash
cd apps/web && pnpm dev
```

Expected: Vite starts, sidebar visible, all pages navigate correctly.

- [ ] **Manual smoke test: mobile**
  1. Open app → Today screen
  2. Navigate to Programs → Start PPL
  3. Return to Today → "Start: Push" button appears
  4. Start workout → log 2 sets on Bench Press → Finish
  5. History → session appears
  6. Progress → select Bench Press → PR card shows

- [ ] **Manual smoke test: web**
  1. Same flow as mobile smoke test
  2. Verify sidebar nav works on all pages
  3. Verify chart renders on Progress page after logging sets

- [ ] **Final commit**

```bash
git add .
git commit -m "chore: complete workout tracker v1"
```

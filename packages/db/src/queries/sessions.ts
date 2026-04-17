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
  const row = get<SessionRow>('SELECT * FROM workout_session WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1');
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

// Only returns sets from finished sessions — use getSetsBySession for in-progress sets
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

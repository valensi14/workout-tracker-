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

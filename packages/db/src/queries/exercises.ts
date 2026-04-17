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

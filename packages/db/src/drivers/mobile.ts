// packages/db/src/drivers/mobile.ts
// Requires: expo-sqlite installed in apps/mobile
import type { DB } from '../interface';
import { CREATE_TABLES_SQL } from '../schema';
import { BUILT_IN_EXERCISES } from '../seed/exercises';
import { BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from '../seed/programs';

export async function createMobileDB(SQLite: any): Promise<DB> {
  const db = await SQLite.openDatabaseAsync('workout.db');
  await db.execAsync(CREATE_TABLES_SQL);
  await db.runAsync('PRAGMA foreign_keys = ON');

  const run = async (sql: string, params: unknown[] = []) => {
    await db.runAsync(sql, params);
  };
  const get = async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
    return (await db.getFirstAsync(sql, params)) as T | null;
  };
  const all = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
    return (await db.getAllAsync(sql, params)) as T[];
  };

  // Seed on first open (INSERT OR IGNORE = idempotent)
  for (const e of BUILT_IN_EXERCISES) {
    await run(
      'INSERT OR IGNORE INTO exercise (id, name, category, muscle_group, equipment) VALUES (?, ?, ?, ?, ?)',
      [e.id, e.name, e.category, e.muscleGroup, e.equipment]
    );
  }
  for (const p of BUILT_IN_PROGRAMS) {
    await run('INSERT OR IGNORE INTO program (id, name, description, created_at) VALUES (?, ?, ?, ?)',
      [p.id, p.name, p.description, p.createdAt]);
  }
  for (const r of BUILT_IN_ROUTINES) {
    await run('INSERT OR IGNORE INTO routine (id, program_id, name, sort_order) VALUES (?, ?, ?, ?)',
      [r.id, r.programId, r.name, r.order]);
  }
  for (const re of BUILT_IN_ROUTINE_EXERCISES) {
    await run('INSERT OR IGNORE INTO routine_exercise (id, routine_id, exercise_id, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [re.id, re.routineId, re.exerciseId, re.sets, re.reps, re.order]);
  }

  return {
    getExercises: () => all<any>('SELECT * FROM exercise ORDER BY name').then(rows =>
      rows.map(r => ({ id: r.id, name: r.name, category: r.category, muscleGroup: r.muscle_group, equipment: r.equipment }))),

    getExerciseById: (id) => get<any>('SELECT * FROM exercise WHERE id = ?', [id]).then(r =>
      r ? { id: r.id, name: r.name, category: r.category, muscleGroup: r.muscle_group, equipment: r.equipment } : null),

    getPrograms: () => all<any>('SELECT * FROM program ORDER BY name').then(rows =>
      rows.map(r => ({ id: r.id, name: r.name, description: r.description, createdAt: r.created_at }))),

    getRoutinesByProgram: (programId) => all<any>('SELECT * FROM routine WHERE program_id = ? ORDER BY sort_order', [programId]).then(rows =>
      rows.map(r => ({ id: r.id, programId: r.program_id, name: r.name, order: r.sort_order }))),

    getRoutineExercises: (routineId) => all<any>('SELECT * FROM routine_exercise WHERE routine_id = ? ORDER BY sort_order', [routineId]).then(rows =>
      rows.map(r => ({ id: r.id, routineId: r.routine_id, exerciseId: r.exercise_id, sets: r.sets, reps: r.reps, order: r.sort_order }))),

    getDraftSession: () => get<any>('SELECT * FROM workout_session WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1').then(r =>
      r ? { id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes } : null),

    createSession: (s) => run(
      'INSERT INTO workout_session (id, routine_id, started_at, finished_at, notes) VALUES (?, ?, ?, ?, ?)',
      [s.id, s.routineId, s.startedAt, s.finishedAt, s.notes]
    ),

    finishSession: (id, finishedAt) => run(
      'UPDATE workout_session SET finished_at = ? WHERE id = ?', [finishedAt, id]
    ),

    getSessions: (limit = 50) => all<any>(
      'SELECT * FROM workout_session WHERE finished_at IS NOT NULL ORDER BY started_at DESC LIMIT ?', [limit]
    ).then(rows => rows.map(r => ({ id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes }))),

    getSessionById: (id) => get<any>('SELECT * FROM workout_session WHERE id = ?', [id]).then(r =>
      r ? { id: r.id, routineId: r.routine_id, startedAt: r.started_at, finishedAt: r.finished_at, notes: r.notes } : null),

    addSet: (s) => run(
      'INSERT INTO workout_set (id, session_id, exercise_id, set_number, weight, reps, rpe, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.sessionId, s.exerciseId, s.setNumber, s.weight, s.reps, s.rpe, s.completedAt]
    ),

    deleteSet: (id) => run('DELETE FROM workout_set WHERE id = ?', [id]),

    getSetsBySession: (sessionId) => all<any>(
      'SELECT * FROM workout_set WHERE session_id = ? ORDER BY set_number', [sessionId]
    ).then(rows => rows.map(r => ({ id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id, setNumber: r.set_number, weight: r.weight, reps: r.reps, rpe: r.rpe, completedAt: r.completed_at }))),

    getSetsByExercise: (exerciseId) => all<any>(
      `SELECT ws.* FROM workout_set ws
       JOIN workout_session s ON s.id = ws.session_id
       WHERE ws.exercise_id = ? AND s.finished_at IS NOT NULL
       ORDER BY ws.completed_at DESC`,
      [exerciseId]
    ).then(rows => rows.map(r => ({ id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id, setNumber: r.set_number, weight: r.weight, reps: r.reps, rpe: r.rpe, completedAt: r.completed_at }))),

    getSetting: (key) => get<any>('SELECT value FROM user_setting WHERE key = ?', [key]).then(r => r?.value ?? null),

    setSetting: (key, value) => run('INSERT OR REPLACE INTO user_setting (key, value) VALUES (?, ?)', [key, value]),

    seedExercises: async (exercises) => {
      for (const e of exercises) {
        await run('INSERT OR IGNORE INTO exercise (id, name, category, muscle_group, equipment) VALUES (?, ?, ?, ?, ?)',
          [e.id, e.name, e.category, e.muscleGroup, e.equipment]);
      }
    },

    seedPrograms: async (programs, routines, routineExercises) => {
      for (const p of programs) {
        await run('INSERT OR IGNORE INTO program (id, name, description, created_at) VALUES (?, ?, ?, ?)',
          [p.id, p.name, p.description, p.createdAt]);
      }
      for (const r of routines) {
        await run('INSERT OR IGNORE INTO routine (id, program_id, name, sort_order) VALUES (?, ?, ?, ?)',
          [r.id, r.programId, r.name, r.order]);
      }
      for (const re of routineExercises) {
        await run('INSERT OR IGNORE INTO routine_exercise (id, routine_id, exercise_id, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [re.id, re.routineId, re.exerciseId, re.sets, re.reps, re.order]);
      }
    },
  };
}

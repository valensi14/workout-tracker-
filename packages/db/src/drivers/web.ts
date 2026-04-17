// packages/db/src/drivers/web.ts
// Requires: idb installed in apps/web
import type { DB } from '../interface';
import { BUILT_IN_EXERCISES } from '../seed/exercises';
import { BUILT_IN_PROGRAMS, BUILT_IN_ROUTINES, BUILT_IN_ROUTINE_EXERCISES } from '../seed/programs';

export async function createWebDB(openDB: any): Promise<DB> {
  const db = await openDB('workout-db', 1, {
    upgrade(db: any) {
      if (!db.objectStoreNames.contains('exercise'))
        db.createObjectStore('exercise', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('program'))
        db.createObjectStore('program', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('routine')) {
        const s = db.createObjectStore('routine', { keyPath: 'id' });
        s.createIndex('programId', 'programId');
      }
      if (!db.objectStoreNames.contains('routine_exercise')) {
        const s = db.createObjectStore('routine_exercise', { keyPath: 'id' });
        s.createIndex('routineId', 'routineId');
      }
      if (!db.objectStoreNames.contains('workout_session')) {
        const s = db.createObjectStore('workout_session', { keyPath: 'id' });
        s.createIndex('finishedAt', 'finishedAt');
      }
      if (!db.objectStoreNames.contains('workout_set')) {
        const s = db.createObjectStore('workout_set', { keyPath: 'id' });
        s.createIndex('sessionId', 'sessionId');
        s.createIndex('exerciseId', 'exerciseId');
      }
      if (!db.objectStoreNames.contains('user_setting'))
        db.createObjectStore('user_setting', { keyPath: 'key' });
    },
  });

  // Seed on first open
  for (const e of BUILT_IN_EXERCISES) {
    const existing = await db.get('exercise', e.id);
    if (!existing) await db.put('exercise', e);
  }
  for (const p of BUILT_IN_PROGRAMS) {
    const existing = await db.get('program', p.id);
    if (!existing) await db.put('program', p);
  }
  for (const r of BUILT_IN_ROUTINES) {
    const existing = await db.get('routine', r.id);
    if (!existing) await db.put('routine', r);
  }
  for (const re of BUILT_IN_ROUTINE_EXERCISES) {
    const existing = await db.get('routine_exercise', re.id);
    if (!existing) await db.put('routine_exercise', re);
  }

  return {
    getExercises: () => db.getAll('exercise'),
    getExerciseById: (id) => db.get('exercise', id),
    getPrograms: () => db.getAll('program'),
    getRoutinesByProgram: (programId) => db.getAllFromIndex('routine', 'programId', programId),
    getRoutineExercises: (routineId) => db.getAllFromIndex('routine_exercise', 'routineId', routineId),

    getDraftSession: async () => {
      const all = await db.getAll('workout_session') as any[];
      const drafts = all.filter(s => s.finishedAt == null);
      if (drafts.length === 0) return null;
      // Return most recently started draft (mirrors mobile driver behaviour)
      return drafts.sort((a, b) => b.startedAt - a.startedAt)[0];
    },

    createSession: (s) => db.put('workout_session', s).then(() => {}),

    finishSession: async (id, finishedAt) => {
      const s = await db.get('workout_session', id);
      if (s) await db.put('workout_session', { ...s, finishedAt });
    },

    getSessions: async (limit = 50) => {
      const all = await db.getAll('workout_session') as any[];
      return all
        .filter(s => s.finishedAt != null)
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, limit);
    },

    getSessionById: (id) => db.get('workout_session', id),

    addSet: (s) => db.put('workout_set', s).then(() => {}),
    deleteSet: (id) => db.delete('workout_set', id).then(() => {}),
    getSetsBySession: (sessionId) => db.getAllFromIndex('workout_set', 'sessionId', sessionId),

    getSetsByExercise: async (exerciseId) => {
      const sets = await db.getAllFromIndex('workout_set', 'exerciseId', exerciseId) as any[];
      const sessions = await db.getAll('workout_session') as any[];
      const finishedIds = new Set(sessions.filter(s => s.finishedAt != null).map((s: any) => s.id));
      return sets
        .filter(s => finishedIds.has(s.sessionId))
        .sort((a, b) => b.completedAt - a.completedAt);
    },

    getSetting: async (key) => {
      const r = await db.get('user_setting', key);
      return r?.value ?? null;
    },
    setSetting: (key, value) => db.put('user_setting', { key, value }).then(() => {}),

    seedExercises: async (exercises) => {
      for (const e of exercises) {
        const existing = await db.get('exercise', e.id);
        if (!existing) await db.put('exercise', e);
      }
    },
    seedPrograms: async (programs, routines, routineExercises) => {
      for (const p of programs) await db.put('program', p);
      for (const r of routines) await db.put('routine', r);
      for (const re of routineExercises) await db.put('routine_exercise', re);
    },
  };
}

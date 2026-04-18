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
    const ex = [{ id: '1', name: 'Squat', category: 'legs' as const, muscleGroup: 'quads' as const, equipment: null }];
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

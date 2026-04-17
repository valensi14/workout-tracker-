// packages/db/src/schema.ts

export const CREATE_TABLES_SQL = `
  -- Note: run PRAGMA foreign_keys = ON in the driver to enforce FK constraints
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

  -- reps is TEXT (not INTEGER) to support ranges like "8-12"; workout_set.reps is INTEGER (exact count)
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

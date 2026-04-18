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

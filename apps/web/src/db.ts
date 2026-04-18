import { openDB } from 'idb';
import { createWebDB } from '@workout/db';
import type { DB } from '@workout/db';

let instance: DB | null = null;

export async function getDB(): Promise<DB> {
  if (instance) return instance;
  instance = await createWebDB(openDB);
  return instance;
}

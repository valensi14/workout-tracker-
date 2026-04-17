// apps/mobile/db.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { createMobileDB } from '@workout/db';
import type { DB } from '@workout/db';

const DBContext = createContext<DB | null>(null);

export function DBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);

  useEffect(() => {
    createMobileDB(SQLite).then(setDb);
  }, []);

  if (!db) return null; // loading — could render a spinner here in future
  return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}

export function useDB(): DB {
  const db = useContext(DBContext);
  if (!db) throw new Error('useDB must be used within DBProvider');
  return db;
}

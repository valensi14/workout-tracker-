import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getDB } from './db';
import type { DB } from '@workout/db';
import Layout from './components/Layout';
import Today from './pages/Today';
import History from './pages/History';
import Programs from './pages/Programs';
import Exercises from './pages/Exercises';
import Progress from './pages/Progress';
import ActiveWorkout from './pages/ActiveWorkout';
import NewProgram from './pages/NewProgram';

export const DBContext = React.createContext<DB | null>(null);
export function useDB(): DB {
  const db = React.useContext(DBContext);
  if (!db) throw new Error('DB not ready');
  return db;
}

export default function App() {
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => { getDB().then(setDb); }, []);
  if (!db) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <DBContext.Provider value={db}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="history" element={<History />} />
          <Route path="programs" element={<Programs />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="progress" element={<Progress />} />
          <Route path="workout/:id" element={<ActiveWorkout />} />
          <Route path="programs/new" element={<NewProgram />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </DBContext.Provider>
  );
}

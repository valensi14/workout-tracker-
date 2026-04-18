import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useWorkoutStore } from '../store/workout';
import type { Routine, WorkoutSession } from '@workout/core';

function btn(bg: string) {
  return { background: bg, color: bg === 'transparent' ? undefined : '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 15, cursor: 'pointer', fontWeight: 600 } as React.CSSProperties;
}

export default function Today() {
  const db = useDB();
  const navigate = useNavigate();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [nextRoutine, setNextRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    (async () => {
      if (!activeSession) {
        const draft = await db.getDraftSession();
        if (draft) { const sets = await db.getSetsBySession(draft.id); restoreSession(draft, sets); }
      }
      const pid = await db.getSetting('active_program_id');
      if (pid) {
        const idx = parseInt((await db.getSetting('active_routine_index')) ?? '0', 10);
        const routines = await db.getRoutinesByProgram(pid);
        if (routines.length) setNextRoutine(routines[idx % routines.length]);
        else setNextRoutine(null);
      } else {
        setNextRoutine(null);
      }
    })();
  }, []);

  async function startWorkout(routine: Routine | null) {
    const session: WorkoutSession = { id: crypto.randomUUID(), routineId: routine?.id ?? null, startedAt: Date.now(), finishedAt: null, notes: null };
    try {
      await db.createSession(session);
      startSession(session);
      navigate(`/workout/${session.id}`);
    } catch {
      alert("Couldn't start workout — try again");
    }
  }

  return (
    <div>
      <h1>Today</h1>
      {activeSession ? (
        <button onClick={() => navigate(`/workout/${activeSession.id}`)} style={btn('#34C759')}>Resume Workout</button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          {nextRoutine && <button onClick={() => startWorkout(nextRoutine)} style={btn('#007AFF')}>Start: {nextRoutine.name}</button>}
          <button onClick={() => startWorkout(null)} style={{ ...btn('transparent'), color: '#007AFF', border: '1px solid #007AFF' }}>Start Empty Workout</button>
        </div>
      )}
    </div>
  );
}

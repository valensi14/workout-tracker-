import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useToast } from '../hooks/useToast';
import { useWorkoutStore } from '../store/workout';
import type { Exercise } from '@workout/core';
import { getNextRoutineIndex } from '@workout/core';

interface SetEntry { id: string; exerciseId: string; weight: string; reps: string; done: boolean; }

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const navigate = useNavigate();
  const { error } = useToast();
  const { activeSession, sets, addSet, finishSession } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [localSets, setLocalSets] = useState<SetEntry[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSession || !activeSession.routineId) return;
    (async () => {
      const res = await db.getRoutineExercises(activeSession.routineId);
      const exList = (await Promise.all(res.map(re => db.getExerciseById(re.exerciseId)))).filter(Boolean) as Exercise[];
      // Pre-populate one empty set row per exercise
      setExercises(exList);
      setLocalSets(exList.map(ex => ({ id: crypto.randomUUID(), exerciseId: ex.id, weight: '', reps: '', done: false })));
    })();
  }, [activeSession, db]);

  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) { if (restSeconds === 0) setRestSeconds(null); return; }
    const t = setTimeout(() => setRestSeconds(s => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [restSeconds]);

  function addRow(exerciseId: string) {
    setLocalSets(p => [...p, { id: crypto.randomUUID(), exerciseId, weight: '', reps: '', done: false }]);
  }

  async function completeSet(entry: SetEntry) {
    const weight = parseFloat(entry.weight);
    const reps = parseInt(entry.reps, 10);
    if (isNaN(weight) || isNaN(reps)) return;
    if (!id) return;
    const s = { id: entry.id, sessionId: id, exerciseId: entry.exerciseId, setNumber: sets.filter(s => s.exerciseId === entry.exerciseId).length + 1, weight, reps, rpe: null, completedAt: Date.now() };
    try {
      await db.addSet(s);
      addSet(s);
      setLocalSets(p => p.map(r => r.id === entry.id ? { ...r, done: true } : r));
      setRestSeconds(90);
    } catch {
      error("Couldn't save set — try again");
    }
  }

  async function handleFinish() {
    if (!id) return;
    try {
      await db.finishSession(id, Date.now());
      const pid = await db.getSetting('active_program_id');
      if (pid && activeSession?.routineId) {
        const routines = await db.getRoutinesByProgram(pid);
        const idx = routines.findIndex(r => r.id === activeSession.routineId);
        await db.setSetting('active_routine_index', String(getNextRoutineIndex(idx >= 0 ? idx : 0, routines.length)));
      }
      finishSession();
      navigate('/');
    } catch {
      error("Couldn't finish workout — try again");
    }
  }

  return (
    <div>
      {restSeconds !== null && (
        <div style={{ background: '#FF9500', color: '#fff', padding: '10px 20px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span>Rest: {restSeconds}s</span>
          <button onClick={() => setRestSeconds(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}>Skip</button>
        </div>
      )}

      {exercises.map(ex => {
        const exSets = localSets.filter(s => s.exerciseId === ex.id);
        return (
          <div key={ex.id} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <h3>{ex.name}</h3>
            {exSets.map(entry => (
              <div key={entry.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input placeholder="kg" value={entry.weight} onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, weight: e.target.value } : s))} style={{ width: 70, padding: 6, border: '1px solid #ccc', borderRadius: 6, opacity: entry.done ? 0.5 : 1 }} disabled={entry.done} />
                <input placeholder="reps" value={entry.reps} onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, reps: e.target.value } : s))} style={{ width: 70, padding: 6, border: '1px solid #ccc', borderRadius: 6, opacity: entry.done ? 0.5 : 1 }} disabled={entry.done} />
                {entry.done ? <span style={{ color: '#34C759', fontWeight: 'bold' }}>✓</span> : <button onClick={() => completeSet(entry)} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Log</button>}
              </div>
            ))}
            <button onClick={() => addRow(ex.id)} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer' }}>+ Add Set</button>
          </div>
        );
      })}

      {exercises.length === 0 && (
        <p style={{ color: '#999' }}>No exercises. Add some below.</p>
      )}

      <button onClick={handleFinish} style={{ background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, cursor: 'pointer', marginTop: 8 }}>Finish Workout</button>
    </div>
  );
}

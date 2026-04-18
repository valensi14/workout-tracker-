// apps/web/src/pages/NewProgram.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';

export default function NewProgram() {
  const db = useDB();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routines, setRoutines] = useState<Array<{ name: string; exercises: Array<{ exerciseId: string; sets: number; reps: string }> }>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, []);

  function addRoutine() {
    setRoutines(p => [...p, { name: `Day ${p.length + 1}`, exercises: [] }]);
  }

  function addExercise(routineIdx: number, exerciseId: string) {
    setRoutines(p => p.map((r, i) => i === routineIdx ? { ...r, exercises: [...r.exercises, { exerciseId, sets: 3, reps: '8-12' }] } : r));
  }

  async function save() {
    if (!name.trim()) return;
    const programId = crypto.randomUUID();
    const program = { id: programId, name: name.trim(), description: description.trim(), createdAt: Date.now() };
    const rList: Routine[] = routines.map((r, i) => ({ id: crypto.randomUUID(), programId, name: r.name, order: i }));
    const reList: RoutineExercise[] = routines.flatMap((r, ri) =>
      r.exercises.map((e, ei) => ({ id: crypto.randomUUID(), routineId: rList[ri].id, exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, order: ei }))
    );
    try {
      await db.seedPrograms([program], rList, reList);
      navigate('/programs');
    } catch {
      alert("Couldn't save program — try again");
    }
  }

  const inputStyle: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 15, width: '100%', boxSizing: 'border-box', marginBottom: 10 };

  return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={() => navigate('/programs')} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', marginBottom: 8 }}>← Back</button>
      <h1>New Program</h1>
      <input style={inputStyle} placeholder="Program name" value={name} onChange={e => setName(e.target.value)} />
      <input style={inputStyle} placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />

      <h3>Days</h3>
      {routines.map((routine, ri) => (
        <div key={ri} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <input style={{ ...inputStyle, fontWeight: 600 }} value={routine.name} onChange={e => setRoutines(p => p.map((r, i) => i === ri ? { ...r, name: e.target.value } : r))} />
          {routine.exercises.map((e, ei) => {
            const ex = exercises.find(x => x.id === e.exerciseId);
            return <div key={ei} style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>{ex?.name ?? e.exerciseId} — {e.sets}×{e.reps}</div>;
          })}
          <select onChange={e => { if (e.target.value) { addExercise(ri, e.target.value); e.target.value = ''; } }} style={{ ...inputStyle, marginTop: 8 }}>
            <option value="">+ Add exercise…</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
      ))}

      <button onClick={addRoutine} style={{ border: '1px solid #007AFF', background: 'none', color: '#007AFF', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', marginBottom: 16, width: '100%' }}>+ Add Day</button>
      <button onClick={save} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, cursor: 'pointer', width: '100%' }}>Save Program</button>
    </div>
  );
}

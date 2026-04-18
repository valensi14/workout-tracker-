import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useToast } from '../hooks/useToast';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';

interface SelectedExercise {
  exerciseId: string;
  sets: number;
  reps: string;
}

export default function NewProgram() {
  const db = useDB();
  const navigate = useNavigate();
  const { error } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);

  useEffect(() => { db.getExercises().then(setExercises); }, [db]);

  function addExercise(exerciseId: string) {
    if (!exerciseId) return;
    if (selected.find(s => s.exerciseId === exerciseId)) return; // no duplicates
    setSelected(p => [...p, { exerciseId, sets: 3, reps: '8-12' }]);
  }

  function removeExercise(exerciseId: string) {
    setSelected(p => p.filter(s => s.exerciseId !== exerciseId));
  }

  function updateSets(exerciseId: string, sets: number) {
    setSelected(p => p.map(s => s.exerciseId === exerciseId ? { ...s, sets } : s));
  }

  function updateReps(exerciseId: string, reps: string) {
    setSelected(p => p.map(s => s.exerciseId === exerciseId ? { ...s, reps } : s));
  }

  async function save() {
    if (!name.trim()) { error('Template name is required'); return; }
    const programId = crypto.randomUUID();
    const routineId = crypto.randomUUID();
    const program = { id: programId, name: name.trim(), description: description.trim(), createdAt: Date.now() };
    const routine: Routine = { id: routineId, programId, name: 'Day 1', order: 0 };
    const routineExercises: RoutineExercise[] = selected.map((s, i) => ({
      id: crypto.randomUUID(),
      routineId,
      exerciseId: s.exerciseId,
      sets: s.sets,
      reps: s.reps,
      order: i,
    }));
    try {
      await db.seedPrograms([program], [routine], routineExercises);
      navigate('/programs');
    } catch {
      error("Couldn't save template — try again");
    }
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px',
    fontSize: 15, width: '100%', boxSizing: 'border-box', marginBottom: 10,
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={() => navigate('/programs')} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', marginBottom: 8 }}>← Back</button>
      <h1>New Template</h1>

      <input style={inputStyle} placeholder="Template name" value={name} onChange={e => setName(e.target.value)} />
      <input style={inputStyle} placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />

      <h3 style={{ marginBottom: 12 }}>Exercises</h3>

      {/* Selected exercises list */}
      {selected.length === 0 && (
        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>No exercises added yet.</p>
      )}
      {selected.map(s => {
        const ex = exercises.find(e => e.id === s.exerciseId);
        return (
          <div key={s.exerciseId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8 }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{ex?.name ?? s.exerciseId}</span>
            <input
              type="number"
              min={1}
              value={s.sets}
              onChange={e => updateSets(s.exerciseId, parseInt(e.target.value) || 1)}
              style={{ width: 50, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, textAlign: 'center' }}
            />
            <span style={{ color: '#888', fontSize: 13 }}>sets</span>
            <input
              value={s.reps}
              onChange={e => updateReps(s.exerciseId, e.target.value)}
              style={{ width: 60, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, textAlign: 'center' }}
              placeholder="reps"
            />
            <span style={{ color: '#888', fontSize: 13 }}>reps</span>
            <button onClick={() => removeExercise(s.exerciseId)} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        );
      })}

      {/* Exercise picker */}
      <select
        onChange={e => { addExercise(e.target.value); e.target.value = ''; }}
        style={{ ...inputStyle, marginTop: 4, color: selected.length === 0 ? '#888' : '#333' }}
        defaultValue=""
      >
        <option value="">+ Add exercise…</option>
        {exercises.map(ex => (
          <option key={ex.id} value={ex.id} disabled={!!selected.find(s => s.exerciseId === ex.id)}>
            {ex.name}
          </option>
        ))}
      </select>

      <button
        onClick={save}
        style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 8 }}
      >
        Save Template
      </button>
    </div>
  );
}

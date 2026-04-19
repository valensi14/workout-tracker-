import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useToast } from '../hooks/useToast';
import type { Exercise, Routine, RoutineExercise } from '@workout/core';

interface SelectedExercise {
  exerciseId: string;
  sets: number;
  reps: string;
}

const GROUP_ORDER = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core', 'forearms', 'full_body',
];

const GROUP_LABELS: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes',
  calves: 'Calves', core: 'Core', full_body: 'Full Body',
};

export default function NewProgram() {
  const db = useDB();
  const navigate = useNavigate();
  const { error } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => { db.getExercises().then(setExercises); }, [db]);

  function addExercise(exerciseId: string) {
    if (selected.find(s => s.exerciseId === exerciseId)) return;
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

  // Group exercises by muscleGroup, filtered by search
  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = exercises.filter(e =>
      e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
    );
    const map: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      (map[ex.muscleGroup] ??= []).push(ex);
    }
    return map;
  }, [exercises, search]);

  // When searching, auto-expand all groups
  const isSearching = search.length > 0;

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
    <div style={{ maxWidth: 680 }}>
      <button onClick={() => navigate('/programs')} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', marginBottom: 8 }}>← Back</button>
      <h1>New Template</h1>

      <input style={inputStyle} placeholder="Template name" value={name} onChange={e => setName(e.target.value)} />
      <input style={inputStyle} placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />

      {/* Selected exercises */}
      <h3 style={{ marginBottom: 8 }}>Selected Exercises {selected.length > 0 && <span style={{ color: '#007AFF', fontSize: 14, fontWeight: 400 }}>({selected.length})</span>}</h3>
      {selected.length === 0 && (
        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>No exercises added yet. Pick from the list below.</p>
      )}
      {selected.map(s => {
        const ex = exercises.find(e => e.id === s.exerciseId);
        return (
          <div key={s.exerciseId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '10px 12px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #d0e8ff' }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{ex?.name ?? s.exerciseId}</span>
            <input
              type="number" min={1} value={s.sets}
              onChange={e => updateSets(s.exerciseId, parseInt(e.target.value) || 1)}
              style={{ width: 46, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, textAlign: 'center', fontSize: 13 }}
            />
            <span style={{ color: '#888', fontSize: 12 }}>sets</span>
            <input
              value={s.reps}
              onChange={e => updateReps(s.exerciseId, e.target.value)}
              style={{ width: 56, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, textAlign: 'center', fontSize: 13 }}
              placeholder="reps"
            />
            <span style={{ color: '#888', fontSize: 12 }}>reps</span>
            <button onClick={() => removeExercise(s.exerciseId)} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
        );
      })}

      {/* Exercise browser */}
      <h3 style={{ marginTop: 20, marginBottom: 8 }}>Add Exercises</h3>
      <input
        style={{ ...inputStyle, marginBottom: 12 }}
        placeholder="Search exercises…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
        {GROUP_ORDER.filter(g => grouped[g]?.length > 0).map(group => {
          const isOpen = isSearching || expandedGroup === group;
          const groupExercises = grouped[group] ?? [];
          return (
            <div key={group}>
              {/* Group header */}
              <button
                onClick={() => setExpandedGroup(isOpen && !isSearching ? null : group)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: '#fafafa', border: 'none', borderBottom: '1px solid #eee',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontWeight: 600, fontSize: 14,
                }}
              >
                <span>{GROUP_LABELS[group]}</span>
                <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>
                  {groupExercises.filter(e => selected.find(s => s.exerciseId === e.id)).length > 0
                    ? `${groupExercises.filter(e => selected.find(s => s.exerciseId === e.id)).length} added · `
                    : ''}
                  {groupExercises.length} exercises {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Exercise list */}
              {isOpen && groupExercises.map(ex => {
                const isAdded = !!selected.find(s => s.exerciseId === ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => isAdded ? removeExercise(ex.id) : addExercise(ex.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', borderBottom: '1px solid #f5f5f5',
                      cursor: 'pointer', background: isAdded ? '#f0fff4' : '#fff',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isAdded) (e.currentTarget as HTMLDivElement).style.background = '#f9f9f9'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isAdded ? '#f0fff4' : '#fff'; }}
                  >
                    <span style={{ fontSize: 14, color: isAdded ? '#1a7a3a' : '#333' }}>{ex.name}</span>
                    <span style={{ fontSize: 13, color: isAdded ? '#34C759' : '#007AFF', fontWeight: 600 }}>
                      {isAdded ? '✓ Added' : '+ Add'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
        {GROUP_ORDER.filter(g => grouped[g]?.length > 0).length === 0 && (
          <p style={{ padding: 20, color: '#aaa', textAlign: 'center', margin: 0 }}>No exercises match "{search}"</p>
        )}
      </div>

      <button
        onClick={save}
        style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 16 }}
      >
        Save Template
      </button>
    </div>
  );
}

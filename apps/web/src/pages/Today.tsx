import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useWorkoutStore } from '../store/workout';
import type { Program, WorkoutSession } from '@workout/core';

interface TemplateCard {
  program: Program;
  firstRoutineId: string | null;
  exerciseNames: string[];
}

export default function Today() {
  const db = useDB();
  const navigate = useNavigate();
  const { startSession } = useWorkoutStore();
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [selected, setSelected] = useState<TemplateCard | null>(null);

  useEffect(() => {
    (async () => {
      const [progs, allExercises] = await Promise.all([
        db.getPrograms(),
        db.getExercises(),
      ]);
      const exerciseMap = new Map(allExercises.map(e => [e.id, e.name]));
      const cards = await Promise.all(progs.map(async p => {
        const routines = await db.getRoutinesByProgram(p.id);
        const first = routines[0] ?? null;
        let exerciseNames: string[] = [];
        if (first) {
          const res = await db.getRoutineExercises(first.id);
          exerciseNames = res.map(re => exerciseMap.get(re.exerciseId) ?? '').filter(Boolean);
        }
        return { program: p, firstRoutineId: first?.id ?? null, exerciseNames };
      }));
      setTemplates(cards);
    })();
  }, []);

  async function startWorkout(card: TemplateCard) {
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      routineId: card.firstRoutineId,
      startedAt: Date.now(),
      finishedAt: null,
      notes: null,
    };
    await db.createSession(session);
    startSession(session);
    navigate(`/workout/${session.id}`);
  }

  return (
    <div style={{ padding: '20px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>My Templates</h2>
        <button
          onClick={() => navigate('/programs/new')}
          style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + Template
        </button>
      </div>

      {/* Grid */}
      {templates.length === 0 ? (
        <p style={{ color: '#8E8E93', fontSize: 15, textAlign: 'center', marginTop: 60 }}>
          No templates yet. Tap + Template to create one.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {templates.map(card => (
            <div
              key={card.program.id}
              onClick={() => setSelected(card)}
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 16,
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1C1C1E', marginBottom: 4 }}>
                {card.program.name}
              </div>
              <div style={{ fontSize: 12, color: '#8E8E93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.exerciseNames.slice(0, 3).join(', ') || 'No exercises'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tap overlay */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', zIndex: 200,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', width: '100%', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1C1C1E', marginBottom: 6 }}>
              {selected.program.name}
            </div>
            <div style={{ fontSize: 14, color: '#8E8E93', marginBottom: 24 }}>
              {selected.exerciseNames.join(', ') || 'No exercises'}
            </div>
            <button
              onClick={() => startWorkout(selected)}
              style={{
                width: '100%', background: '#007AFF', color: '#fff', border: 'none',
                borderRadius: 12, padding: '15px', fontSize: 17, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Start Workout
            </button>
            <button
              onClick={() => setSelected(null)}
              style={{
                width: '100%', background: 'none', border: 'none', color: '#8E8E93',
                fontSize: 15, marginTop: 12, cursor: 'pointer', padding: '8px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

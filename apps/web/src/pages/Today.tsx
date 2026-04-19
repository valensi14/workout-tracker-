import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useWorkoutStore } from '../store/workout';
import type { Program, Routine, WorkoutSession } from '@workout/core';

export default function Today() {
  const db = useDB();
  const navigate = useNavigate();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [routinesByProgram, setRoutinesByProgram] = useState<Record<string, Routine[]>>({});

  useEffect(() => {
    (async () => {
      // Restore draft session if exists
      if (!activeSession) {
        const draft = await db.getDraftSession();
        if (draft) {
          const sets = await db.getSetsBySession(draft.id);
          restoreSession(draft, sets);
        }
      }
      // Load all templates
      const progs = await db.getPrograms();
      setPrograms(progs);
      // Load routines for each program
      const map: Record<string, Routine[]> = {};
      await Promise.all(progs.map(async p => {
        map[p.id] = await db.getRoutinesByProgram(p.id);
      }));
      setRoutinesByProgram(map);
    })();
  }, []);

  async function startWorkout(routine: Routine | null, programId?: string) {
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      routineId: routine?.id ?? null,
      startedAt: Date.now(),
      finishedAt: null,
      notes: null,
    };
    try {
      await db.createSession(session);
      // Set this program as active if starting from a template
      if (programId) {
        await db.setSetting('active_program_id', programId);
        await db.setSetting('active_routine_index', '0');
      }
      startSession(session);
      navigate(`/workout/${session.id}`);
    } catch {
      alert("Couldn't start workout — try again");
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1>Start Workout</h1>

      {/* Resume banner */}
      {activeSession && (
        <div style={{ background: '#f0fff4', border: '1px solid #34C759', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#1a7a3a' }}>You have an active workout</span>
          <button
            onClick={() => navigate(`/workout/${activeSession.id}`)}
            style={{ background: '#34C759', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            Resume Workout
          </button>
        </div>
      )}

      {/* Empty workout */}
      <button
        onClick={() => startWorkout(null)}
        style={{ width: '100%', background: '#fff', border: '2px dashed #007AFF', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', color: '#007AFF', fontWeight: 600, fontSize: 15, marginBottom: 28, textAlign: 'left' }}
      >
        + Start Empty Workout
      </button>

      {/* Templates */}
      {programs.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Templates</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/programs/new')} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ New Template</button>
              <button onClick={() => navigate('/programs')} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#555' }}>Manage</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {programs.map(p => {
              const routines = routinesByProgram[p.id] ?? [];
              const firstRoutine = routines[0] ?? null;
              return (
                <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{p.name}</div>
                      {p.description && <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{p.description}</div>}
                      <div style={{ color: '#aaa', fontSize: 12 }}>
                        {routines.length} day{routines.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => startWorkout(firstRoutine, p.id)}
                      style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', marginLeft: 16 }}
                    >
                      Start ▶
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {programs.length === 0 && (
        <p style={{ color: '#aaa', fontSize: 14 }}>
          No templates yet. <span style={{ color: '#007AFF', cursor: 'pointer' }} onClick={() => navigate('/programs/new')}>Create one →</span>
        </p>
      )}
    </div>
  );
}

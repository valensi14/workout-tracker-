import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useWorkoutStore } from '../store/workout';
import type { Program, WorkoutSession } from '@workout/core';

interface TemplateCard {
  program: Program;
  routineCount: number;
  firstRoutineId: string | null;
  exerciseNames: string[];
}

export default function Today() {
  const db = useDB();
  const navigate = useNavigate();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [templates, setTemplates] = useState<TemplateCard[]>([]);

  useEffect(() => {
    (async () => {
      if (!activeSession) {
        const draft = await db.getDraftSession();
        if (draft) {
          const sets = await db.getSetsBySession(draft.id);
          restoreSession(draft, sets);
        }
      }

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
          exerciseNames = res
            .map(re => exerciseMap.get(re.exerciseId) ?? '')
            .filter(Boolean);
        }
        return {
          program: p,
          routineCount: routines.length,
          firstRoutineId: first?.id ?? null,
          exerciseNames,
        };
      }));

      setTemplates(cards);
    })();
  }, []);

  async function startWorkout(programId?: string, routineId?: string | null) {
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      routineId: routineId ?? null,
      startedAt: Date.now(),
      finishedAt: null,
      notes: null,
    };
    try {
      await db.createSession(session);
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
    <div style={{ background: '#F2F2F7', minHeight: '100vh' }}>

      {/* Large title header */}
      <div style={{
        background: '#F2F2F7',
        padding: '16px 16px 0',
      }}>
        <h1 style={{
          fontSize: 34,
          fontWeight: 700,
          color: '#000',
          letterSpacing: 0.37,
          marginBottom: 16,
        }}>
          Workout
        </h1>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #34C759',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1C1C1E', fontSize: 15 }}>Workout in progress</div>
              <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>Tap to resume</div>
            </div>
            <button
              onClick={() => navigate(`/workout/${activeSession.id}`)}
              style={{
                background: '#34C759', color: '#fff', border: 'none',
                borderRadius: 10, padding: '9px 18px', cursor: 'pointer',
                fontWeight: 600, fontSize: 15,
              }}
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* My Routines section */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#8E8E93',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: 0,
          }}>
            My Templates
          </p>
          <button
            onClick={() => navigate('/programs/new')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007AFF',
              fontSize: 15,
              fontWeight: 400,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            + New Routine
          </button>
        </div>

        {templates.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '32px 16px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#8E8E93', fontSize: 15, marginBottom: 12 }}>
              No routines yet
            </div>
            <button
              onClick={() => navigate('/programs/new')}
              style={{
                background: '#007AFF', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 24px', cursor: 'pointer',
                fontWeight: 600, fontSize: 15,
              }}
            >
              Create Routine
            </button>
          </div>
        ) : (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {templates.map(({ program, routineCount, firstRoutineId, exerciseNames }, index) => (
              <div key={program.id}>
                {index > 0 && (
                  <div style={{ height: 0.5, background: '#E5E5EA', marginLeft: 16 }} />
                )}
                <div style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 17,
                      fontWeight: 400,
                      color: '#1C1C1E',
                      marginBottom: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {program.name}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: '#8E8E93',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {exerciseNames.length > 0
                        ? <>
                            {exerciseNames.slice(0, 4).join(', ')}
                            {exerciseNames.length > 4 && ` +${exerciseNames.length - 4} more`}
                          </>
                        : `${routineCount} day${routineCount !== 1 ? 's' : ''}`
                      }
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${program.name}"?`)) {
                        await db.deleteProgram(program.id);
                        setTemplates(prev => prev.filter(t => t.program.id !== program.id));
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FF3B30',
                      fontSize: 22,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                    title="Delete routine"
                  >
                    ×
                  </button>

                  {/* Start button */}
                  <button
                    onClick={() => startWorkout(program.id, firstRoutineId)}
                    style={{
                      background: '#007AFF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

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

function timeAgo(ts: number): string {
  if (ts === 0) return 'Example template';
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Created today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
}

export default function Today() {
  const db = useDB();
  const navigate = useNavigate();
  const { activeSession, restoreSession, startSession } = useWorkoutStore();
  const [templates, setTemplates] = useState<TemplateCard[]>([]);

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

      // Load programs + exercises in parallel
      const [progs, allExercises] = await Promise.all([
        db.getPrograms(),
        db.getExercises(),
      ]);

      const exerciseMap = new Map(allExercises.map(e => [e.id, e.name]));

      // Build template cards
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
    <div style={{ maxWidth: 680 }}>

      {/* ── Active session banner ── */}
      {activeSession && (
        <div style={{
          background: '#f0fff4', border: '1px solid #34C759', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600, color: '#1a7a3a', fontSize: 14 }}>
            🟢 Active workout in progress
          </span>
          <button
            onClick={() => navigate(`/workout/${activeSession.id}`)}
            style={{ background: '#34C759', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
          >
            Resume
          </button>
        </div>
      )}

      {/* ── Quick Start ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Quick Start
        </div>
        <button
          onClick={() => startWorkout()}
          style={{
            width: '100%', background: '#007AFF', border: 'none', borderRadius: 12,
            padding: '15px 20px', cursor: 'pointer', color: '#fff',
            fontWeight: 700, fontSize: 16, textAlign: 'center',
          }}
        >
          Start an Empty Workout
        </button>
      </div>

      {/* ── Templates ── */}
      <div>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Templates</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/programs/new')}
              style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              + Template
            </button>
            <button
              onClick={() => navigate('/programs')}
              style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: '#666' }}
            >
              Manage
            </button>
          </div>
        </div>

        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏋️</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#555', marginBottom: 6 }}>No templates yet</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Create a template to quickly start a workout</div>
            <button
              onClick={() => navigate('/programs/new')}
              style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              + Create Template
            </button>
          </div>
        ) : (
          <>
            {/* Subsection label */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#999', marginBottom: 10 }}>
              My Templates ({templates.length})
            </div>

            {/* 2-column card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {templates.map(({ program, routineCount, firstRoutineId, exerciseNames }) => (
                <div
                  key={program.id}
                  style={{
                    border: '1px solid #eee', borderRadius: 14, padding: '14px 14px 12px',
                    background: '#fff', display: 'flex', flexDirection: 'column', gap: 5,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Name */}
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111', lineHeight: 1.3 }}>
                    {program.name}
                  </div>

                  {/* Exercise preview */}
                  {exerciseNames.length > 0 ? (
                    <div style={{ color: '#888', fontSize: 12, lineHeight: 1.5, flex: 1 }}>
                      {exerciseNames.slice(0, 5).join(', ')}
                      {exerciseNames.length > 5 && (
                        <span style={{ color: '#bbb' }}> +{exerciseNames.length - 5} more</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#ccc', fontSize: 12 }}>No exercises</div>
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C759', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ color: '#aaa', fontSize: 11 }}>
                      {routineCount} day{routineCount !== 1 ? 's' : ''} · {timeAgo(program.createdAt)}
                    </span>
                  </div>

                  {/* Start button */}
                  <button
                    onClick={() => startWorkout(program.id, firstRoutineId)}
                    style={{
                      marginTop: 8, background: '#007AFF', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '9px 0', cursor: 'pointer',
                      fontWeight: 700, fontSize: 13, width: '100%',
                    }}
                  >
                    Start ▶
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

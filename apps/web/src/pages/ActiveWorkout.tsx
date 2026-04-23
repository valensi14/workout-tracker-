import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useToast } from '../hooks/useToast';
import { useWorkoutStore } from '../store/workout';
import type { Exercise } from '@workout/core';
import { getNextRoutineIndex } from '@workout/core';

interface SetEntry { id: string; exerciseId: string; weight: string; reps: string; done: boolean; }

interface TimerEntry {
  id: string;
  exerciseId: string;
  duration: number;   // selected duration in seconds
  remaining: number;  // current countdown
  running: boolean;
}

const PRESETS = [30, 60, 90, 120, 180];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    [0, 0.18, 0.36].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  } catch { /* ignore */ }
}

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const navigate = useNavigate();
  const { error } = useToast();
  const { activeSession, sets, addSet, finishSession } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [localSets, setLocalSets] = useState<SetEntry[]>([]);
  const [timers, setTimers] = useState<TimerEntry[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Global tick — counts down all running timers every second
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setTimers(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (!t.running) return t;
          changed = true;
          const remaining = t.remaining - 1;
          if (remaining <= 0) { playBeep(); return { ...t, remaining: 0, running: false }; }
          return { ...t, remaining };
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    if (!activeSession || !activeSession.routineId) return;
    (async () => {
      const res = await db.getRoutineExercises(activeSession.routineId);
      const exList = (await Promise.all(res.map(re => db.getExerciseById(re.exerciseId)))).filter(Boolean) as Exercise[];
      setExercises(exList);
      setLocalSets(exList.map(ex => ({ id: crypto.randomUUID(), exerciseId: ex.id, weight: '', reps: '', done: false })));
    })();
  }, [activeSession, db]);

  // ── Set helpers ──────────────────────────────────────────
  function addRow(exerciseId: string) {
    setLocalSets(p => [...p, { id: crypto.randomUUID(), exerciseId, weight: '', reps: '', done: false }]);
  }

  async function completeSet(entry: SetEntry) {
    const weight = parseFloat(entry.weight);
    const reps = parseInt(entry.reps, 10);
    if (isNaN(weight) || isNaN(reps)) return;
    if (!id) return;
    const s = {
      id: entry.id, sessionId: id, exerciseId: entry.exerciseId,
      setNumber: sets.filter(s => s.exerciseId === entry.exerciseId).length + 1,
      weight, reps, rpe: null, completedAt: Date.now(),
    };
    try {
      await db.addSet(s);
      addSet(s);
      setLocalSets(p => p.map(r => r.id === entry.id ? { ...r, done: true } : r));
    } catch {
      error("Couldn't save set — try again");
    }
  }

  // ── Timer helpers ────────────────────────────────────────
  function addTimer(exerciseId: string) {
    const newTimer: TimerEntry = {
      id: crypto.randomUUID(),
      exerciseId,
      duration: 90,
      remaining: 90,
      running: false,
    };
    setTimers(p => [...p, newTimer]);
  }

  function removeTimer(timerId: string) {
    setTimers(p => p.filter(t => t.id !== timerId));
  }

  function setTimerDuration(timerId: string, duration: number) {
    setTimers(p => p.map(t => t.id === timerId ? { ...t, duration, remaining: duration, running: false } : t));
  }

  function toggleTimer(timerId: string) {
    setTimers(p => p.map(t => {
      if (t.id !== timerId) return t;
      if (t.remaining === 0) return { ...t, remaining: t.duration, running: true }; // restart
      return { ...t, running: !t.running };
    }));
  }

  function adjustTimer(timerId: string, delta: number) {
    setTimers(p => p.map(t => t.id === timerId ? { ...t, remaining: Math.max(1, t.remaining + delta) } : t));
  }

  // ── Finish workout ───────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────
  // Build a mixed list of sets + timers per exercise, in insertion order
  function getRows(exerciseId: string) {
    const s = localSets.filter(r => r.exerciseId === exerciseId).map(r => ({ kind: 'set' as const, item: r }));
    const t = timers.filter(r => r.exerciseId === exerciseId).map(r => ({ kind: 'timer' as const, item: r }));
    return [...s, ...t];
  }

  return (
    <div>
      {exercises.map(ex => {
        const rows = getRows(ex.id);
        const exSetCount = localSets.filter(s => s.exerciseId === ex.id).length;

        return (
          <div key={ex.id} style={{ marginBottom: 28, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>{ex.name}</h3>

            {rows.map((row, i) => {
              // ── Set row ──
              if (row.kind === 'set') {
                const entry = row.item as SetEntry;
                const setNum = localSets.filter(s => s.exerciseId === ex.id).indexOf(entry) + 1;
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ width: 20, color: '#aaa', fontSize: 12, textAlign: 'right' }}>{setNum}</span>
                    <input
                      placeholder="kg" value={entry.weight}
                      onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, weight: e.target.value } : s))}
                      style={{ width: 66, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 8, textAlign: 'center', opacity: entry.done ? 0.5 : 1 }}
                      disabled={entry.done}
                    />
                    <input
                      placeholder="reps" value={entry.reps}
                      onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, reps: e.target.value } : s))}
                      style={{ width: 66, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 8, textAlign: 'center', opacity: entry.done ? 0.5 : 1 }}
                      disabled={entry.done}
                    />
                    {entry.done
                      ? <span style={{ color: '#34C759', fontWeight: 700, fontSize: 18 }}>✓</span>
                      : <button onClick={() => completeSet(entry)} style={{ background: '#34C759', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>✓</button>
                    }
                  </div>
                );
              }

              // ── Timer row ──
              const t = row.item as TimerEntry;
              const isLow = t.remaining <= 10 && t.remaining > 0;
              const isDone = t.remaining === 0 && !t.running;
              const progress = (t.remaining / t.duration) * 100;

              return (
                <div key={t.id} style={{
                  background: '#1c1c1e', borderRadius: 14, padding: '14px 16px',
                  marginBottom: 8, color: '#fff',
                }}>
                  {/* Preset selector */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#888', marginRight: 2 }}>⏱</span>
                    {PRESETS.map(p => (
                      <button
                        key={p}
                        onClick={() => setTimerDuration(t.id, p)}
                        style={{
                          background: t.duration === p ? '#FF9500' : '#2c2c2e',
                          color: '#fff', border: 'none', borderRadius: 7,
                          padding: '3px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        }}
                      >
                        {p >= 60 ? `${p / 60}m` : `${p}s`}
                      </button>
                    ))}
                    {/* Remove timer */}
                    <button
                      onClick={() => removeTimer(t.id)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: '#333', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: isDone ? '#34C759' : isLow ? '#FF3B30' : '#FF9500',
                      width: isDone ? '100%' : `${progress}%`,
                      transition: 'width 1s linear',
                    }} />
                  </div>

                  {/* Countdown + controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => adjustTimer(t.id, -15)}
                      style={{ background: '#2c2c2e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      −15s
                    </button>

                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{
                        fontSize: 36, fontWeight: 800, letterSpacing: -1,
                        fontVariantNumeric: 'tabular-nums',
                        color: isDone ? '#34C759' : isLow ? '#FF3B30' : '#fff',
                      }}>
                        {isDone ? '✓ Done' : formatTime(t.remaining)}
                      </span>
                    </div>

                    <button
                      onClick={() => adjustTimer(t.id, 15)}
                      style={{ background: '#2c2c2e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      +15s
                    </button>
                  </div>

                  {/* Start / Pause / Restart */}
                  <button
                    onClick={() => toggleTimer(t.id)}
                    style={{
                      width: '100%', marginTop: 10,
                      background: t.running ? '#3a3a3c' : '#007AFF',
                      color: '#fff', border: 'none', borderRadius: 10,
                      padding: '9px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    }}
                  >
                    {isDone ? '↺ Restart' : t.running ? '⏸ Pause' : '▶ Start'}
                  </button>
                </div>
              );
            })}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <button
                onClick={() => addRow(ex.id)}
                style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                + Add Set
              </button>
              <button
                onClick={() => addTimer(ex.id)}
                style={{ background: 'none', border: 'none', color: '#FF9500', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                + Add Timer
              </button>
            </div>
          </div>
        );
      })}

      {exercises.length === 0 && (
        <p style={{ color: '#999' }}>No exercises in this routine.</p>
      )}

      <button
        onClick={handleFinish}
        style={{ background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, cursor: 'pointer', fontWeight: 700, marginTop: 8, width: '100%' }}
      >
        Finish Workout
      </button>
    </div>
  );
}

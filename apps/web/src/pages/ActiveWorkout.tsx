import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import { useToast } from '../hooks/useToast';
import { useWorkoutStore } from '../store/workout';
import type { Exercise } from '@workout/core';
import { getNextRoutineIndex } from '@workout/core';

interface SetEntry { id: string; exerciseId: string; weight: string; reps: string; done: boolean; }

const REST_PRESETS = [30, 60, 90, 120, 180];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
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
  } catch { /* ignore if AudioContext unavailable */ }
}

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const navigate = useNavigate();
  const { error } = useToast();
  const { activeSession, sets, addSet, finishSession } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [localSets, setLocalSets] = useState<SetEntry[]>([]);

  // ── Rest timer state ──────────────────────────────────────
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restDuration, setRestDuration] = useState(90);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startRest(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestDuration(seconds);
    setRestSeconds(seconds);
    intervalRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          if (prev === 1) playBeep();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRestSeconds(null);
  }

  function adjustRest(delta: number) {
    setRestSeconds(prev => {
      if (prev === null) return null;
      return Math.max(1, prev + delta);
    });
  }

  // Clean up on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeSession || !activeSession.routineId) return;
    (async () => {
      const res = await db.getRoutineExercises(activeSession.routineId);
      const exList = (await Promise.all(res.map(re => db.getExerciseById(re.exerciseId)))).filter(Boolean) as Exercise[];
      setExercises(exList);
      setLocalSets(exList.map(ex => ({ id: crypto.randomUUID(), exerciseId: ex.id, weight: '', reps: '', done: false })));
    })();
  }, [activeSession, db]);

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
      startRest(restDuration); // auto-start rest timer after each set
    } catch {
      error("Couldn't save set — try again");
    }
  }

  async function handleFinish() {
    if (!id) return;
    skipRest();
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

  const progress = restSeconds !== null ? (restSeconds / restDuration) * 100 : 0;
  const isLow = restSeconds !== null && restSeconds <= 10;

  return (
    <div>

      {/* ── Rest Timer Panel ─────────────────────────────────── */}
      {restSeconds !== null ? (
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#1c1c1e', color: '#fff',
          borderRadius: 20, padding: '20px 20px 16px',
          marginBottom: 24, textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Rest Timer
          </div>

          {/* Big countdown */}
          <div style={{
            fontSize: 72, fontWeight: 800, letterSpacing: -2,
            fontVariantNumeric: 'tabular-nums',
            color: isLow ? '#FF3B30' : '#fff',
            lineHeight: 1, marginBottom: 10,
            transition: 'color 0.3s',
          }}>
            {formatTime(restSeconds)}
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: '#333', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: isLow ? '#FF3B30' : '#FF9500',
              width: `${progress}%`,
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>

          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
            {REST_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => startRest(p)}
                style={{
                  background: restDuration === p ? '#FF9500' : '#2c2c2e',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  transition: 'background 0.2s',
                }}
              >
                {p >= 60 ? `${p / 60}m` : `${p}s`}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => adjustRest(-15)}
              style={{ background: '#2c2c2e', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              −15s
            </button>
            <button
              onClick={skipRest}
              style={{ background: '#3a3a3c', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Skip ✕
            </button>
            <button
              onClick={() => adjustRest(15)}
              style={{ background: '#2c2c2e', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              +15s
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed timer — manual start */
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#999' }}>Rest timer:</span>
          {REST_PRESETS.map(p => (
            <button
              key={p}
              onClick={() => startRest(p)}
              style={{
                background: restDuration === p ? '#FF9500' : '#f2f2f7',
                color: restDuration === p ? '#fff' : '#333',
                border: 'none', borderRadius: 8,
                padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              {p >= 60 ? `${p / 60}m` : `${p}s`}
            </button>
          ))}
        </div>
      )}

      {/* ── Exercises ──────────────────────────────────────────── */}
      {exercises.map(ex => {
        const exSets = localSets.filter(s => s.exerciseId === ex.id);
        return (
          <div key={ex.id} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <h3 style={{ marginBottom: 10, fontSize: 16 }}>{ex.name}</h3>
            {exSets.map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ width: 24, color: '#aaa', fontSize: 13, textAlign: 'right' }}>{i + 1}</span>
                <input
                  placeholder="kg" value={entry.weight}
                  onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, weight: e.target.value } : s))}
                  style={{ width: 70, padding: 6, border: '1px solid #ddd', borderRadius: 8, opacity: entry.done ? 0.5 : 1, textAlign: 'center' }}
                  disabled={entry.done}
                />
                <input
                  placeholder="reps" value={entry.reps}
                  onChange={e => setLocalSets(p => p.map(s => s.id === entry.id ? { ...s, reps: e.target.value } : s))}
                  style={{ width: 70, padding: 6, border: '1px solid #ddd', borderRadius: 8, opacity: entry.done ? 0.5 : 1, textAlign: 'center' }}
                  disabled={entry.done}
                />
                {entry.done
                  ? <span style={{ color: '#34C759', fontWeight: 700, fontSize: 18 }}>✓</span>
                  : <button onClick={() => completeSet(entry)} style={{ background: '#34C759', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>Log</button>
                }
              </div>
            ))}
            <button onClick={() => addRow(ex.id)} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 4 }}>+ Add Set</button>
          </div>
        );
      })}

      {exercises.length === 0 && (
        <p style={{ color: '#999' }}>No exercises. Log sets below.</p>
      )}

      <button
        onClick={handleFinish}
        style={{ background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, cursor: 'pointer', fontWeight: 700, marginTop: 8, width: '100%' }}
      >
        Finish Workout
      </button>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import { useDB } from '../App';
import type { Exercise, WorkoutSet } from '@workout/core';
import { epley1RM } from '@workout/core';
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory';

export default function Progress() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<WorkoutSet[]>([]);
  useEffect(() => { db.getExercises().then(setExercises); }, []);

  async function select(ex: Exercise) { setSelected(ex); setHistory(await db.getSetsByExercise(ex.id)); }

  const sessionBests = useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    for (const s of history) (groups[s.sessionId] ??= []).push(s);
    return Object.entries(groups).map(([, sets]) => {
      const best = sets.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b);
      return { x: new Date(best.completedAt), y: epley1RM(best.weight, best.reps), weight: best.weight, reps: best.reps };
    }).sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [history]);

  const pr = history.length ? history.reduce((b, s) => epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b) : null;

  if (!selected) return (
    <div>
      <h1>Progress</h1>
      <p style={{ color: '#888' }}>Select an exercise to view progress</p>
      <div style={{ maxWidth: 400 }}>
        {exercises.map(e => <div key={e.id} onClick={() => select(e)} style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}>{e.name}</div>)}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', marginBottom: 8 }}>← Back</button>
      <h1>{selected.name}</h1>
      {pr && (
        <div style={{ background: '#f0f7ff', borderRadius: 12, padding: 20, marginBottom: 24, display: 'inline-block' }}>
          <div style={{ color: '#007AFF', fontWeight: 600, marginBottom: 4 }}>All-Time PR</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{pr.weight}kg × {pr.reps} reps</div>
          <div style={{ color: '#555' }}>Est. 1RM: {epley1RM(pr.weight, pr.reps)}kg</div>
        </div>
      )}
      {sessionBests.length > 1 && (
        <div>
          <h3>Estimated 1RM Over Time</h3>
          <VictoryChart width={600} height={250}>
            <VictoryAxis />
            <VictoryAxis dependentAxis />
            <VictoryLine data={sessionBests} style={{ data: { stroke: '#007AFF', strokeWidth: 2 } }} />
          </VictoryChart>
        </div>
      )}
      {history.length === 0 && <p style={{ color: '#aaa' }}>No logged sets yet.</p>}
    </div>
  );
}

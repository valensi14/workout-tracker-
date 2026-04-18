import React, { useEffect, useState } from 'react';
import { useDB } from '../App';
import type { WorkoutSession } from '@workout/core';

export default function History() {
  const db = useDB();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  useEffect(() => { db.getSessions(50).then(s => setSessions(s.filter(s => s.finishedAt !== null))); }, []);

  return (
    <div>
      <h1>History</h1>
      {sessions.length === 0 && <p style={{ color: '#aaa' }}>No workouts yet.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th>Date</th><th>Duration</th><th>Notes</th></tr></thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '12px 0' }}>{new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
              <td style={{ padding: '12px 0', color: '#888' }}>{s.finishedAt ? `${Math.round((s.finishedAt - s.startedAt) / 60000)} min` : '—'}</td>
              <td style={{ padding: '12px 0', color: '#888' }}>{s.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

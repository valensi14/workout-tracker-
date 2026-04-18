import React, { useEffect, useState } from 'react';
import { useDB } from '../App';
import type { Exercise } from '@workout/core';

export default function Exercises() {
  const db = useDB();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  useEffect(() => { db.getExercises().then(setExercises); }, []);

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.muscleGroup.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <h1>Exercises</h1>
      <input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 15, marginBottom: 16, width: 300 }} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th>Name</th><th>Category</th><th>Muscle</th><th>Equipment</th></tr></thead>
        <tbody>
          {filtered.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '10px 0' }}>{e.name}</td>
              <td style={{ padding: '10px 0', color: '#888', textTransform: 'capitalize' }}>{e.category}</td>
              <td style={{ padding: '10px 0', color: '#888', textTransform: 'capitalize' }}>{e.muscleGroup}</td>
              <td style={{ padding: '10px 0', color: '#888' }}>{e.equipment ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../App';
import type { Program } from '@workout/core';

export default function Programs() {
  const db = useDB();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    db.getPrograms().then(setPrograms);
    db.getSetting('active_program_id').then(setActiveId);
  }, []);

  async function activate(p: Program) {
    await db.setSetting('active_program_id', p.id);
    await db.setSetting('active_routine_index', '0');
    setActiveId(p.id);
  }

  async function deleteProgram(p: Program) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await db.deleteProgram(p.id);
    setPrograms(prev => prev.filter(x => x.id !== p.id));
    if (activeId === p.id) setActiveId(null);
  }

  return (
    <div>
      <h1>Templates</h1>
      <button onClick={() => navigate('/programs/new')} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', marginBottom: 20 }}>+ New Template</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {programs.map(p => (
          <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeId === p.id && <span style={{ background: '#34C759', color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 12 }}>Active</span>}
                <button onClick={() => deleteProgram(p)} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            </div>
            <p style={{ color: '#666', fontSize: 14 }}>{p.description}</p>
            {activeId !== p.id && <button onClick={() => activate(p)} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Start Template</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

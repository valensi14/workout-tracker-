import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Today() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>
          My Templates
        </h2>
        <button
          onClick={() => navigate('/programs/new')}
          style={{
            background: '#007AFF',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Template
        </button>
      </div>
    </div>
  );
}

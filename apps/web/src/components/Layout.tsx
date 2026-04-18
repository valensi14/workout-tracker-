import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/programs', label: 'Templates' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/progress', label: 'Progress' },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ width: 200, borderRight: '1px solid #eee', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700 }}>Workout</h2>
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
              color: isActive ? '#007AFF' : '#333',
              backgroundColor: isActive ? '#f0f7ff' : 'transparent',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

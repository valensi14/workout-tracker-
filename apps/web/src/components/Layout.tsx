import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

const nav = [
  { to: '/', label: 'Start',     mobileLabel: 'Start',     icon: '▶️' },
  { to: '/history',   label: 'History',   mobileLabel: 'History',   icon: '🕐' },
  { to: '/exercises', label: 'Exercises', mobileLabel: 'Exercises', icon: '💪' },
  { to: '/progress',  label: 'Progress',  mobileLabel: 'Progress',  icon: '📈' },
];

const sidebarLabels: Record<string, string> = {
  '/':           'Start Workout',
  '/history':    'History',
  '/exercises':  'Exercises',
  '/progress':   'Progress',
};

export default function Layout() {
  return (
    <div className="layout">
      {/* ── Sidebar (desktop only) ── */}
      <nav className="sidebar">
        <h2 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700 }}>Workout</h2>
        {nav.map(({ to }) => (
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
            {sidebarLabels[to]}
          </NavLink>
        ))}
      </nav>

      {/* ── Page content ── */}
      <main className="main">
        <Outlet />
      </main>

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav className="bottom-nav">
        {nav.map(({ to, mobileLabel, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{mobileLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

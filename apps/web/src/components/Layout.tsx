import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

const nav = [
  { to: '/',          label: 'Start Workout', mobileLabel: 'Workout',   icon: '🏋️' },
  { to: '/history',   label: 'History',        mobileLabel: 'History',   icon: '📋' },
  { to: '/exercises', label: 'Exercises',      mobileLabel: 'Exercises', icon: '💪' },
  { to: '/progress',  label: 'Progress',       mobileLabel: 'Progress',  icon: '📈' },
];

export default function Layout() {
  return (
    <div className="layout">
      <nav className="sidebar">
        <div style={{
          fontSize: 22, fontWeight: 700, color: '#007AFF',
          marginBottom: 24, padding: '0 4px',
        }}>
          Strong
        </div>
        {nav.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: 10,
              textDecoration: 'none',
              color: isActive ? '#007AFF' : '#1C1C1E',
              backgroundColor: isActive ? '#EAF3FF' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 15,
              display: 'block',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="main">
        <Outlet />
      </main>

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

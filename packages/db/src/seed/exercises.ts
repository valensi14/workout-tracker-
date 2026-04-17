// packages/db/src/seed/exercises.ts
import type { Exercise } from '@workout/core';

export const BUILT_IN_EXERCISES: Exercise[] = [
  // Push
  { id: 'ex-bench-press', name: 'Bench Press', category: 'push', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'ex-incline-bench', name: 'Incline Bench Press', category: 'push', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'ex-ohp', name: 'Overhead Press', category: 'push', muscleGroup: 'shoulders', equipment: 'barbell' },
  { id: 'ex-db-ohp', name: 'Dumbbell Shoulder Press', category: 'push', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { id: 'ex-tricep-pushdown', name: 'Tricep Pushdown', category: 'push', muscleGroup: 'triceps', equipment: 'cable' },
  { id: 'ex-skull-crusher', name: 'Skull Crusher', category: 'push', muscleGroup: 'triceps', equipment: 'barbell' },
  { id: 'ex-lateral-raise', name: 'Lateral Raise', category: 'push', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  // Pull
  { id: 'ex-deadlift', name: 'Deadlift', category: 'pull', muscleGroup: 'back', equipment: 'barbell' },
  { id: 'ex-barbell-row', name: 'Barbell Row', category: 'pull', muscleGroup: 'back', equipment: 'barbell' },
  { id: 'ex-pullup', name: 'Pull-Up', category: 'pull', muscleGroup: 'back', equipment: 'bodyweight' },
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', category: 'pull', muscleGroup: 'back', equipment: 'cable' },
  { id: 'ex-cable-row', name: 'Seated Cable Row', category: 'pull', muscleGroup: 'back', equipment: 'cable' },
  { id: 'ex-barbell-curl', name: 'Barbell Curl', category: 'pull', muscleGroup: 'biceps', equipment: 'barbell' },
  { id: 'ex-db-curl', name: 'Dumbbell Curl', category: 'pull', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { id: 'ex-hammer-curl', name: 'Hammer Curl', category: 'pull', muscleGroup: 'biceps', equipment: 'dumbbell' },
  // Legs
  { id: 'ex-squat', name: 'Squat', category: 'legs', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-front-squat', name: 'Front Squat', category: 'legs', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-leg-press', name: 'Leg Press', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-rdl', name: 'Romanian Deadlift', category: 'legs', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-leg-curl', name: 'Leg Curl', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-leg-extension', name: 'Leg Extension', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-calf-raise', name: 'Calf Raise', category: 'legs', muscleGroup: 'legs', equipment: 'machine' },
  { id: 'ex-lunge', name: 'Lunge', category: 'legs', muscleGroup: 'legs', equipment: 'dumbbell' },
  // Core
  { id: 'ex-plank', name: 'Plank', category: 'core', muscleGroup: 'core', equipment: null },
  { id: 'ex-ab-wheel', name: 'Ab Wheel Rollout', category: 'core', muscleGroup: 'core', equipment: 'ab wheel' },
  { id: 'ex-cable-crunch', name: 'Cable Crunch', category: 'core', muscleGroup: 'core', equipment: 'cable' },
];

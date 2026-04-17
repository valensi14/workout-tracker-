// packages/db/src/seed/programs.ts
import type { Program, Routine, RoutineExercise } from '@workout/core';

// Built-in programs use createdAt: 0 so they sort before user-created programs
export const BUILT_IN_PROGRAMS: Program[] = [
  { id: 'prog-ppl', name: 'Push Pull Legs (PPL)', description: '6-day push/pull/legs split', createdAt: 0 },
  { id: 'prog-531', name: '5/3/1', description: "Jim Wendler's 4-day strength program", createdAt: 0 },
  { id: 'prog-gzclp', name: 'GZCLP', description: 'Greyskull Linear Progression — 3-day full-body', createdAt: 0 },
];

export const BUILT_IN_ROUTINES: Routine[] = [
  // PPL
  { id: 'r-ppl-push', programId: 'prog-ppl', name: 'Push', order: 0 },
  { id: 'r-ppl-pull', programId: 'prog-ppl', name: 'Pull', order: 1 },
  { id: 'r-ppl-legs', programId: 'prog-ppl', name: 'Legs', order: 2 },
  // 5/3/1
  { id: 'r-531-squat', programId: 'prog-531', name: 'Squat Day', order: 0 },
  { id: 'r-531-bench', programId: 'prog-531', name: 'Bench Day', order: 1 },
  { id: 'r-531-deadlift', programId: 'prog-531', name: 'Deadlift Day', order: 2 },
  { id: 'r-531-ohp', programId: 'prog-531', name: 'OHP Day', order: 3 },
  // GZCLP
  { id: 'r-gzclp-a', programId: 'prog-gzclp', name: 'Workout A', order: 0 },
  { id: 'r-gzclp-b', programId: 'prog-gzclp', name: 'Workout B', order: 1 },
];

export const BUILT_IN_ROUTINE_EXERCISES: RoutineExercise[] = [
  // PPL Push
  { id: 're-ppl-push-1', routineId: 'r-ppl-push', exerciseId: 'ex-bench-press', sets: 4, reps: '6-10', order: 0 },
  { id: 're-ppl-push-2', routineId: 'r-ppl-push', exerciseId: 'ex-ohp', sets: 3, reps: '8-12', order: 1 },
  { id: 're-ppl-push-3', routineId: 'r-ppl-push', exerciseId: 'ex-lateral-raise', sets: 3, reps: '12-15', order: 2 },
  { id: 're-ppl-push-4', routineId: 'r-ppl-push', exerciseId: 'ex-tricep-pushdown', sets: 3, reps: '10-15', order: 3 },
  // PPL Pull
  { id: 're-ppl-pull-1', routineId: 'r-ppl-pull', exerciseId: 'ex-deadlift', sets: 3, reps: '5', order: 0 },
  { id: 're-ppl-pull-2', routineId: 'r-ppl-pull', exerciseId: 'ex-barbell-row', sets: 4, reps: '6-10', order: 1 },
  { id: 're-ppl-pull-3', routineId: 'r-ppl-pull', exerciseId: 'ex-lat-pulldown', sets: 3, reps: '10-12', order: 2 },
  { id: 're-ppl-pull-4', routineId: 'r-ppl-pull', exerciseId: 'ex-barbell-curl', sets: 3, reps: '10-12', order: 3 },
  // PPL Legs
  { id: 're-ppl-legs-1', routineId: 'r-ppl-legs', exerciseId: 'ex-squat', sets: 4, reps: '6-10', order: 0 },
  { id: 're-ppl-legs-2', routineId: 'r-ppl-legs', exerciseId: 'ex-leg-press', sets: 3, reps: '10-15', order: 1 },
  { id: 're-ppl-legs-3', routineId: 'r-ppl-legs', exerciseId: 'ex-rdl', sets: 3, reps: '8-10', order: 2 },
  { id: 're-ppl-legs-4', routineId: 'r-ppl-legs', exerciseId: 'ex-leg-curl', sets: 3, reps: '10-12', order: 3 },
  { id: 're-ppl-legs-5', routineId: 'r-ppl-legs', exerciseId: 'ex-calf-raise', sets: 4, reps: '15-20', order: 4 },
  // 5/3/1 days
  { id: 're-531-sq-1', routineId: 'r-531-squat', exerciseId: 'ex-squat', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-sq-2', routineId: 'r-531-squat', exerciseId: 'ex-leg-press', sets: 5, reps: '10', order: 1 },
  { id: 're-531-b-1', routineId: 'r-531-bench', exerciseId: 'ex-bench-press', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-b-2', routineId: 'r-531-bench', exerciseId: 'ex-db-ohp', sets: 5, reps: '10', order: 1 },
  { id: 're-531-dl-1', routineId: 'r-531-deadlift', exerciseId: 'ex-deadlift', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-dl-2', routineId: 'r-531-deadlift', exerciseId: 'ex-barbell-row', sets: 5, reps: '10', order: 1 },
  { id: 're-531-ohp-1', routineId: 'r-531-ohp', exerciseId: 'ex-ohp', sets: 3, reps: '5/3/1', order: 0 },
  { id: 're-531-ohp-2', routineId: 'r-531-ohp', exerciseId: 'ex-db-curl', sets: 5, reps: '10', order: 1 },
  // GZCLP Workout A
  { id: 're-gzclp-a-1', routineId: 'r-gzclp-a', exerciseId: 'ex-squat', sets: 3, reps: '5', order: 0 },
  { id: 're-gzclp-a-2', routineId: 'r-gzclp-a', exerciseId: 'ex-bench-press', sets: 3, reps: '5', order: 1 },
  { id: 're-gzclp-a-3', routineId: 'r-gzclp-a', exerciseId: 'ex-deadlift', sets: 1, reps: '5', order: 2 },
  // GZCLP Workout B
  { id: 're-gzclp-b-1', routineId: 'r-gzclp-b', exerciseId: 'ex-squat', sets: 3, reps: '5', order: 0 },
  { id: 're-gzclp-b-2', routineId: 'r-gzclp-b', exerciseId: 'ex-ohp', sets: 3, reps: '5', order: 1 },
  { id: 're-gzclp-b-3', routineId: 'r-gzclp-b', exerciseId: 'ex-deadlift', sets: 1, reps: '5', order: 2 },
];

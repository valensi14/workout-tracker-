// packages/core/src/types.ts

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders'
  | 'biceps' | 'triceps' | 'legs'
  | 'core' | 'cardio' | 'full_body';

export type Category = 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscleGroup: MuscleGroup;
  equipment: string | null;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: number; // unix ms
}

export interface Routine {
  id: string;
  programId: string;
  name: string;
  order: number;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  sets: number;
  reps: string; // e.g. "5" or "8-12"
  order: number;
}

export interface WorkoutSession {
  id: string;
  routineId: string | null;
  startedAt: number;
  finishedAt: number | null; // null = in-progress draft
  notes: string | null;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number; // kg
  reps: number;
  rpe: number | null;
  completedAt: number;
}

export interface UserSetting {
  key: string;
  value: string;
}

export type WeightUnit = 'kg' | 'lbs';

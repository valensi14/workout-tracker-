// apps/mobile/store/workout.ts
import { create } from 'zustand';
import type { WorkoutSession, WorkoutSet } from '@workout/core';

interface WorkoutStore {
  activeSession: WorkoutSession | null;
  sets: WorkoutSet[];
  restTimerStart: number | null;

  startSession: (session: WorkoutSession) => void;
  addSet: (set: WorkoutSet) => void;
  removeSet: (id: string) => void;
  finishSession: () => void;
  restoreSession: (session: WorkoutSession, sets: WorkoutSet[]) => void;
  startRestTimer: () => void;
  clearRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeSession: null,
  sets: [],
  restTimerStart: null,

  startSession: (session) => set({ activeSession: session, sets: [] }),
  addSet: (newSet) => set((state) => ({ sets: [...state.sets, newSet] })),
  removeSet: (id) => set((state) => ({ sets: state.sets.filter((s) => s.id !== id) })),
  finishSession: () => set({ activeSession: null, sets: [], restTimerStart: null }),
  restoreSession: (session, sets) => set({ activeSession: session, sets }),
  startRestTimer: () => set({ restTimerStart: Date.now() }),
  clearRestTimer: () => set({ restTimerStart: null }),
}));

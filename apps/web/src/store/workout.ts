import { create } from 'zustand';
import type { WorkoutSession, WorkoutSet } from '@workout/core';

interface WorkoutStore {
  activeSession: WorkoutSession | null;
  sets: WorkoutSet[];
  startSession: (session: WorkoutSession) => void;
  addSet: (set: WorkoutSet) => void;
  removeSet: (id: string) => void;
  finishSession: () => void;
  restoreSession: (session: WorkoutSession, sets: WorkoutSet[]) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeSession: null,
  sets: [],
  startSession: (session) => set({ activeSession: session, sets: [] }),
  addSet: (newSet) => set((state) => ({ sets: [...state.sets, newSet] })),
  removeSet: (id) => set((state) => ({ sets: state.sets.filter((s) => s.id !== id) })),
  finishSession: () => set({ activeSession: null, sets: [] }),
  restoreSession: (session, sets) => set({ activeSession: session, sets }),
}));

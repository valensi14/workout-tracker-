// packages/db/src/interface.ts
import type {
  Exercise, Program, Routine, RoutineExercise,
  WorkoutSession, WorkoutSet, UserSetting
} from '@workout/core';

export interface DB {
  // exercises
  getExercises(): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | null>;

  // programs + routines
  getPrograms(): Promise<Program[]>;
  getRoutinesByProgram(programId: string): Promise<Routine[]>;
  getRoutineExercises(routineId: string): Promise<RoutineExercise[]>;

  // sessions
  getDraftSession(): Promise<WorkoutSession | null>;
  createSession(session: WorkoutSession): Promise<void>;
  finishSession(id: string, finishedAt: number): Promise<void>;
  getSessions(limit?: number): Promise<WorkoutSession[]>;
  getSessionById(id: string): Promise<WorkoutSession | null>;

  // sets
  addSet(set: WorkoutSet): Promise<void>;
  deleteSet(id: string): Promise<void>;
  getSetsBySession(sessionId: string): Promise<WorkoutSet[]>;
  getSetsByExercise(exerciseId: string): Promise<WorkoutSet[]>;

  // settings
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  // seed
  seedExercises(exercises: Exercise[]): Promise<void>;
  seedPrograms(
    programs: Program[],
    routines: Routine[],
    routineExercises: RoutineExercise[]
  ): Promise<void>;
}

// packages/core/src/program.ts

/**
 * Returns the index of the next routine to run.
 * @param currentIndex - last completed routine index, or null if program just started
 * @param totalRoutines - total number of routines in the program
 */
export function getNextRoutineIndex(
  currentIndex: number | null,
  totalRoutines: number
): number {
  if (currentIndex === null) return 0;
  return (currentIndex + 1) % totalRoutines;
}

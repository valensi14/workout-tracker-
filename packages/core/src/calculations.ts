import type { WeightUnit } from './types';

/** Epley formula: estimated 1-rep max */
export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  const raw = weight * (1 + reps / 30);
  return Math.round(raw * 2) / 2; // round to nearest 0.5
}

/** Convert weight for display */
export function displayWeight(weightKg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? Math.round(weightKg * 2.20462 * 10) / 10 : weightKg;
}

/** Total volume (kg) across a set of logged sets */
export function calculateVolume(
  sets: Array<{ weight: number; reps: number }>
): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

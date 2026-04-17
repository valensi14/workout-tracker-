import { describe, it, expect } from 'vitest';
import { epley1RM, displayWeight, calculateVolume } from '../src/calculations';

describe('epley1RM', () => {
  it('returns weight when reps is 1', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });

  it('returns weight when reps is 0', () => {
    expect(epley1RM(100, 0)).toBe(100);
  });

  it('estimates 1RM from multiple reps', () => {
    // Epley: weight * (1 + reps/30)
    expect(epley1RM(90, 10)).toBeCloseTo(120, 0);
  });

  it('rounds to nearest 0.5', () => {
    const result = epley1RM(85, 5);
    expect(result % 0.5).toBe(0);
  });
});

describe('displayWeight', () => {
  it('returns kg value unchanged', () => {
    expect(displayWeight(100, 'kg')).toBe(100);
  });

  it('converts kg to lbs', () => {
    expect(displayWeight(100, 'lbs')).toBeCloseTo(220.5, 0);
  });
});

describe('calculateVolume', () => {
  it('sums weight * reps across sets', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 100, reps: 5 },
      { weight: 100, reps: 4 },
    ];
    expect(calculateVolume(sets)).toBe(1400);
  });

  it('returns 0 for empty sets', () => {
    expect(calculateVolume([])).toBe(0);
  });
});

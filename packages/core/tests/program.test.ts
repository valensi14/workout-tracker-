import { describe, it, expect } from 'vitest';
import { getNextRoutineIndex } from '../src/program';

describe('getNextRoutineIndex', () => {
  it('returns 0 for first session of a program', () => {
    expect(getNextRoutineIndex(null, 3)).toBe(0);
  });

  it('increments index by 1', () => {
    expect(getNextRoutineIndex(0, 3)).toBe(1);
  });

  it('wraps back to 0 after last routine', () => {
    expect(getNextRoutineIndex(2, 3)).toBe(0);
  });

  it('handles single-routine programs', () => {
    expect(getNextRoutineIndex(0, 1)).toBe(0);
  });

  it('throws for zero totalRoutines', () => {
    expect(() => getNextRoutineIndex(null, 0)).toThrow('totalRoutines must be >= 1');
  });
});

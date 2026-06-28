import { describe, it, expect } from 'vitest';
import { isRealScore, scoreState, scoreTier } from '../score';

describe('isRealScore', () => {
  it('실제 0점은 점수로 인정한다 (null→0 변환 금지의 핵심)', () => {
    expect(isRealScore(0)).toBe(true);
    expect(isRealScore(73)).toBe(true);
  });
  it('null/undefined/NaN/문자열은 점수 아님', () => {
    expect(isRealScore(null)).toBe(false);
    expect(isRealScore(undefined)).toBe(false);
    expect(isRealScore(NaN)).toBe(false);
    expect(isRealScore('5')).toBe(false);
  });
});

describe('scoreState', () => {
  it('상태를 구분한다', () => {
    expect(scoreState(null)).toBe('none');
    expect(scoreState(undefined)).toBe('unknown');
    expect(scoreState(0)).toBe('real');
    expect(scoreState(88)).toBe('real');
    expect(scoreState('not-a-number')).toBe('invalid');
  });
});

describe('scoreTier', () => {
  it('경계값', () => {
    expect(scoreTier(80)).toBe('good');
    expect(scoreTier(70)).toBe('warn');
    expect(scoreTier(50)).toBe('alert');
    expect(scoreTier(49)).toBe('danger');
  });
});

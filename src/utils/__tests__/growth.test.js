import { describe, it, expect } from 'vitest';
import {
  validReportCount,
  growthState,
  changeDirection,
  overallChange,
  competencyRows,
  weaknessTags,
} from '../growth';

describe('growth helpers', () => {
  it('validReportCount counts points', () => {
    expect(validReportCount({ points: [] })).toBe(0);
    expect(validReportCount({ points: [1, 2] })).toBe(2);
    expect(validReportCount(null)).toBe(0);
  });

  it('growthState: 0/1/2+/version mismatch', () => {
    expect(growthState({ points: [] })).toBe('none');
    expect(growthState({ points: [{}], growth_comparison: { available: false, reason: 'DATA_INSUFFICIENT' } })).toBe('insufficient');
    expect(growthState({ points: [{}, {}], growth_comparison: { available: true, prompt_version_warning: null } })).toBe('comparable');
    expect(growthState({ points: [{}, {}], growth_comparison: { available: true, prompt_version_warning: 'PROMPT_VERSION_DIFFERS' } })).toBe('version_mismatch');
  });

  it('changeDirection: real 0 = maintained, null = unknown (no 0 fakery)', () => {
    expect(changeDirection(5)).toBe('improved');
    expect(changeDirection(-3)).toBe('declined');
    expect(changeDirection(0)).toBe('maintained');
    expect(changeDirection(null)).toBe('unknown');
    expect(changeDirection(undefined)).toBe('unknown');
    expect(changeDirection(NaN)).toBe('unknown');
  });

  it('overallChange reads growth_comparison.overall_delta', () => {
    expect(overallChange({ growth_comparison: { overall_delta: 7 } })).toEqual({ delta: 7, direction: 'improved' });
    expect(overallChange({ growth_comparison: { overall_delta: 0 } })).toEqual({ delta: 0, direction: 'maintained' });
    expect(overallChange({})).toEqual({ delta: null, direction: 'unknown' });
  });

  it('competencyRows preserves real 0, keeps null, maps direction', () => {
    const growth = {
      points: [
        { metrics: { expertise: 60, logic: 50, specificity: 0, delivery: null } },
        { metrics: { expertise: 70, logic: 50, specificity: 0, delivery: 80 } },
      ],
      growth_comparison: { metric_delta: { expertise: 10, logic: 0, specificity: 0, delivery: null } },
    };
    const rows = competencyRows(growth);
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey.expertise.direction).toBe('improved');
    expect(byKey.logic.direction).toBe('maintained');
    expect(byKey.specificity.current).toBe(0); // 실제 0점 유지
    expect(byKey.specificity.direction).toBe('maintained');
    expect(byKey.delivery.delta).toBe(null);
    expect(byKey.delivery.direction).toBe('unknown');
  });

  it('weaknessTags extracts tags', () => {
    expect(weaknessTags({ weakness_trend: { items: [{ tag: 'A' }, { tag: 'B' }] } })).toEqual(['A', 'B']);
    expect(weaknessTags({})).toEqual([]);
  });
});

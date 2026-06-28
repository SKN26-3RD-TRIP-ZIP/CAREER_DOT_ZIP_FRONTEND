import { describe, it, expect } from 'vitest';
import { statNum, statMoney, isMissing } from '../adminStats';

describe('adminStats helpers', () => {
  it('statNum keeps real 0, marks null as 미집계', () => {
    expect(statNum(0)).toBe('0');
    expect(statNum(1500)).toBe('1,500');
    expect(statNum(null)).toBe('미집계');
    expect(statNum(undefined)).toBe('미집계');
  });
  it('statMoney keeps real 0, marks null as 미집계', () => {
    expect(statMoney(0)).toBe('$0.0000');
    expect(statMoney(1.2)).toBe('$1.2000');
    expect(statMoney(null)).toBe('미집계');
  });
  it('isMissing', () => {
    expect(isMissing(0)).toBe(false);
    expect(isMissing(null)).toBe(true);
    expect(isMissing(undefined)).toBe(true);
    expect(isMissing('x')).toBe(true);
  });
});

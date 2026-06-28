import { describe, it, expect } from 'vitest';
import {
  categoryLabel,
  actionLabel,
  directionLabel,
  isBlocking,
  isSessionEnd,
  retryAllowed,
  guardrailUserMessage,
  extractGuardrail,
} from '../guardrail';

describe('guardrail helpers', () => {
  it('label mappers fall back', () => {
    expect(categoryLabel('G3')).toBe('민감정보·주입');
    expect(categoryLabel('GX')).toBe('GX');
    expect(actionLabel('BLOCK_INPUT')).toBe('입력 차단');
    expect(directionLabel('USER_TO_AI')).toBe('사용자→AI');
    expect(directionLabel('AI_TO_USER')).toBe('AI→사용자');
  });

  it('isBlocking only for BLOCK_INPUT / END_SESSION (GUIDE/WARN are not blocking)', () => {
    expect(isBlocking('BLOCK_INPUT')).toBe(true);
    expect(isBlocking('END_SESSION')).toBe(true);
    expect(isBlocking('GUIDE')).toBe(false);
    expect(isBlocking('WARN')).toBe(false);
    expect(isBlocking('ALLOW')).toBe(false);
  });

  it('retryAllowed false only for END_SESSION', () => {
    expect(retryAllowed('BLOCK_INPUT')).toBe(true);
    expect(retryAllowed('END_SESSION')).toBe(false);
    expect(isSessionEnd('END_SESSION')).toBe(true);
    expect(isSessionEnd('BLOCK_INPUT')).toBe(false);
  });

  it('guardrailUserMessage maps reason_code, falls back to category', () => {
    expect(guardrailUserMessage({ reason_code: 'RRN_PATTERN', category: 'G3' })).toContain('주민등록번호');
    expect(guardrailUserMessage({ reason_code: 'UNKNOWN', category: 'G4' })).toContain('유해·불법');
    expect(guardrailUserMessage(null)).toBe('');
  });

  it('extractGuardrail reads error.response.data.guardrail', () => {
    const g = { category: 'G3', action: 'BLOCK_INPUT', reason_code: 'RRN_PATTERN' };
    expect(extractGuardrail({ response: { data: { guardrail: g } } })).toEqual(g);
    expect(extractGuardrail({ response: { data: {} } })).toBe(null);
    expect(extractGuardrail({})).toBe(null);
  });
});

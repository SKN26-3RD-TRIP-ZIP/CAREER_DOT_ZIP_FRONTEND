import { describe, it, expect } from 'vitest';
import {
  reasonLabel,
  transactionLabel,
  transactionKind,
  formatAmount,
  formatBalance,
} from '../points';

describe('points helpers', () => {
  it('reasonLabel maps known codes, safe fallback for unknown', () => {
    expect(reasonLabel('QUESTION_PACK.CUSTOM')).toBe('맞춤 질문팩 생성');
    expect(reasonLabel('AUTH.EMAIL_VERIFIED')).toBe('이메일 인증 보상');
    expect(reasonLabel('SOME.UNKNOWN_CODE')).toBe('기타 포인트 변경');
  });

  it('transaction classification by type (not amount sign)', () => {
    expect(transactionLabel('REFUND')).toBe('환불');
    expect(transactionKind('EARN')).toBe('earn');
    expect(transactionKind('USE')).toBe('use');
    expect(transactionKind('REFUND')).toBe('refund');
    expect(transactionKind('ADMIN')).toBe('admin');
    expect(transactionKind('???')).toBe('other');
  });

  it('formatAmount shows sign, handles null', () => {
    expect(formatAmount(100)).toBe('+100P');
    expect(formatAmount(-50)).toBe('-50P');
    expect(formatAmount(0)).toBe('0P');
    expect(formatAmount(null)).toBe('-');
  });

  it('formatBalance distinguishes real 0 from null', () => {
    expect(formatBalance(0)).toBe('0P');
    expect(formatBalance(1500)).toBe('1,500P');
    expect(formatBalance(null)).toBe('미제공');
    expect(formatBalance(undefined)).toBe('미제공');
  });
});

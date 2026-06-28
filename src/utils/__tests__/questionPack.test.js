import { describe, it, expect } from 'vitest';
import {
  interviewTypeLabel,
  packQuestionCount,
  packStatusLabel,
  isPackApplicable,
} from '../questionPack';

describe('questionPack helpers', () => {
  it('interviewTypeLabel maps known types, falls back', () => {
    expect(interviewTypeLabel('technical')).toBe('기술');
    expect(interviewTypeLabel('personality')).toBe('인성');
    expect(interviewTypeLabel('comprehensive')).toBe('종합');
    expect(interviewTypeLabel('weird')).toBe('weird');
    expect(interviewTypeLabel(undefined)).toBe('기타');
  });

  it('packQuestionCount uses questions array length', () => {
    expect(packQuestionCount({ questions: [1, 2, 3] })).toBe(3);
    expect(packQuestionCount({ questions: [] })).toBe(0);
    expect(packQuestionCount({})).toBe(0);
    expect(packQuestionCount(null)).toBe(0);
  });

  it('packStatusLabel maps and falls back', () => {
    expect(packStatusLabel('ready')).toBe('사용 가능');
    expect(packStatusLabel('generating')).toBe('생성 중');
    expect(packStatusLabel('failed')).toBe('생성 실패');
    expect(packStatusLabel(undefined)).toBe('상태 미상');
  });

  it('isPackApplicable requires non-blocked status and questions', () => {
    expect(isPackApplicable({ status: 'ready', questions: [1] })).toBe(true);
    expect(isPackApplicable({ status: 'generating', questions: [1] })).toBe(false);
    expect(isPackApplicable({ status: 'failed', questions: [1] })).toBe(false);
    expect(isPackApplicable({ status: 'ready', questions: [] })).toBe(false);
  });
});

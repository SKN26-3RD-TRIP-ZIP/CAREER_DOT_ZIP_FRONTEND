import { describe, expect, it } from 'vitest';
import { parseJdOriginalText } from '../jdOriginalText';

describe('parseJdOriginalText', () => {
  it('restores structured JD fields saved in original_text', () => {
    const parsed = parseJdOriginalText([
      '[직무 카테고리] fullstack',
      '[경력 구분] junior',
      '[기술스택] Python, React, Redis',
      '[주요업무] API와 화면 개발',
      '[자격요건] 실무 경험',
      '[우대사항] AWS 경험',
      '[추가 설명] 채용 공고 원문',
    ].join('\n'));

    expect(parsed).toMatchObject({
      hasStructuredSections: true,
      job_category: 'fullstack',
      experience_level: 'junior',
      tech_stacks: 'Python, React, Redis',
      main_tasks: 'API와 화면 개발',
      requirements: '실무 경험',
      preferences: 'AWS 경험',
      jd_text: '채용 공고 원문',
    });
  });

  it('keeps legacy plain original_text as additional description', () => {
    expect(parseJdOriginalText('기존 채용 공고 원문')).toEqual({
      hasStructuredSections: false,
      jd_text: '기존 채용 공고 원문',
    });
  });
});


import { describe, it, expect } from 'vitest';
import {
  urlAnalysisErrorMessage,
  isLikelyHttpUrl,
  validateOcrFile,
  isOcrEnvRequired,
  ocrErrorMessage,
  confidenceText,
  jdFieldsFromResponse,
  buildJdPatchBody,
} from '../jdAnalysis';

const err = (data) => ({ response: { data } });

describe('jdAnalysis helpers', () => {
  it('isLikelyHttpUrl', () => {
    expect(isLikelyHttpUrl('https://example.com/jobs/1')).toBe(true);
    expect(isLikelyHttpUrl('http://a.b')).toBe(true);
    expect(isLikelyHttpUrl('example.com')).toBe(false);
    expect(isLikelyHttpUrl('ftp://x')).toBe(false);
    expect(isLikelyHttpUrl('')).toBe(false);
  });

  it('urlAnalysisErrorMessage maps codes (SSRF/timeout/content-type)', () => {
    expect(urlAnalysisErrorMessage(err({ code: 'URL_REQUIRED' }))).toContain('URL을 입력');
    expect(urlAnalysisErrorMessage(err({ code: 'JD_URL_BLOCKED' }))).toContain('분석할 수 없는');
    expect(urlAnalysisErrorMessage(err({ code: 'JD_URL_FETCH_FAILED' }))).toContain('불러오지 못');
    expect(urlAnalysisErrorMessage(err({ code: 'WHATEVER' }))).toContain('추출하지 못');
  });

  it('validateOcrFile checks ext / mime / size', () => {
    expect(validateOcrFile({ name: 'jd.png', type: 'image/png', size: 1000 }).ok).toBe(true);
    expect(validateOcrFile({ name: 'jd.pdf', type: 'application/pdf', size: 1000 }).ok).toBe(true);
    expect(validateOcrFile({ name: 'jd.gif', type: 'image/gif', size: 1000 }).ok).toBe(false);
    expect(validateOcrFile({ name: 'jd.png', type: 'image/png', size: 11 * 1024 * 1024 }).ok).toBe(false);
    expect(validateOcrFile({ name: 'jd.png', type: 'image/png', size: 0 }).ok).toBe(false);
    expect(validateOcrFile(null).ok).toBe(false);
  });

  it('ocr error mapping: env required / guardrail / file', () => {
    expect(isOcrEnvRequired(err({ status: 'ENV_REQUIRED', code: 'OCR_PROVIDER_NOT_CONFIGURED' }))).toBe(true);
    expect(ocrErrorMessage(err({ code: 'OCR_PROVIDER_NOT_CONFIGURED', status: 'ENV_REQUIRED' }))).toContain('Provider');
    expect(ocrErrorMessage(err({ code: 'OCR_GUARDRAIL_BLOCKED' }))).toContain('민감');
    expect(ocrErrorMessage(err({ file: 'File is too large.' }))).toBe('File is too large.');
  });

  it('confidenceText distinguishes real 0 from null', () => {
    expect(confidenceText(0)).toBe('0%');
    expect(confidenceText(0.62)).toBe('62%');
    expect(confidenceText(null)).toBe('미상');
    expect(confidenceText(undefined)).toBe('미상');
  });

  it('jdFieldsFromResponse maps backend fields (tech_stacks fallback from keywords)', () => {
    const jd = {
      jd_id: 'x', company_name: 'A사', position: '백엔드',
      extracted_fields: { requirements: '3년+', tech_stacks: ['Python', 'Django'], main_tasks: 'API', confidence: 0.7 },
      source_url: 'https://e.com', source_fetched_at: '2026-01-01T00:00:00Z', extraction_confidence: 0.7,
    };
    const m = jdFieldsFromResponse(jd);
    expect(m.jdId).toBe('x');
    expect(m.techStacks).toEqual(['Python', 'Django']);
    expect(m.confidence).toBe(0.7);
    const fromKeywords = jdFieldsFromResponse({ keywords: 'Java, Spring' });
    expect(fromKeywords.techStacks).toEqual(['Java', 'Spring']);
  });
});

describe('buildJdPatchBody', () => {
  it('maps allowed fields only, serializes keywords array', () => {
    expect(buildJdPatchBody({ company: 'A', position: 'B', requirements: 'R', keywords: ['x', 'y'] }))
      .toEqual({ company_name: 'A', position: 'B', job_requirements: 'R', keywords: 'x, y' });
  });
  it('partial: only present keys included; string keywords passthrough', () => {
    expect(buildJdPatchBody({ company: 'A', keywords: 'Python, Django' }))
      .toEqual({ company_name: 'A', keywords: 'Python, Django' });
    expect(buildJdPatchBody({})).toEqual({});
  });
});

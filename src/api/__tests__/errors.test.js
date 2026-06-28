import { describe, it, expect } from 'vitest';
import { toUserMessage, isEnvRequired, isNetworkError } from '../errors';

function errWith({ status, data }) {
  return { response: { status, data } };
}

describe('toUserMessage', () => {
  it('코드 매핑 우선', () => {
    expect(toUserMessage(errWith({ status: 409, data: { code: 'EMAIL_ALREADY_REGISTERED' } }))).toBe(
      '이미 가입된 이메일입니다.'
    );
  });
  it('코드 없으면 status 매핑', () => {
    expect(toUserMessage(errWith({ status: 429, data: {} }))).toContain('잠시 후');
  });
  it('네트워크 오류', () => {
    expect(toUserMessage({})).toContain('서버에 연결할 수 없습니다');
  });
});

describe('isEnvRequired', () => {
  it('503 + ENV_REQUIRED 판별', () => {
    expect(isEnvRequired(errWith({ status: 503, data: { status: 'ENV_REQUIRED' } }))).toBe(true);
    expect(isEnvRequired(errWith({ status: 503, data: { code: 'OAUTH_PROVIDER_NOT_CONFIGURED' } }))).toBe(true);
    expect(isEnvRequired(errWith({ status: 500, data: {} }))).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('response 없으면 네트워크 오류', () => {
    expect(isNetworkError({})).toBe(true);
    expect(isNetworkError(errWith({ status: 500, data: {} }))).toBe(false);
  });
});

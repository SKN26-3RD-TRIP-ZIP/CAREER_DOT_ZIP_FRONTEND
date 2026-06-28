import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../axiosInstance', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import axiosInstance from '../axiosInstance';
import { oauthStart, oauthExchange, submitSocialTerms } from '../authApi';

beforeEach(() => {
  axiosInstance.get.mockReset().mockResolvedValue({ data: {} });
  axiosInstance.post.mockReset().mockResolvedValue({ data: {} });
});

describe('oauthStart', () => {
  it('GET /auth/oauth/{provider}/start with next + flow', () => {
    oauthStart('google', '/mypage', 'login');
    expect(axiosInstance.get).toHaveBeenCalledWith('/auth/oauth/google/start', {
      params: { next: '/mypage', flow: 'login' },
    });
  });
  it('kakao signup flow', () => {
    oauthStart('kakao', '/mypage', 'signup');
    expect(axiosInstance.get).toHaveBeenCalledWith('/auth/oauth/kakao/start', {
      params: { next: '/mypage', flow: 'signup' },
    });
  });
});

describe('oauthExchange', () => {
  it('POST /auth/oauth/exchange { code }', () => {
    oauthExchange('one-time-code');
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/oauth/exchange', { code: 'one-time-code' });
  });
});

describe('submitSocialTerms', () => {
  it('POST /auth/oauth/social/terms with snake_case body', () => {
    submitSocialTerms({ termsAgreed: true, privacyAgreed: true, marketingAgreed: false });
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/oauth/social/terms', {
      terms_agreed: true,
      privacy_agreed: true,
      marketing_agreed: false,
    });
  });
});

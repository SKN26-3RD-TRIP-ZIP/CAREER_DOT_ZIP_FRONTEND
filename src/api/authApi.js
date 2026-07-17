import axiosInstance from './axiosInstance';

// 약관 버전 기본값 (백엔드 SignupSerializer 기본값 'v1' 과 일치)
export const DEFAULT_TERMS_VERSION = 'v1';
export const DEFAULT_PRIVACY_VERSION = 'v1';

// BE 라우트는 끝 슬래시가 없다: /auth/signup, /auth/login, /auth/verify-email, /auth/logout, /auth/me
// 백엔드 SignupSerializer 는 terms_agreed/privacy_agreed(필수), marketing_agreed/버전을 받는다.
export const signup = ({
  email,
  name,
  password,
  termsAgreed = false,
  privacyAgreed = false,
  marketingAgreed = false,
  termsVersion = DEFAULT_TERMS_VERSION,
  privacyVersion = DEFAULT_PRIVACY_VERSION,
}) =>
  axiosInstance.post('/auth/signup', {
    email,
    name,
    password,
    terms_agreed: Boolean(termsAgreed),
    privacy_agreed: Boolean(privacyAgreed),
    marketing_agreed: Boolean(marketingAgreed),
    terms_version: termsVersion,
    privacy_version: privacyVersion,
  });

// 이메일 중복 확인 (POST /auth/check-email { email }) → { available, code, detail }
export const checkEmail = (email) =>
  axiosInstance.post('/auth/check-email', { email });

export const login = ({ email, password }) =>
  axiosInstance.post('/auth/login', { email, password });

export const requestPasswordReset = (email) =>
  axiosInstance.post('/auth/password-reset/request', { email });

export const confirmPasswordReset = ({ uid, token, password, passwordConfirm }) =>
  axiosInstance.post('/auth/password-reset/confirm', {
    uid,
    token,
    password,
    password_confirm: passwordConfirm,
  });

// 6자리 인증번호 검증 (POST /auth/verify-email { email, code })
export const verifyCode = ({ email, code }) =>
  axiosInstance.post('/auth/verify-email', { email, code });

// 이메일 인증번호 재발송 (성공: expires_in/resend_after, 쿨다운: retry_after, 발송 실패: EMAIL_SEND_FAILED)
export const resendVerification = (email) =>
  axiosInstance.post('/auth/verify-email/resend', { email });

// 현재 로그인 사용자 조회 — 화면 표시 사용자의 단일 출처
export const getMe = () => axiosInstance.get('/auth/me');

export const completeOnboarding = () =>
  axiosInstance.post('/auth/onboarding/complete');

export const logout = () => axiosInstance.post('/auth/logout');

export const withdrawAccount = ({ confirm }) =>
  axiosInstance.delete('/auth/me/withdraw', { data: { confirm } });

// ── 소셜 로그인(OAuth) ─────────────────────────────────────────────
// GET /auth/oauth/{provider}/start?next=<path>&flow=<login|signup>
//   200 → { provider, auth_url, state, nonce, next_path }
//   503 → { code: OAUTH_PROVIDER_NOT_CONFIGURED, status: 'ENV_REQUIRED', required_env: [...] }
export const oauthStart = (provider, next, flow) =>
  axiosInstance.get(`/auth/oauth/${provider}/start`, {
    params: { ...(next ? { next } : {}), ...(flow ? { flow } : {}) },
  });

// POST /auth/oauth/exchange { code }  — 일회용 코드 → Career.zip 토큰(기존 로그인과 동일 응답)
//   200 → { access_token, token_type, provider, created, needs_terms, next_path } (+ refresh 쿠키)
//   400 OAUTH_EXCHANGE_CODE_INVALID / OAUTH_EXCHANGE_CODE_EXPIRED
//   409 OAUTH_EXCHANGE_CODE_USED · 403 OAUTH_ACCOUNT_BLOCKED
export const oauthExchange = (code) =>
  axiosInstance.post('/auth/oauth/exchange', { code });

// POST /auth/terms { terms_agreed, privacy_agreed, marketing_agreed }  (인증 필요)
//   200 → { detail, next_path } · 400 TERMS_REQUIRED
export const submitTermsAcceptance = ({ termsAgreed, privacyAgreed, marketingAgreed = false }) =>
  axiosInstance.post('/auth/terms', {
    terms_agreed: Boolean(termsAgreed),
    privacy_agreed: Boolean(privacyAgreed),
    marketing_agreed: Boolean(marketingAgreed),
  });

// 기존 import와의 호환성을 유지한다.
export const submitSocialTerms = submitTermsAcceptance;

// ── 약관 동의 ──────────────────────────────────────────────────────
// GET /auth/users/me/terms-agreements?page=&size=
//   200 → { total, page, size, required_reconsent: [...], results: [...] }
export const getMyTermsAgreements = (params) =>
  axiosInstance.get('/auth/users/me/terms-agreements', { params });

// PATCH /auth/users/me/terms-agreements/marketing { agreed, version? }
export const updateMarketingConsent = ({ agreed, version }) =>
  axiosInstance.patch(
    '/auth/users/me/terms-agreements/marketing',
    version ? { agreed, version } : { agreed }
  );

export default {
  checkEmail,
  signup,
  login,
  requestPasswordReset,
  confirmPasswordReset,
  verifyCode,
  resendVerification,
  getMe,
  completeOnboarding,
  logout,
  withdrawAccount,
  oauthStart,
  oauthExchange,
  submitTermsAcceptance,
  submitSocialTerms,
  getMyTermsAgreements,
  updateMarketingConsent,
};

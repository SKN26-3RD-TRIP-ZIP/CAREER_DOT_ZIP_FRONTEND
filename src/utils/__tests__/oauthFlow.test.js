import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isProviderEnabled,
  mapOAuthError,
  parseOAuthCallbackParams,
  resolveOAuthDestination,
  safeInternal,
  claimExchange,
  runOAuthExchange,
  __resetExchangeGuardForTests,
  SOCIAL_TERMS_PATH,
} from '../oauthFlow';
import { resolveAuthedRedirect } from '../authNavigation';

beforeEach(() => {
  __resetExchangeGuardForTests();
});

describe('isProviderEnabled (provider 비활성화 플래그)', () => {
  it("'false' 면 비활성", () => {
    expect(isProviderEnabled('false')).toBe(false);
    expect(isProviderEnabled('FALSE')).toBe(false);
  });
  it('미설정/true 면 활성', () => {
    expect(isProviderEnabled(undefined)).toBe(true);
    expect(isProviderEnabled('true')).toBe(true);
    expect(isProviderEnabled('1')).toBe(true);
  });
});

describe('mapOAuthError (Provider 오류 매핑)', () => {
  it('계정 충돌/만료/사용됨 코드 매핑', () => {
    expect(mapOAuthError('OAUTH_ACCOUNT_CONFLICT')).toContain('이미 같은 이메일');
    expect(mapOAuthError('OAUTH_EXCHANGE_CODE_EXPIRED')).toContain('만료');
    expect(mapOAuthError('OAUTH_EXCHANGE_CODE_USED')).toContain('이미 처리된');
  });
  it('Kakao provider 오류(KOE004 일반화) → 준비되지 않음 안내', () => {
    expect(mapOAuthError('OAUTH_PROVIDER_ERROR', 'kakao')).toContain('카카오 로그인이 현재 준비되지');
    expect(mapOAuthError('OAUTH_PROVIDER_NOT_CONFIGURED', 'kakao')).toContain('카카오 로그인이 현재 준비되지');
  });
  it('Google provider 오류는 일반 안내', () => {
    expect(mapOAuthError('OAUTH_PROVIDER_ERROR', 'google')).toContain('제공자에서 오류');
  });
  it('동의 취소(access_denied)', () => {
    expect(mapOAuthError('access_denied')).toContain('취소');
  });
  it('알 수 없는 코드는 fallback, null 은 null', () => {
    expect(mapOAuthError('SOMETHING_ELSE')).toContain('소셜 로그인에 실패');
    expect(mapOAuthError(null)).toBeNull();
  });
});

describe('parseOAuthCallbackParams', () => {
  it('URLSearchParams 유사 객체에서 code/error 추출', () => {
    const sp = new URLSearchParams('code=abc123');
    expect(parseOAuthCallbackParams(sp)).toEqual({ code: 'abc123', error: '' });
    const sp2 = new URLSearchParams('error=OAUTH_STATE_INVALID');
    expect(parseOAuthCallbackParams(sp2)).toEqual({ code: '', error: 'OAUTH_STATE_INVALID' });
  });
  it('plain object 도 지원', () => {
    expect(parseOAuthCallbackParams({ code: 'x' })).toEqual({ code: 'x', error: '' });
  });
});

describe('resolveOAuthDestination / safeInternal (Open Redirect 방지)', () => {
  it('약관 미완료면 약관 경로', () => {
    expect(resolveOAuthDestination({ needsTerms: true })).toBe(SOCIAL_TERMS_PATH);
    expect(resolveOAuthDestination({ nextPath: SOCIAL_TERMS_PATH })).toBe(SOCIAL_TERMS_PATH);
  });
  it('내부 경로 통과, 외부 URL 차단(기본 /mypage)', () => {
    expect(resolveOAuthDestination({ nextPath: '/mypage' })).toBe('/mypage');
    expect(resolveOAuthDestination({ nextPath: 'https://evil.com' })).toBe('/mypage');
    expect(resolveOAuthDestination({ nextPath: '//evil.com' })).toBe('/mypage');
    expect(resolveOAuthDestination({})).toBe('/mypage');
  });
  it('safeInternal', () => {
    expect(safeInternal('/mypage')).toBe('/mypage');
    expect(safeInternal('https://x.com')).toBeNull();
    expect(safeInternal('//x.com')).toBeNull();
  });
});

function makeDeps(overrides = {}) {
  return {
    exchange: vi.fn(),
    getMe: vi.fn(async () => ({ data: { user_id: 1, is_staff: false, profile: { is_complete: true } } })),
    reset: vi.fn(),
    setToken: vi.fn(),
    setUser: vi.fn(),
    resolveAuthed: vi.fn(() => '/mypage'),
    ...overrides,
  };
}

describe('runOAuthExchange (callback 흐름)', () => {
  it('code 교환 성공 → 토큰 저장 + /mypage 이동', async () => {
    const deps = makeDeps({
      exchange: vi.fn(async () => ({ data: { access_token: 'AT', token_type: 'Bearer', created: false, next_path: '/mypage' } })),
    });
    const result = await runOAuthExchange({ params: { code: 'c1' }, provider: 'google', deps });
    expect(result.ok).toBe(true);
    expect(deps.setToken).toHaveBeenCalledWith('AT');
    expect(deps.setUser).toHaveBeenCalled();
    expect(result.redirect).toBe('/mypage');
  });

  it('신규 가입 + 약관 미완료 → /signup/social/terms 이동', async () => {
    const deps = makeDeps({
      exchange: vi.fn(async () => ({ data: { access_token: 'AT', created: true, needs_terms: true, next_path: SOCIAL_TERMS_PATH } })),
    });
    const result = await runOAuthExchange({ params: { code: 'c2' }, provider: 'google', deps });
    expect(result.ok).toBe(true);
    expect(result.redirect).toBe(SOCIAL_TERMS_PATH);
    expect(deps.resolveAuthed).not.toHaveBeenCalled();
  });

  it('callback error 처리: exchange 실패 코드 → 사용자 메시지', async () => {
    const deps = makeDeps({
      exchange: vi.fn(async () => {
        throw { response: { data: { code: 'OAUTH_EXCHANGE_CODE_EXPIRED' } } };
      }),
    });
    const result = await runOAuthExchange({ params: { code: 'c3' }, provider: 'google', deps });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('만료');
    expect(deps.setToken).not.toHaveBeenCalled();
  });

  it('error 파라미터(예: state invalid) → exchange 호출 없음', async () => {
    const deps = makeDeps();
    const result = await runOAuthExchange({ params: { error: 'OAUTH_STATE_INVALID' }, provider: 'google', deps });
    expect(result.ok).toBe(false);
    expect(deps.exchange).not.toHaveBeenCalled();
    expect(result.error).toContain('만료되었거나 변조');
  });

  it('중복 exchange 방지: 동일 code 동시 호출 시 한 번만 교환', async () => {
    let resolveExchange;
    const exchange = vi.fn(
      () => new Promise((res) => { resolveExchange = () => res({ data: { access_token: 'AT', next_path: '/mypage' } }); })
    );
    const deps = makeDeps({ exchange });
    const p1 = runOAuthExchange({ params: { code: 'dup' }, provider: 'google', deps });
    const p2 = runOAuthExchange({ params: { code: 'dup' }, provider: 'google', deps });
    resolveExchange();
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(exchange).toHaveBeenCalledTimes(1);
    // 두 번째 호출은 skip
    expect([r1.skipped, r2.skipped]).toContain(true);
  });
});

describe('ProtectedRoute 통과 조건 (resolveAuthedRedirect)', () => {
  it('프로필 완료 사용자는 /mypage 로(보호 라우트 통과 대상)', () => {
    const user = { is_staff: false, profile: { is_complete: true }, next_path: '/mypage' };
    expect(resolveAuthedRedirect(user, '/mypage')).toBe('/mypage');
  });
  it('프로필 미완료는 /profile 로 유도', () => {
    const user = { is_staff: false, profile: { is_complete: false } };
    expect(resolveAuthedRedirect(user, '/mypage')).toBe('/profile');
  });
});

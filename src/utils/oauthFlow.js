/**
 * 소셜 로그인(OAuth) 프론트 공통 로직 (단일 출처, 순수 함수 중심으로 테스트 가능).
 *
 * 흐름(design A): 로그인/회원가입 버튼 → GET /auth/oauth/{provider}/start → provider 인가
 *   → Backend callback 처리 → 302 → /oauth/callback?code=<일회용코드> | ?error=<CODE>
 *   → POST /auth/oauth/exchange { code } → access token + refresh 쿠키 → next_path 이동
 */

export const TERMS_PATH = '/signup/terms';
// 기존 import와의 호환성을 유지한다.
export const SOCIAL_TERMS_PATH = TERMS_PATH;
export const DEFAULT_OAUTH_NEXT = '/mypage';
export const OAUTH_PROVIDER_KEY = 'careerzip_oauth_provider';

// VITE_*_OAUTH_ENABLED 가 명시적으로 'false' 면 비활성(준비 중) 처리. 그 외에는 활성.
export function isProviderEnabled(flag) {
  return String(flag ?? 'true').toLowerCase() !== 'false';
}

const PROVIDER_LABEL = { google: 'Google', kakao: '카카오' };

export function providerLabel(provider) {
  return PROVIDER_LABEL[provider] || '소셜';
}

// Backend/Provider 오류 코드 → 사용자 친화 메시지
const OAUTH_ERROR_MESSAGES = {
  OAUTH_PROVIDER_NOT_CONFIGURED: '소셜 로그인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.',
  OAUTH_STATE_INVALID: '로그인 요청이 만료되었거나 변조되었습니다. 다시 시도해 주세요.',
  OAUTH_CALLBACK_INVALID: '소셜 로그인 응답이 올바르지 않습니다. 다시 시도해 주세요.',
  OAUTH_PROVIDER_ERROR: '소셜 로그인 제공자에서 오류가 발생했습니다. 다시 시도해 주세요.',
  OAUTH_EMAIL_REQUIRED: '이메일 제공에 동의해야 가입할 수 있습니다. 이메일 제공 동의 후 다시 시도해 주세요.',
  OAUTH_ACCOUNT_BLOCKED: '이 계정으로는 소셜 로그인을 할 수 없습니다. (탈퇴 또는 정지된 계정)',
  OAUTH_ACCOUNT_CONFLICT:
    '이미 같은 이메일로 가입된 계정이 있습니다. 기존 방식으로 로그인한 뒤 소셜 계정을 연결해 주세요.',
  OAUTH_EXCHANGE_CODE_INVALID: '로그인 정보가 올바르지 않습니다. 다시 로그인해 주세요.',
  OAUTH_EXCHANGE_CODE_EXPIRED: '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.',
  OAUTH_EXCHANGE_CODE_USED: '이미 처리된 로그인 요청입니다. 다시 로그인해 주세요.',
  // provider 가 직접 내려주는 표준 값(혹시 프론트로 전달될 경우 대비)
  access_denied: '소셜 로그인을 취소했습니다. 다시 시도하시려면 버튼을 눌러 주세요.',
};

const KAKAO_NOT_READY =
  '카카오 로그인이 현재 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 오류 코드를 사용자 메시지로 변환한다.
 * Kakao 의 KOE004(관리자 설정 문제)는 Backend 가 OAUTH_PROVIDER_ERROR 로 일반화하므로,
 * provider 가 kakao 인 provider 오류는 "준비되지 않았습니다" 안내로 매핑한다.
 */
export function mapOAuthError(code, provider) {
  if (!code) return null;
  if (code === 'access_denied') return OAUTH_ERROR_MESSAGES.access_denied;
  if (provider === 'kakao' && (code === 'OAUTH_PROVIDER_ERROR' || code === 'OAUTH_PROVIDER_NOT_CONFIGURED')) {
    return KAKAO_NOT_READY;
  }
  return OAUTH_ERROR_MESSAGES[code] || '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
}

/** URLSearchParams(또는 동등 객체)에서 일회용 code / error 를 추출한다. */
export function parseOAuthCallbackParams(params) {
  const get = typeof params?.get === 'function' ? (k) => params.get(k) : (k) => params?.[k];
  return { code: get('code') || '', error: get('error') || '' };
}

/**
 * 인증 완료 후 이동 경로 결정.
 * - 신규 가입 + 필수 약관 미완료(needs_terms 또는 next_path === 약관 경로) → 약관 화면
 * - 그 외 → 허용된 내부 경로만(외부 URL 차단), 기본 /mypage
 */
export function resolveOAuthDestination({ nextPath, needsTerms } = {}) {
  if (needsTerms || nextPath === TERMS_PATH) return TERMS_PATH;
  return safeInternal(nextPath) || DEFAULT_OAUTH_NEXT;
}

export function safeInternal(path) {
  if (typeof path !== 'string' || path.length === 0) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//') || path.startsWith('/\\')) return null;
  if (path.includes('\\') || path.includes('://')) return null;
  return path;
}

// ===== StrictMode/중복 요청 방지: 동일 일회용 코드의 exchange 를 1회만 수행 =====
// 모듈 스코프 Set 은 StrictMode 의 effect 이중 호출(remount) 사이에도 유지되므로
// 같은 code 로 exchange API 가 두 번 호출되는 것을 막는다.
const _inFlightCodes = new Set();

export function claimExchange(code) {
  if (!code || _inFlightCodes.has(code)) return false;
  _inFlightCodes.add(code);
  return true;
}

export function releaseExchange(code) {
  _inFlightCodes.delete(code);
}

export function __resetExchangeGuardForTests() {
  _inFlightCodes.clear();
}

/**
 * 콜백 → exchange → 토큰 저장 → 이동 경로 결정까지의 오케스트레이션(순수 의존성 주입).
 * 컴포넌트는 결과의 redirect/error 만 사용한다. (테스트 용이 + StrictMode 중복 방지)
 *
 * @param {object} args
 * @param {object} args.params      URLSearchParams 유사 객체(code/error)
 * @param {string} [args.provider]  kakao 전용 오류 안내용
 * @param {object} args.deps        { exchange, getMe, reset, setToken, setUser, resolveAuthed }
 * @returns {Promise<{ok:boolean, redirect?:string, error?:string, skipped?:boolean, created?:boolean, needsTerms?:boolean}>}
 */
export async function runOAuthExchange({ params, provider, deps }) {
  const { exchange, getMe, reset, setToken, setUser, resolveAuthed } = deps;
  const { code, error } = parseOAuthCallbackParams(params);

  if (error) return { ok: false, error: mapOAuthError(error, provider) };
  if (!code) return { ok: false, error: mapOAuthError('OAUTH_CALLBACK_INVALID', provider) };
  // 동일 code 의 exchange 를 1회만 수행(중복 요청/StrictMode 보호). 성공 시 해제하지 않는다.
  if (!claimExchange(code)) return { ok: false, skipped: true };

  try {
    reset();
    const { data } = await exchange(code);
    if (!data?.access_token) throw new Error('no access token');
    setToken(data.access_token);

    const me = await getMe();
    setUser(me.data);

    const redirect =
      data.needs_terms || data.next_path === TERMS_PATH
        ? TERMS_PATH
        : resolveAuthed(me.data, data.next_path);
    return { ok: true, redirect, created: Boolean(data.created), needsTerms: Boolean(data.needs_terms) };
  } catch (err) {
    reset();
    const code2 = err?.response?.data?.code || null;
    return { ok: false, error: mapOAuthError(code2, provider) || '소셜 로그인에 실패했습니다. 다시 시도해 주세요.', err };
  }
}

/**
 * 로그인/인증 후 이동 경로 정책 (단일 출처).
 *
 * 정책 요약:
 *   이메일 인증 성공            → 로그인 화면 (VerifyEmailPage 에서 처리)
 *   로그인 성공 + 프로필 미완성 → /profile
 *   로그인 성공 + 프로필 완료   → 저장된 redirect(next) 또는 next_path(기본 /mypage)
 *   Access Token 없음           → 보호 페이지 차단 (ProtectedRoute)
 *   Refresh 실패                → 인증 상태 초기화 후 /auth/login (axiosInstance 에서 처리)
 *
 * 사용자 객체는 GET /auth/me 응답이며 화면 표시 사용자의 단일 출처다.
 *   { user_id, email, name, is_staff, is_verified, is_active, last_login,
 *     profile: { exists, is_complete, profile_id }, next_path }
 */

export function isProfileComplete(user) {
  return Boolean(user && user.profile && user.profile.is_complete);
}

export function isOnboardingRequired(user) {
  return Boolean(user && !user.is_staff && user.onboarding && user.onboarding.required);
}

/**
 * 오픈 리다이렉트 방지: 같은 출처의 내부 경로만 허용한다.
 * - 반드시 '/' 로 시작하고 '//'(protocol-relative)·역슬래시·콜론(scheme) 금지
 * - 인증 화면으로 되돌아가는 루프 방지를 위해 /auth, /login, /signup 제외
 */
export function isSafeInternalPath(path) {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//') || path.startsWith('/\\')) return false;
  if (path.includes('\\') || path.includes(':')) return false;
  const lowered = path.toLowerCase();
  if (
    lowered.startsWith('/auth') ||
    lowered === '/login' ||
    lowered === '/signup' ||
    lowered.startsWith('/verify-email')
  ) {
    return false;
  }
  return true;
}

export function safeNext(path) {
  return isSafeInternalPath(path) ? path : null;
}

/**
 * 인증 완료(토큰 + /auth/me) 후 이동할 경로를 결정한다.
 * @param {object} user      GET /auth/me 응답
 * @param {string} [savedNext] 보호 페이지 접근 차단 시 저장해둔 원래 경로(?next=)
 */
export function resolveAuthedRedirect(user, savedNext) {
  if (!user) return '/auth/login';

  // 관리자: 프로필 개념과 무관하게 백엔드가 지정한 next_path(/admin/dashboard) 우선
  if (user.is_staff) return user.next_path || '/admin/dashboard';

  if (isOnboardingRequired(user)) return user.onboarding.next_path || '/input/onboarding/1';

  // 필수 프로필 미완성: 반드시 프로필 작성 화면으로 (savedNext 무시)
  if (!isProfileComplete(user)) return '/profile';

  // 프로필 완료: 저장된 redirect → next_path → /mypage
  return safeNext(savedNext) || user.next_path || '/mypage';
}

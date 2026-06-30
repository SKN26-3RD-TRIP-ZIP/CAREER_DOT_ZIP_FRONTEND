import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEnsureMe } from '../../hooks/useEnsureMe';
import { isProfileComplete } from '../../utils/authNavigation';

const AUTH_CHECK_TIMEOUT_MS = 120000;

function AuthGateLoading({ timedOut = false }) {
  if (timedOut) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-base font-black text-[#000000]">로그인 정보 확인이 오래 걸리고 있습니다.</p>
        <p className="max-w-sm text-sm leading-6 text-[rgba(0,0,0,0.62)]">
          세션이 만료되었거나 네트워크 응답이 지연되고 있을 수 있습니다. 메인으로 돌아가거나 다시 로그인해주세요.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.2)] bg-[#EEEEEE] px-5 text-sm font-black text-[#253900] transition hover:border-[#253900]"
          >
            메인으로 이동
          </Link>
          <Link
            to="/auth/login?session=expired"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#08CB00] px-5 text-sm font-black text-[#000000] transition hover:bg-[#05A000]"
          >
            다시 로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#253900]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EEEEEE] border-t-[#08CB00]" />
      <p className="text-sm font-bold">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}

function AuthGateError({ onRetry }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-base font-black text-[#000000]">로그인 정보를 불러오지 못했습니다.</p>
      <p className="max-w-sm text-sm text-[rgba(0,0,0,0.62)]">
        네트워크 상태를 확인한 뒤 다시 시도해 주세요. 문제가 계속되면 다시 로그인해 주세요.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#08CB00] px-5 text-sm font-black text-[#000000] transition hover:bg-[#05A000]"
      >
        다시 시도
      </button>
    </div>
  );
}

/**
 * 보호 라우트 가드.
 *  - Access Token 없음        → /auth/login?next=<원래경로> 로 차단
 *  - 토큰 있음, user 미hydrate → /auth/me 조회(로딩 표시)
 *  - 조회 실패(5xx/네트워크)   → 재시도 UI
 *  - requireComplete && 프로필 미완성 → /profile 로 유도
 *
 * @param {boolean} [requireComplete] 필수 프로필 완료가 필요한 페이지 여부
 */
export default function ProtectedRoute({ requireComplete = false }) {
  const location = useLocation();
  const { status, user, retry } = useEnsureMe();
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false);

  useEffect(() => {
    if (status !== 'loading') {
      setAuthCheckTimedOut(false);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setAuthCheckTimedOut(true);
    }, AUTH_CHECK_TIMEOUT_MS);

    return () => window.clearTimeout(timerId);
  }, [status]);

  const handleRetry = () => {
    setAuthCheckTimedOut(false);
    retry();
  };

  if (status === 'unauthenticated') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }
  if (status === 'loading') {
    return <AuthGateLoading timedOut={authCheckTimedOut} />;
  }
  if (status === 'error') {
    return <AuthGateError onRetry={handleRetry} />;
  }
  // status === 'ready'
  if (requireComplete && !isProfileComplete(user)) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEnsureMe } from '../../hooks/useEnsureMe';
import { logout as logoutApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: '대시보드', to: '/dashboard' },
  { label: '자료 입력', to: '/jd' },
  { label: '면접 진행', to: '/analysis' },
  { label: '리포트', to: '/report' },
  { label: '마이페이지', to: '/mypage' },
];

function isActiveItem(item, pathname, active) {
  if (active && item.label === active) return true;
  if (item.to === '/analysis') return pathname.startsWith('/analysis') || pathname.startsWith('/interview');
  if (item.to === '/report') return pathname.startsWith('/report');
  if (item.to === '/dashboard') return pathname === '/dashboard';
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function Logo({ disabled = false }) {
  const className =
    'inline-flex items-center rounded-full border border-[#08CB00] px-3.5 py-1.5 text-base font-black tracking-tight text-[#08CB00]';

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} cursor-default`}>
        Career.zip
      </span>
    );
  }

  return (
    <Link to="/" className={className}>
      Career.zip
    </Link>
  );
}

export default function TopNav({ active = '', disabled = false, ctaTo = '/analysis', ctaLabel = '면접 시작하기', variant = 'app' }) {
  const location = useLocation();
  // 토큰이 있으면 /auth/me 로 사용자 복원(새로고침 후에도 로그인 유지). 토큰 없으면 즉시 unauthenticated.
  const { status, user } = useEnsureMe();
  const isLoggedIn = status === 'ready' && !!user;
  const displayName = user?.name || user?.email || '사용자';

  const navigate = useNavigate();
  const resetAuth = useAuthStore((s) => s.logout);
  // 서버 logout 호출(실패해도) → 클라이언트 토큰/유저 정리 → 홈으로. 홈이 재렌더되며 로그인 버튼으로 바뀜.
  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      resetAuth();
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="h-[76px] border-b border-[#e5e8eb] bg-white">
      <div className="mx-auto flex h-full max-w-[1460px] items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Logo disabled={disabled} />
          <nav className="hidden items-center gap-6 text-sm lg:flex" aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) => {
              const activeItem = isActiveItem(item, location.pathname, active);
              if (disabled) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className={
                      activeItem
                        ? 'cursor-not-allowed font-black text-[#08CB00]'
                        : 'cursor-not-allowed font-bold text-[rgba(0,0,0,0.40)]'
                    }
                  >
                    {item.label}
                  </span>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={
                    activeItem
                      ? 'font-black text-[#08CB00]'
                      : 'font-bold text-[#000000] transition hover:text-[#253900]'
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {variant === 'public' ? (
          isLoggedIn ? (
            // 로그인 상태: 이름(→마이페이지) + 로그아웃
            <div className="flex items-center gap-3">
              <Link
                to="/mypage"
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d6dde3] px-5 text-[15px] font-bold hover:border-[#08CB00] hover:text-[#08CB00]"
              >
                {displayName} 님
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 items-center justify-center rounded-lg border border-[#dfe5ea] px-4 text-[15px] font-bold text-[#4c5a65] hover:border-[#08CB00] hover:text-[#08CB00]"
              >
                로그아웃
              </button>
            </div>
          ) : (
            // 비로그인(또는 확인 중): 로그인 + 무료 면접 시작하기
            <div className="flex items-center gap-4">
              <Link
                to="/auth/login"
                className="flex h-12 min-w-[86px] items-center justify-center rounded-lg border border-[#d6dde3] px-5 text-[15px] font-bold"
              >
                로그인
              </Link>
              <Link
                to="/auth/signup"
                className="flex h-12 min-w-[148px] items-center justify-center rounded-lg bg-[#05b700] px-5 text-[15px] font-black text-white"
              >
                무료 면접 시작하기
              </Link>
            </div>
          )
        ) : (
          <Link
            to={disabled ? '#' : ctaTo}
            aria-disabled={disabled}
            onClick={(event) => {
              if (disabled) event.preventDefault();
            }}
            className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-[#08CB00] bg-[#08CB00] px-4 text-sm font-black tracking-tight text-[#EEEEEE] transition hover:opacity-90 ${
              disabled ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useEnsureMe } from '../../hooks/useEnsureMe';
import { logout as logoutApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { mypageApi } from '../../api/mypageApi';
import { BrandLogo } from './BrandLogo.jsx';

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
function UserAvatar() {
  return (
    <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#f1f3f5] text-[#4b5563]">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    </span>
  );
}

function NavLinks({ disabled, location, active, mobile = false }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const activeItem = isActiveItem(item, location.pathname, active);
        const base = mobile
          ? 'block rounded-lg px-3 py-2.5 text-base tracking-[0.03em]'
          : 'text-base tracking-[0.03em]';

        if (disabled) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              className={`${base} cursor-not-allowed no-underline ${
                activeItem ? 'font-semibold text-[#111827]' : 'font-medium text-[#5b6472]'
              }`}
            >
              {item.label}
            </span>
          );
        }

        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={`${base} no-underline ${
              activeItem ? 'font-semibold text-[#111827]' : 'font-medium text-[#5b6472] hover:text-[#111827]'
            }`}
          >
            {item.label}
          </NavLink>
        );
      })}
    </>
  );
}

export default function TopNav({ active = true, disabled = false, variant = 'app', userName, points, onLogout }) {
  const location = useLocation();
  // 토큰이 있으면 /auth/me 로 사용자 복원(새로고침 후에도 로그인 유지). 토큰 없으면 즉시 unauthenticated.
  const { status, user } = useEnsureMe();
  const isLoggedIn = status === 'ready' && !!user;
  const displayName = userName ?? user?.name ?? user?.email ?? '사용자';

  const navigate = useNavigate();
  const resetAuth = useAuthStore((s) => s.logout);

  // 페이지 전환마다 TopNav 가 재마운트되므로(공용 레이아웃 Outlet 대신 각 페이지가 자체 헤더를 렌더링),
  // 잔액을 zustand 전역 상태에 캐시해 재마운트 시 0/'-' 로 깜빡이지 않게 한다. user 캐시와 동일한 패턴.
  const storedPoints = useAuthStore((s) => s.pointBalance);
  const setStoredPoints = useAuthStore((s) => s.setPointBalance);
  useEffect(() => {
    if (points !== undefined) return undefined; // 외부에서 제어하는 경우 fetch 생략
    if (!isLoggedIn) return undefined;
    let active = true;
    mypageApi
      .getPointBalance()
      .then((data) => {
        if (active) setStoredPoints(data?.point_balance ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isLoggedIn, points, setStoredPoints]);

  const displayPoints = points ?? (isLoggedIn ? storedPoints : null);
  const formattedPoints = displayPoints == null ? '-' : Number(displayPoints).toLocaleString('ko-KR');

  // 서버 logout 호출(실패해도) → 클라이언트 토큰/유저 정리 → 홈으로. 홈이 재렌더되며 로그인 버튼으로 바뀜.
  const handleLogout =
    onLogout ??
    (async () => {
      try {
        await logoutApi();
      } finally {
        resetAuth();
        navigate('/', { replace: true });
      }
    });

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const appUserZone = (mobile = false) => (
    <div className={mobile ? 'flex flex-col gap-4' : 'flex items-center gap-[18px]'}>
      <Link to="/mypage" className="flex items-center gap-2 no-underline">
        <UserAvatar />
        <span className="text-[15px] font-semibold text-[#1f2937]">{displayName} 님</span>
      </Link>

      {mobile ? <span className="h-px w-full bg-[#e5e7eb]" /> : <span className="h-5 w-px bg-[#e5e7eb]" />}

      <div className="flex items-center gap-[7px]">
        <img src="/icon-point.svg" alt="포인트" width="20" height="20" />
        <span className="text-[15px] font-bold text-[#111827]">{formattedPoints}</span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className={`h-[38px] rounded-[9px] border border-[#e0e3e7] bg-white px-4 text-sm font-semibold text-[#4b5563] hover:bg-[#f9fafb] ${
          mobile ? 'w-full' : ''
        }`}
      >
        로그아웃
      </button>
    </div>
  );

  const publicUserZone = (mobile = false) =>
    isLoggedIn ? (
      <div className={mobile ? 'flex flex-col gap-3' : 'flex items-center gap-3'}>
        <Link to="/mypage" className={`flex items-center gap-2 no-underline ${mobile ? '' : ''}`}>
          <UserAvatar />
          <span className="text-[15px] font-semibold text-[#1f2937]">{displayName} 님</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex h-12 items-center justify-center rounded-lg border border-[#dfe5ea] px-4 text-[15px] font-bold text-[#4c5a65] hover:border-[#08CB00] hover:text-[#08CB00] ${
            mobile ? 'w-full' : ''
          }`}
        >
          로그아웃
        </button>
      </div>
    ) : (
      <div className={mobile ? 'flex flex-col gap-3' : 'flex items-center gap-4'}>
        <Link
          to="/auth/login"
          className={`flex h-12 min-w-[86px] items-center justify-center rounded-lg border border-[#d6dde3] px-5 text-[15px] font-bold no-underline ${
            mobile ? 'w-full' : ''
          }`}
        >
          로그인
        </Link>
        <Link
          to="/auth/signup"
          className={`flex h-12 min-w-[148px] items-center justify-center rounded-lg bg-[#05b700] px-5 text-[15px] font-black text-white no-underline ${
            mobile ? 'w-full' : ''
          }`}
        >
          무료 면접 시작하기
        </Link>
      </div>
    );

  const userZone = variant === 'public' ? publicUserZone : appUserZone;

  return (
    <header className="relative border-b border-[#eceef1] bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1460px] items-center justify-between px-8">
        <div className="flex items-center gap-11">
          <BrandLogo disabled={disabled} />
          <nav className="hidden items-center gap-9 min-[1025px]:flex" aria-label="주요 메뉴">
            <NavLinks disabled={disabled} location={location} active={active} />
          </nav>
        </div>

        <div className="hidden min-[1025px]:flex">{userZone(false)}</div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#111827] min-[1025px]:hidden"
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#eceef1] bg-white px-8 py-4 min-[1025px]:hidden">
          <nav className="flex flex-col gap-1" aria-label="주요 메뉴(모바일)">
            <NavLinks disabled={disabled} location={location} active={active} mobile />
          </nav>
          <div className="mt-4 border-t border-[#e5e7eb] pt-4">{userZone(true)}</div>
        </div>
      )}
    </header>
  );
}

import { Link, NavLink, useLocation } from 'react-router-dom';

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

export default function TopNav({ active = '', disabled = false, ctaTo = '/analysis', ctaLabel = '면접 시작하기' }) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.08)] bg-[#EEEEEE]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
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
      </div>
    </header>
  );
}

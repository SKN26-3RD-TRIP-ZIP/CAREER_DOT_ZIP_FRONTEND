import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { label: '대시보드', to: '/dashboard' },
  { label: '자료 입력', to: '/jd' },
  { label: 'AI 분석', to: '/analysis' },
  { label: '면접진행', to: '/interview/setup' },
  { label: '리포트', to: '/report' },
  { label: '마이페이지', to: '/mypage' },
]

function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#000000]">
      <header className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.08)] bg-[#EEEEEE]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-[#08CB00] px-3.5 py-1.5 text-base font-black tracking-tight text-[#08CB00]"
            >
              Career.zip
            </Link>
            <nav className="hidden items-center gap-6 text-sm lg:flex" aria-label="주요 메뉴">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={
                    isActiveSection(item.to, location.pathname)
                      ? 'font-black text-[#08CB00]'
                      : 'font-bold text-[#000000] transition hover:text-[#253900]'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <Link
            to="/interview/setup"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-[#08CB00] bg-[#08CB00] px-4 text-sm font-black tracking-tight text-[#EEEEEE] transition hover:opacity-90"
          >
            면접 시작하기
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function isActiveSection(to, pathname) {
  if (to.startsWith('/analysis')) return pathname.startsWith('/analysis')
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default AppLayout

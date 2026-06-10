import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './AppLayout.css'

const navItems = [
  { label: '대시보드', to: '/dashboard' },
  { label: '자료 입력', to: '/data' },
  { label: 'AI 분석', to: '/analysis/source' },
  { label: '면접 진행', to: '/interview/setup' },
  { label: '리포트', to: '/report' },
  { label: '마이페이지', to: '/mypage' },
]

function AppLayout() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link to="/" className="app-logo">Career.zip</Link>
        <nav className="app-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink
              className={isActiveSection(item.to, location.pathname) ? 'active' : undefined}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {/* <Link to="/interview/setup" className="app-start-link">면접 시작하기</Link> */}
      </header>

      <main className="app-workspace">
        <Outlet />
      </main>
    </div>
  )
}

function isActiveSection(to, pathname) {
  if (to.startsWith('/analysis')) {
    return pathname.startsWith('/analysis')
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}

export default AppLayout

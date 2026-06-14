import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: '대시보드' },
  { to: '/admin/members', label: '회원관리' },
  { to: '/admin/prompts', label: '프롬프트 관리' },
  { to: '/admin/versions', label: '버전 관리' },
  { to: '/admin/ai-usage', label: 'AI 사용량' },
  { to: '/admin/api-usage', label: 'API 사용량' },
  { to: '/admin/audit-logs', label: '서비스 통계' },
]

export default function PrivateRoute() {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      {/* Top navigation — white background */}
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="rounded-md bg-[#1a2e05] px-3 py-1.5">
            <span className="text-sm font-bold text-white">Career.zip</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'relative px-3 py-[14px] text-sm transition-colors',
                    isActive
                      ? 'font-semibold text-slate-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-emerald-500 after:content-[""]'
                      : 'font-medium text-slate-500 hover:text-slate-800',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin info */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">admin@career.zip</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
            A
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-10 py-8">
        <Outlet />
      </main>
    </div>
  )
}

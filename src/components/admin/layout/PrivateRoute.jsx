import { useState, useRef, useEffect } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useEnsureMe } from '../../../hooks/useEnsureMe'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: '대시보드' },
  { to: '/admin/members', label: '회원관리' },
  { to: '/admin/points', label: '포인트 관리' },
  { to: '/admin/prompts', label: '프롬프트 관리' },
  { to: '/admin/versions', label: '버전 관리' },
  { to: '/admin/audit-logs', label: '서비스 통계' },
]

function ProfileMenu() {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const displayName = user?.name ?? user?.email ?? 'admin@career.zip'
  const initial = displayName.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#AAAAAA]">{displayName}</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#08CB00] text-sm font-bold text-[#000000] hover:bg-[#05A000] transition-colors"
        >
          {initial}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-lg border border-[#334155] bg-[#1E293B] shadow-lg z-50">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#AAAAAA] hover:bg-[#334155] hover:text-[#EEEEEE] transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

export default function PrivateRoute() {
  // 토큰이 있으나 user 미hydrate(새로고침/직접진입) 시 /auth/me 로 staff 여부를 확정한다.
  const { status, user } = useEnsureMe()

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />
  }
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] text-[#AAAAAA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#253900] border-t-[#08CB00]" />
      </div>
    )
  }
  // 조회 실패 또는 관리자 권한 없음 → 관리자 로그인으로 차단
  if (status === 'error' || !user?.is_staff) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1120]">
      {/* Top navigation */}
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#334155] bg-[#0F172A] px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="rounded-md bg-[#08CB00] px-3 py-1.5">
            <span className="text-sm font-bold text-[#000000]">Career.zip</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative px-3 py-[14px] text-sm transition-colors ${isActive ? 'admin-nav-link-active' : 'admin-nav-link'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Profile + logout dropdown */}
        <ProfileMenu />
      </header>

      {/* Page content */}
      <main className="flex-1 px-10 py-8">
        <Outlet />
      </main>
    </div>
  )
}

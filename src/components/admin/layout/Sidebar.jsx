import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, MessageSquare, LogOut } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/admin/members', label: '회원 관리', icon: Users },
  { to: '/admin/prompts', label: '프롬프트 관리', icon: MessageSquare },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Career.zip Admin
        </span>
      </div>

      <div className="mx-4 h-px bg-slate-700/60" />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          메뉴
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              ].join(' ')
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-4 h-px bg-slate-700/60" />
      <div className="px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}

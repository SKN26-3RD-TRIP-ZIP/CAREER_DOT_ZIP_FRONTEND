import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/adminApi'
import { getMe } from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const setUser = useAuthStore((s) => s.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email, password })
      loginStore(data.access_token)
      const res = await getMe()
      if (!res.data.is_staff) {
        useAuthStore.getState().logout()
        setError('관리자 권한이 없습니다.')
        return
      }
      setUser(res.data)
      navigate('/admin/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.error ?? '로그인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
      <div className="w-full max-w-sm rounded-xl border border-[#334155] bg-[#1E293B] p-8 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-[#EEEEEE]">Career.zip</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#AAAAAA]">이메일</label>
            <input
              type="email"
              placeholder="admin@career.zip"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="rounded-md border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#AAAAAA]">비밀번호</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded-md border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
            />
          </div>

          {error && (
            <p className="rounded-md bg-[#1A0000] px-3 py-2 text-sm text-[#FF5555]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-md bg-[#08CB00] py-2.5 text-sm font-medium text-[#000000] hover:bg-[#05A000] disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)

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
      navigate('/admin/live/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.error ?? '로그인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEEEEE]">
      <div className="w-full max-w-sm rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-8 shadow-[0_18px_42px_rgba(0,0,0,0.14)]">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.52)]">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-[#000000]">Career.zip</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#253900]">이메일</label>
            <input
              type="email"
              placeholder="admin@career.zip"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="rounded-md border border-[rgba(0,0,0,0.12)] px-3 py-2 text-sm outline-none focus:border-[#08CB00]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#253900]">비밀번호</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded-md border border-[rgba(0,0,0,0.12)] px-3 py-2 text-sm outline-none focus:border-[#08CB00]"
            />
          </div>

          {error && (
            <p className="rounded-md bg-[rgba(0,0,0,0.06)] px-3 py-2 text-sm text-[#000000]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-md bg-[#253900] py-2.5 text-sm font-medium text-[#EEEEEE] hover:bg-[#000000] disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

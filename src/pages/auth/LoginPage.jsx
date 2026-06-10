import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/auth/login/', { email, password });
      const token = res.data?.access_token ?? res.data?.access;
      if (token) {
        localStorage.setItem('access_token', token);
      }
      navigate('/profile');
    } catch {
      // API 실패 시 데모 모드로 진행
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EEEEEE] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#253900]">Career.zip</h1>
          <p className="mt-2 text-sm text-slate-500">AI 모의면접 서비스</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#08CB00] py-2.5 text-sm font-semibold text-white hover:bg-[#06a800] disabled:opacity-50 transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            계정이 없으신가요?{' '}
            <span className="text-[#08CB00] font-semibold cursor-pointer">회원가입</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;

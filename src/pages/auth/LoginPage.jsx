import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      const token = res.data?.access_token;
      if (!token) {
        setError('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      setToken(token); // localStorage + store
      navigate('/profile');
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) {
        // 응답 자체가 없음 = 서버 다운/네트워크/CORS 차단
        setError('서버에 연결할 수 없습니다. 백엔드 실행/네트워크를 확인해주세요.');
      } else if (status === 403) {
        const msg = err.response?.data?.error || '';
        if (msg.includes('suspended')) setError('정지된 계정입니다. 관리자에게 문의하세요.');
        else setError('이메일 인증 후 로그인해 주세요. (가입 시 받은 인증 메일 확인)');
      } else if (status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (status === 400) {
        setError('필수 입력값을 확인해 주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">이메일</label>
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">비밀번호</label>
              <input type="password" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-[#08CB00] py-2.5 text-sm font-semibold text-white hover:bg-[#06a800] disabled:opacity-50 transition-colors">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Google 로그인: 미구현 → 비활성(준비 중) 처리. mock 성공 금지 */}
          <button type="button" disabled title="준비 중"
            className="mt-3 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed">
            Google로 계속하기 (준비 중)
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            계정이 없으신가요?{' '}
            <Link to="/auth/signup" className="text-[#08CB00] font-semibold">회원가입</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;

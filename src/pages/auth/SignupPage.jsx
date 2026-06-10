import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signup as signupApi } from '../../api/authApi';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signupApi({ email, name, password });
      setDone(true); // mock 성공 금지: 실제 201 일 때만 성공 처리
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('이미 가입된 이메일입니다.');
      else if (status === 400) setError('입력값을 확인해주세요. (비밀번호는 8자 이상)');
      else setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-[#EEEEEE] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 text-center">
          <h2 className="text-xl font-bold text-[#253900] mb-3">가입이 완료되었습니다 🎉</h2>
          <p className="text-sm text-slate-600">
            <strong>{email}</strong> 으로 인증 메일을 보냈습니다.<br />
            메일의 인증 링크를 눌러 인증을 완료한 뒤 로그인해주세요.
          </p>
          <Link to="/auth/login" className="inline-block mt-6 text-[#08CB00] font-semibold">로그인하러 가기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EEEEEE] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#253900]">Career.zip</h1>
          <p className="mt-2 text-sm text-slate-500">AI 모의면접 서비스</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">회원가입</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">이름</label>
              <input type="text" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">이메일</label>
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">비밀번호</label>
              <input type="password" minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#08CB00]"
                placeholder="8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-[#08CB00] py-2.5 text-sm font-semibold text-white hover:bg-[#06a800] disabled:opacity-50 transition-colors">
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            이미 계정이 있으신가요?{' '}
            <Link to="/auth/login" className="text-[#08CB00] font-semibold">로그인</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default SignupPage;

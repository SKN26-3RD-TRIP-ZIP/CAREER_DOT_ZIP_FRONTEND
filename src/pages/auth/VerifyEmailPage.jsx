import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../../api/authApi';

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('잘못된 인증 링크입니다.');
      return;
    }
    let active = true;
    verifyEmail(token)
      .then((res) => {
        if (!active) return;
        setState('success');
        setMessage(res.data?.message || '이메일 인증이 완료되었습니다.');
      })
      .catch((err) => {
        if (!active) return;
        setState('error');
        setMessage(err.response?.data?.detail || '유효하지 않거나 만료된 인증 링크입니다.');
      });
    return () => { active = false; };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#EEEEEE] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-[#253900] mb-4">이메일 인증</h1>
        {state === 'loading' && <p className="text-sm text-slate-500">인증 처리 중입니다...</p>}
        {state === 'success' && (
          <>
            <p className="text-sm text-slate-700">{message}</p>
            <Link to="/auth/login" className="inline-block mt-6 rounded-lg bg-[#08CB00] px-4 py-2.5 text-sm font-semibold text-white">
              로그인하러 가기
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <p className="text-sm text-red-600">{message}</p>
            <Link to="/auth/signup" className="inline-block mt-6 text-[#08CB00] font-semibold">다시 가입하기</Link>
          </>
        )}
      </div>
    </main>
  );
}

export default VerifyEmailPage;

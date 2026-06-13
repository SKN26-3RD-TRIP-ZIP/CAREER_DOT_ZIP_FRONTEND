import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyCode, resendVerification } from '../../api/authApi';

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');

  const [state, setState] = useState('idle'); // idle | verifying | success
  const [error, setError] = useState('');

  const [resendState, setResendState] = useState('idle'); // idle | sending
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (state === 'verifying') return;
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('6자리 숫자 인증번호를 입력해 주세요.');
      return;
    }
    setState('verifying');
    try {
      await verifyCode({ email: email.trim(), code: code.trim() });
      setState('success');
    } catch (err) {
      setState('idle');
      setError(err.response?.data?.detail || '인증번호가 올바르지 않습니다.');
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendState === 'sending') return;
    setResendState('sending');
    setResendMessage('');
    try {
      const res = await resendVerification(email.trim());
      setResendMessage(res.data?.message || '인증번호를 다시 보냈습니다. 메일함을 확인해 주세요.');
    } catch (err) {
      setResendMessage(
        err.response?.data?.detail || '재발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setResendState('idle');
    }
  };

  return (
    <main className="min-h-screen bg-[#EEEEEE] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-[#253900] mb-4">이메일 인증</h1>

        {state === 'success' ? (
          <>
            <p className="text-sm text-slate-700">이메일 인증이 완료되었습니다.</p>
            <Link
              to="/auth/login"
              className="inline-block mt-6 rounded-lg bg-[#08CB00] px-4 py-2.5 text-sm font-semibold text-white"
            >
              로그인하러 가기
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5">
              가입하신 이메일로 받은 <strong>6자리 인증번호</strong>를 입력해 주세요. (유효시간 5분)
            </p>
            <form onSubmit={handleVerify} className="text-left space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입한 이메일 주소"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">인증번호</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6자리 숫자"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.4em]"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={state === 'verifying'}
                className="w-full rounded-lg bg-[#08CB00] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {state === 'verifying' ? '확인 중...' : '인증 완료'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className="mt-3 text-xs text-[#08CB00] font-semibold disabled:opacity-60"
            >
              {resendState === 'sending' ? '발송 중...' : '인증번호 재발송'}
            </button>
            {resendMessage && <p className="mt-2 text-xs text-slate-600">{resendMessage}</p>}
          </>
        )}
      </div>
    </main>
  );
}

export default VerifyEmailPage;

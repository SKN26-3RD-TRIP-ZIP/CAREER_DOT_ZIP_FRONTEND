import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyCode, resendVerification } from '../../api/authApi';
import { Alert, AuthShell, Button, Field, inputClass } from '../../components/ui/DemoLayout';

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [resendState, setResendState] = useState('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (state === 'verifying') return;
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('6자리 숫자 인증번호를 입력해주세요.');
      return;
    }
    setState('verifying');
    try {
      await verifyCode({ email: email.trim(), code: code.trim() });
      setState('success');
    } catch (err) {
      setState('idle');
      setError(err.response?.data?.detail || '인증번호가 올바르지 않거나 만료되었습니다.');
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendState === 'sending') return;
    setResendState('sending');
    setResendMessage('');
    try {
      const res = await resendVerification(email.trim());
      setResendMessage(res.data?.message || '인증번호를 다시 보냈습니다. 메일함을 확인해주세요.');
    } catch (err) {
      setResendMessage(err.response?.data?.detail || '인증번호 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setResendState('idle');
    }
  };

  if (state === 'success') {
    return (
      <AuthShell title="이메일 인증 완료" description="이제 Career.zip에 로그인해 면접 준비를 시작할 수 있습니다.">
        <Button as={Link} to="/auth/login" className="w-full">
          로그인하러 가기
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="이메일 인증"
      description="가입한 이메일로 받은 6자리 인증번호를 입력해주세요. 인증 후 로그인할 수 있습니다."
      footer={
        <button
          type="button"
          onClick={handleResend}
          disabled={resendState === 'sending' || !email.trim()}
          className="font-semibold text-emerald-700 disabled:text-slate-400"
        >
          {resendState === 'sending' ? '재발송 중...' : '인증번호 재발송'}
        </button>
      }
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <Field label="이메일" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="가입한 이메일 주소"
            className={inputClass}
            required
          />
        </Field>
        <Field label="인증번호" hint="숫자 6자리만 입력됩니다." required>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className={`${inputClass} text-center text-lg tracking-widest`}
            required
          />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        {resendMessage && <Alert tone="info">{resendMessage}</Alert>}
        <Button type="submit" disabled={state === 'verifying'} className="w-full">
          {state === 'verifying' ? '확인 중...' : '인증 완료'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default VerifyEmailPage;

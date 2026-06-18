import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyCode, resendVerification, getMe } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { Alert, AuthShell, Button, Field, StepIndicator, inputClass } from '../../components/ui/DemoLayout';

const SIGNUP_STEPS = ['계정 정보', '약관 동의', '이메일 인증', '완료'];

function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || window.localStorage.getItem('careerzip_pending_signup_email') || '');
  const [code, setCode] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [resendState, setResendState] = useState('idle');
  // signup 화면에서 전달한 안내(예: "이미 가입 시도한 이메일입니다. 인증번호를 다시 보냈습니다.")를 노출한다.
  const [resendMessage, setResendMessage] = useState(location.state?.notice || '');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
      const res = await verifyCode({ email: email.trim(), code: code.trim() });
      const token = res.data?.access_token;
      if (token) {
        setToken(token);
        try {
          const me = await getMe();
          setUser(me.data);
        } catch {
          // 인증 API가 토큰만 반환한 경우에도 다음 화면으로 이동합니다.
        }
      }
      window.localStorage.removeItem('careerzip_pending_signup_email');
      navigate('/auth/signup/complete');
    } catch (err) {
      setState('idle');
      setError(err.response?.data?.detail || '인증번호가 올바르지 않거나 만료되었습니다.');
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendState === 'sending' || cooldown > 0) return;
    setResendState('sending');
    setResendMessage('');
    try {
      const res = await resendVerification(email.trim());
      setResendMessage(res.data?.message || '인증번호를 다시 보냈습니다. 메일함을 확인해주세요.');
      setCooldown(60);
    } catch (err) {
      setResendMessage(err.response?.data?.detail || '인증번호 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setResendState('idle');
    }
  };

  return (
    <AuthShell
      title="이메일을 인증해 주세요"
      description="가입한 이메일로 보낸 6자리 인증번호를 입력하세요. 인증번호는 10분간 유효합니다. 메일이 늦게 올 수 있어요(특히 Gmail). 도착이 늦으면 스팸함도 확인하고, 만료되면 아래에서 재전송해 주세요."
      footer={
        <Link to="/auth/signup" className="font-black text-[#253900]">
          계정 정보 다시 입력하기
        </Link>
      }
    >
      <StepIndicator steps={SIGNUP_STEPS} currentStep={3} />
      <form onSubmit={handleVerify} className="space-y-5">
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
        <Field label="인증번호" hint="숫자 6자리만 입력합니다." required>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className={`${inputClass} text-center text-2xl font-black tracking-[0.4em]`}
            required
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
          <span className="text-[rgba(0,0,0,0.6)]">
            {cooldown > 0
              ? `재발송까지 ${String(Math.floor(cooldown / 60)).padStart(2, '0')}:${String(cooldown % 60).padStart(2, '0')}`
              : '지금 재전송할 수 있어요'}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === 'sending' || !email.trim() || cooldown > 0}
            className="font-black text-[#253900] disabled:opacity-50"
          >
            {resendState === 'sending' ? '재발송 중...' : '인증번호 재전송'}
          </button>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        {resendMessage && <Alert tone="info">{resendMessage}</Alert>}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button as={Link} to="/auth/signup" variant="secondary">
            이전
          </Button>
          <Button type="submit" disabled={state === 'verifying'}>
            {state === 'verifying' ? '확인 중...' : '인증 완료'}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export default VerifyEmailPage;

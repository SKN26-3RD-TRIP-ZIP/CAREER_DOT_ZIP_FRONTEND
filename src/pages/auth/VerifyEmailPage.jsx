import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyCode, resendVerification } from '../../api/authApi';
import { Alert, AuthShell, Button, Field, StepIndicator, inputClass } from '../../components/ui/DemoLayout';

const SIGNUP_STEPS = ['계정 정보', '약관 동의', '이메일 인증', '완료'];
const DEFAULT_EXPIRES_IN = 600;
const DEFAULT_RESEND_COOLDOWN = 60;
const VERIFY_COMPLETE_NOTICE = '이메일 인증이 완료되었습니다. 로그인해 주세요.';
const GUIDE_TEXT =
  '가입한 이메일로 6자리 인증번호를 보냈습니다. 인증번호는 10분간 유효합니다. 메일이 보이지 않으면 스팸함을 확인하거나 인증번호를 재전송해 주세요.';

function asPositiveSeconds(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : fallback;
}

function mapVerifyError(err) {
  const code = err.response?.data?.code;
  const status = err.response?.status;

  if (code === 'VERIFY_TOO_MANY_ATTEMPTS' || status === 429) {
    return '인증 시도 횟수를 초과했습니다. 인증번호를 재전송해 주세요.';
  }
  if (code === 'VERIFY_CODE_EXPIRED') {
    return '인증번호가 만료되었습니다. 인증번호를 재전송해 주세요.';
  }
  if (code === 'VERIFY_CODE_INVALID' || status === 400) {
    return '인증번호가 올바르지 않습니다.';
  }
  if (status === 503) {
    return '인증 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }
  return '이메일 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

function mapResendError(err) {
  const code = err.response?.data?.code;
  const status = err.response?.status;

  if (code === 'RESEND_COOLDOWN' || status === 429) {
    return '잠시 후 다시 시도해 주세요.';
  }
  if (code === 'EMAIL_SEND_FAILED' || status === 503) {
    return '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (status === 400) {
    return '이메일 주소를 확인해 주세요.';
  }
  return '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialEmail = params.get('email') || window.localStorage.getItem('careerzip_pending_signup_email') || '';
  const initialNotice = location.state?.notice || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [verifyState, setVerifyState] = useState('idle');
  const [error, setError] = useState('');
  const [resendState, setResendState] = useState('idle');
  const [resendMessage, setResendMessage] = useState(initialNotice);
  const [expiresIn, setExpiresIn] = useState(
    asPositiveSeconds(location.state?.expiresIn ?? location.state?.expires_in, DEFAULT_EXPIRES_IN)
  );
  const [cooldown, setCooldown] = useState(
    asPositiveSeconds(location.state?.resendAfter ?? location.state?.resend_after, DEFAULT_RESEND_COOLDOWN)
  );

  const sanitizedCode = code.trim();
  const isVerifyReady = useMemo(
    () => Boolean(email.trim()) && /^\d{6}$/.test(sanitizedCode) && verifyState !== 'verifying',
    [email, sanitizedCode, verifyState]
  );

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const intervalId = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldown]);

  const handleCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (verifyState === 'verifying') return;

    setError('');
    setResendMessage('');
    if (!/^\d{6}$/.test(sanitizedCode)) {
      setError('6자리 숫자 인증번호를 입력해 주세요.');
      return;
    }

    setVerifyState('verifying');
    try {
      await verifyCode({ email: email.trim(), code: sanitizedCode });
      window.localStorage.removeItem('careerzip_pending_signup_email');
      navigate('/auth/login?verified=1', {
        replace: true,
        state: { notice: VERIFY_COMPLETE_NOTICE },
      });
    } catch (err) {
      setError(mapVerifyError(err));
      setVerifyState('idle');
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendState === 'sending' || cooldown > 0) return;

    setResendState('sending');
    setError('');
    setResendMessage('');
    try {
      const res = await resendVerification(email.trim());
      const nextCooldown = asPositiveSeconds(res.data?.resend_after, DEFAULT_RESEND_COOLDOWN);
      const nextExpiresIn = asPositiveSeconds(res.data?.expires_in, DEFAULT_EXPIRES_IN);
      setCode('');
      setCooldown(nextCooldown);
      setExpiresIn(nextExpiresIn);
      setResendMessage('인증번호를 다시 보냈습니다.');
    } catch (err) {
      const retryAfter = err.response?.data?.retry_after;
      if (retryAfter != null) {
        setCooldown(asPositiveSeconds(retryAfter, DEFAULT_RESEND_COOLDOWN));
      }
      setError(mapResendError(err));
    } finally {
      setResendState('idle');
    }
  };

  const resendButtonDisabled = resendState === 'sending' || !email.trim() || cooldown > 0;
  const resendButtonText =
    resendState === 'sending'
      ? '전송 중...'
      : cooldown > 0
        ? `${cooldown}초 후 재전송`
        : '인증번호 재전송';

  return (
    <AuthShell
      title="이메일을 인증해 주세요"
      description={GUIDE_TEXT}
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
            onChange={(event) => setEmail(event.target.value)}
            placeholder="가입한 이메일 주소"
            className={inputClass}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="인증번호" hint="숫자 6자리만 입력합니다." required>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            className={`${inputClass} text-center text-2xl font-black tracking-[0.35em]`}
            autoComplete="one-time-code"
            required
          />
        </Field>

        <div className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold leading-5 text-[rgba(0,0,0,0.62)]">
              인증번호 유효시간 {Math.floor(expiresIn / 60)}분
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendButtonDisabled}
              aria-disabled={resendButtonDisabled}
              aria-live="polite"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#253900] px-4 text-sm font-black text-[#253900] transition hover:bg-[rgba(37,57,0,0.08)] disabled:cursor-not-allowed disabled:border-[rgba(0,0,0,0.18)] disabled:text-[rgba(0,0,0,0.42)]"
            >
              {resendButtonText}
            </button>
          </div>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        {resendMessage && <Alert tone="info">{resendMessage}</Alert>}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button as={Link} to="/auth/signup" variant="secondary">
            이전
          </Button>
          <Button type="submit" disabled={!isVerifyReady}>
            {verifyState === 'verifying' ? '확인 중...' : '인증 완료'}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export default VerifyEmailPage;

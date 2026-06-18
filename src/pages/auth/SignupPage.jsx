import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup as signupApi } from '../../api/authApi';
import { Alert, AuthShell, Button, Field, StepIndicator, inputClass } from '../../components/ui/DemoLayout';

const SIGNUP_STEPS = ['계정 정보', '약관 동의', '이메일 인증', '완료'];

function getSignupError(err) {
  if (!err.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태와 네트워크를 확인해주세요.';
  const status = err.response.status;
  // 서버가 내려준 안내 메시지(문자열)를 우선 노출한다. (발송 실패/차단 안내 등)
  const serverMsg = err.response.data?.message || err.response.data?.error;
  const serverCode = err.response.data?.code;
  if (serverCode === 'EMAIL_SEND_FAILED' || status === 503) {
    return '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
  // 인증 완료된 계정만 409 로 막힌다. (미인증 계정은 2xx 로 재발송 처리됨)
  if (status === 409) return '이미 가입된 이메일입니다.';
  if (status === 403) return typeof serverMsg === 'string' ? serverMsg : '이용이 제한된 계정입니다. 관리자에게 문의해주세요.';
  if (status === 400) {
    // 서버 비밀번호 정책 위반 메시지를 우선 노출한다.
    const pwErr = err.response.data?.error?.password || err.response.data?.password;
    if (Array.isArray(pwErr) && pwErr.length) return pwErr.join(' ');
    return '입력값을 확인해주세요. 비밀번호는 8자 이상이며 영문·숫자·특수문자를 포함해야 합니다.';
  }
  return (typeof serverMsg === 'string' && serverMsg) || '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreeRequired, setAgreeRequired] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allRequiredAgreed = agreeRequired && agreePrivacy;

  // 백엔드 PasswordComplexityValidator 와 동일 규칙 (영문/숫자/특수문자 + 동일문자 3연속 금지)
  const passwordChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    noRepeat: !/(.)\1\1/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleAccountNext = (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid) {
      setError('비밀번호는 8자 이상이며 영문·숫자·특수문자를 모두 포함해야 합니다. (같은 문자 3연속 불가)');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    setError('');
    if (!allRequiredAgreed) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }
    setLoading(true);
    try {
      // 신규(201) / 미인증 기존 계정 재시도(200) 모두 2xx 로 내려오므로 인증 화면으로 이동한다.
      const res = await signupApi({ email, name, password });
      window.localStorage.setItem('careerzip_pending_signup_email', email);
      const notice = res?.data?.message || '';
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
        state: {
          notice,
          resendAfter: res?.data?.retry_after ?? res?.data?.resend_after,
          expiresIn: res?.data?.expires_in,
        },
      });
    } catch (err) {
      setError(getSignupError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? '계정 정보 입력' : '약관에 동의해 주세요'}
      description={step === 1 ? 'Career.zip에서 사용할 계정을 만들어요.' : '서비스 이용을 위해 필수 약관 동의가 필요해요.'}
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link to="/auth/login" className="font-black text-[#253900]">
            로그인
          </Link>
        </>
      }
    >
      <StepIndicator steps={SIGNUP_STEPS} currentStep={step} />
      {step === 1 ? (
        <form onSubmit={handleAccountNext} className="space-y-5">
          <Field label="이름" required>
            <input type="text" className={inputClass} placeholder="이름을 입력하세요" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="이메일" required>
            <input type="email" className={inputClass} placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="비밀번호" hint="8자 이상 · 영문/숫자/특수문자 포함" required>
            <input
              type="password"
              minLength={8}
              className={inputClass}
              placeholder="영문·숫자·특수문자 포함 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password.length > 0 && (
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-bold">
                {[
                  ['8자 이상', passwordChecks.length],
                  ['영문 포함', passwordChecks.letter],
                  ['숫자 포함', passwordChecks.digit],
                  ['특수문자 포함', passwordChecks.special],
                  ['같은 문자 3연속 없음', passwordChecks.noRepeat],
                ].map(([label, ok]) => (
                  <li key={label} className={ok ? 'text-[#08CB00]' : 'text-[rgba(0,0,0,0.4)]'}>
                    {ok ? '✓' : '•'} {label}
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="비밀번호 확인" required>
            <input
              type="password"
              minLength={8}
              className={inputClass}
              placeholder="비밀번호를 다시 입력하세요"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </Field>
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" className="w-full">
            다음
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <label className={`flex items-start gap-3 rounded-xl border p-4 transition ${allRequiredAgreed ? 'border-[#08CB00] bg-[rgba(8,203,0,0.08)]' : 'border-[rgba(0,0,0,0.15)] bg-[#EEEEEE]'}`}>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#08CB00]"
              checked={allRequiredAgreed && agreeMarketing}
              onChange={(e) => {
                setAgreeRequired(e.target.checked);
                setAgreePrivacy(e.target.checked);
                setAgreeMarketing(e.target.checked);
              }}
            />
            <span>
              <strong className="block text-[#253900]">약관 전체에 동의합니다</strong>
              <span className="mt-1 block text-sm leading-6">필수 약관과 선택 마케팅 수신 동의를 한 번에 설정합니다.</span>
            </span>
          </label>

          {[
            ['[필수] 이용약관 동의', agreeRequired, setAgreeRequired],
            ['[필수] 개인정보 수집·이용 동의', agreePrivacy, setAgreePrivacy],
            ['[선택] 마케팅 정보 수신 동의', agreeMarketing, setAgreeMarketing],
          ].map(([label, checked, setter]) => (
            <label key={label} className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-4 text-sm font-bold">
              <span>{label}</span>
              <input type="checkbox" className="h-4 w-4 accent-[#08CB00]" checked={checked} onChange={(e) => setter(e.target.checked)} />
            </label>
          ))}

          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading}>
              이전
            </Button>
            <Button type="button" onClick={handleSignup} disabled={loading || !allRequiredAgreed}>
              {loading ? '가입 중...' : '이메일 인증하기'}
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

export default SignupPage;

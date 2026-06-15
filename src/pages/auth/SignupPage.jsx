import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup as signupApi } from '../../api/authApi';
import { Alert, AuthShell, Button, Field, StepIndicator, inputClass } from '../../components/ui/DemoLayout';

const SIGNUP_STEPS = ['계정 정보', '약관 동의', '이메일 인증', '완료'];

function getSignupError(err) {
  const status = err.response?.status;
  if (!err.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태와 네트워크를 확인해주세요.';
  if (status === 409) return '이미 가입된 이메일입니다.';
  if (status === 400) return '입력값을 확인해주세요. 비밀번호는 8자 이상이어야 합니다.';
  return '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
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

  const handleAccountNext = (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.');
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
      await signupApi({ email, name, password });
      window.localStorage.setItem('careerzip_pending_signup_email', email);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
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
          <Field label="비밀번호" hint="영문과 숫자를 포함해 8자 이상 입력해주세요." required>
            <input
              type="password"
              minLength={8}
              className={inputClass}
              placeholder="영문·숫자 포함 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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

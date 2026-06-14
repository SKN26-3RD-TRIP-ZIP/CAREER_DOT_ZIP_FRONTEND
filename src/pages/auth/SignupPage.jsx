import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signup as signupApi } from '../../api/authApi';
import { Alert, AuthShell, Button, Field, inputClass } from '../../components/ui/DemoLayout';

function getSignupError(err) {
  const status = err.response?.status;
  if (!err.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태와 네트워크를 확인해주세요.';
  if (status === 409) return '이미 가입된 이메일입니다.';
  if (status === 400) return '입력값을 확인해주세요. 비밀번호는 8자 이상이어야 합니다.';
  return '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

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
      setDone(true);
    } catch (err) {
      setError(getSignupError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="회원가입 완료"
        description={`${email} 주소로 6자리 인증번호를 보냈습니다. 인증을 완료한 뒤 로그인해주세요.`}
        footer={
          <Link to="/auth/login" className="font-semibold text-emerald-700">
            이미 인증했다면 로그인하기
          </Link>
        }
      >
        <Button as={Link} to={`/verify-email?email=${encodeURIComponent(email)}`} className="w-full">
          인증번호 입력하러 가기
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="회원가입"
      description="이름, 이메일, 비밀번호를 입력하면 이메일 인증 단계로 이어집니다."
      footer={
        <>
          이미 계정이 있나요?{' '}
          <Link to="/auth/login" className="font-semibold text-emerald-700">
            로그인
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="이름" required>
          <input
            type="text"
            className={inputClass}
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="이메일" required>
          <input
            type="email"
            className={inputClass}
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="비밀번호" hint="8자 이상 입력해주세요." required>
          <input
            type="password"
            minLength={8}
            className={inputClass}
            placeholder="8자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '가입 중...' : '회원가입'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default SignupPage;

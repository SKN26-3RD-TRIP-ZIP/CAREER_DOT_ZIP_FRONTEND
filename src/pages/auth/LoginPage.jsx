import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi, getMe } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { Alert, AuthShell, Button, Field, inputClass } from '../../components/ui/DemoLayout';

function getLoginError(err) {
  const status = err.response?.status;
  const rawMessage = err.response?.data?.error || err.response?.data?.detail || '';

  if (!err.response) return '서버에 연결할 수 없습니다. 백엔드 실행 상태와 네트워크를 확인해주세요.';
  if (status === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (status === 403) {
    if (String(rawMessage).includes('suspended')) return '정지된 계정입니다. 관리자에게 문의해주세요.';
    return '이메일 인증이 필요합니다. 가입한 이메일에서 6자리 인증번호를 확인해주세요.';
  }
  if (status === 400) return '이메일과 비밀번호를 모두 입력해주세요.';
  return '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

function LoginPage() {
  const navigate = useNavigate();
  const reset = useAuthStore((s) => s.reset);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    reset();

    try {
      const res = await loginApi({ email, password });
      const token = res.data?.access_token;
      if (!token) {
        setError('로그인 응답에서 인증 토큰을 찾을 수 없습니다.');
        return;
      }
      setToken(token);
      const me = await getMe();
      setUser(me.data);
      navigate('/profile');
    } catch (err) {
      setError(getLoginError(err));
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="로그인"
      description="이메일 인증을 마친 계정으로 로그인하면 프로필과 면접 준비 흐름이 이어집니다."
      footer={
        <>
          계정이 없나요?{' '}
          <Link to="/auth/signup" className="font-semibold text-emerald-700">
            회원가입
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Field label="비밀번호" required>
          <input
            type="password"
            className={inputClass}
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;

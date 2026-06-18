import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
    return '이메일 인증이 필요합니다. 가입한 이메일의 6자리 인증번호를 확인해주세요.';
  }
  if (status === 400) return '이메일과 비밀번호를 모두 입력해주세요.';
  return '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

function FindPasswordView() {
  return (
    <AuthShell
      title="비밀번호 찾기"
      description="비밀번호 재설정 기능은 준비 중입니다. 빠른 시일 내 이메일 인증 기반 재설정을 제공할 예정입니다."
      footer={
        <Link to="/auth/login" className="font-black text-[#253900]">
          로그인으로 돌아가기
        </Link>
      }
    >
      <div className="space-y-4">
        <Field label="이메일">
          <input type="email" className={inputClass} placeholder="가입한 이메일을 입력하세요" />
        </Field>
        <Button type="button" disabled className="w-full">
          재설정 메일 보내기
        </Button>
        <Alert tone="info">현재 준비 중인 기능입니다. 발표용 흐름에서는 로그인 화면으로 돌아갈 수 있습니다.</Alert>
      </div>
    </AuthShell>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const mode = params.get('mode');
  const notice =
    location.state?.notice ||
    (params.get('verified') === '1'
      ? '이메일 인증이 완료되었습니다. 로그인해 주세요.'
      : params.get('session') === 'expired'
      ? '세션이 만료되어 다시 로그인해 주세요.'
      : params.get('logout') === '1'
        ? '로그아웃되었습니다.'
        : '');
  const reset = useAuthStore((s) => s.reset);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogin, setKeepLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (mode === 'find') return <FindPasswordView />;

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
      navigate('/mypage');
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
      description="Career.zip 계정으로 로그인하세요."
      footer={
        <>
          계정이 없으신가요?{' '}
          <Link to="/auth/signup" className="font-black text-[#253900]">
            회원가입
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {notice && <Alert tone="info">{notice}</Alert>}
        <Field label="이메일" required>
          <input
            type="email"
            className={inputClass}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="비밀번호" required>
          <input
            type="password"
            className={inputClass}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#08CB00]"
              checked={keepLogin}
              onChange={(e) => setKeepLogin(e.target.checked)}
            />
            로그인 상태 유지
          </label>
          <Link to="/auth/login?mode=find" className="font-black text-[#253900]">
            비밀번호 찾기
          </Link>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '로그인 중...' : error ? '다시 로그인' : '로그인'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;

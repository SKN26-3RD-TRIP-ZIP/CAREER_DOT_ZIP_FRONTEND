import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getMe, oauthExchange } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { resolveAuthedRedirect } from '../../utils/authNavigation';
import { OAUTH_PROVIDER_KEY, providerLabel, runOAuthExchange } from '../../utils/oauthFlow';
import { Alert, AuthShell, Button } from '../../components/ui/DemoLayout';

function clearOAuthSession() {
  sessionStorage.removeItem('careerzip_oauth_state');
  sessionStorage.removeItem('careerzip_oauth_next');
  sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
}

/**
 * Frontend OAuth callback. Backend 가 302 로 전달한 일회용 code 를 받아 토큰으로 교환한다.
 *  - URL 에는 code 또는 error 만 존재(토큰/state 없음)
 *  - exchange 성공: 기존 이메일 로그인과 동일하게 access token 저장 → next_path 이동
 *  - React StrictMode 에서도 exchange 가 두 번 호출되지 않도록 보호(processedRef + claimExchange)
 */
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reset = useAuthStore((s) => s.reset);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [error, setError] = useState('');
  const processedRef = useRef(false);

  const provider = (typeof window !== 'undefined' && sessionStorage.getItem(OAUTH_PROVIDER_KEY)) || '';
  const label = providerLabel(provider);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    (async () => {
      const result = await runOAuthExchange({
        params,
        provider,
        deps: {
          exchange: oauthExchange,
          getMe,
          reset,
          setToken,
          setUser,
          resolveAuthed: resolveAuthedRedirect,
        },
      });
      if (result.skipped) return;
      clearOAuthSession();
      if (result.ok) {
        navigate(result.redirect, { replace: true });
      } else {
        setError(result.error);
      }
    })();
    // 마운트 시 1회만 실행(파라미터는 진입 시점 값 사용). StrictMode 는 processedRef 로 보호.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AuthShell
        title="소셜 로그인"
        description={`${label} 로그인을 완료하지 못했습니다.`}
        footer={
          <Link to="/auth/login" className="font-black text-[#253900]">
            로그인 화면으로 돌아가기
          </Link>
        }
      >
        <div className="space-y-4">
          <Alert tone="danger">{error}</Alert>
          <Button as={Link} to="/auth/login" className="w-full">
            다시 로그인
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="소셜 로그인" description={`${label} 계정으로 로그인하는 중입니다…`}>
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EEEEEE] border-t-[#08CB00]" />
        <p className="text-sm font-bold text-[#253900]">잠시만 기다려 주세요.</p>
      </div>
    </AuthShell>
  );
}

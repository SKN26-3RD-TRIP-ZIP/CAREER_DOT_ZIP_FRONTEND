import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getMe, oauthCallback } from '../../api/authApi';
import { getErrorCode, toUserMessage } from '../../api/errors';
import { useAuthStore } from '../../store/authStore';
import { resolveAuthedRedirect } from '../../utils/authNavigation';
import { Alert, AuthShell, Button } from '../../components/ui/DemoLayout';
import { OAUTH_NEXT_KEY, OAUTH_STATE_KEY } from '../../components/auth/SocialLoginButtons';

const PROVIDER_LABEL = { google: 'Google', kakao: '카카오' };

function clearOAuthSession() {
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  sessionStorage.removeItem('careerzip_oauth_provider');
}

export default function OAuthCallbackPage() {
  const { provider } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reset = useAuthStore((s) => s.reset);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [error, setError] = useState('');
  const processedRef = useRef(false);

  const label = PROVIDER_LABEL[provider] || '소셜';

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const providerError = params.get('error');
    const errorDescription = params.get('error_description');
    const code = params.get('code');
    const state = params.get('state');

    // 1) 사용자가 제공자 화면에서 취소했거나 제공자 오류
    if (providerError) {
      clearOAuthSession();
      if (providerError === 'access_denied') {
        setError('소셜 로그인을 취소했습니다. 다시 시도하시려면 아래 버튼을 눌러 주세요.');
      } else {
        setError(errorDescription || `${label} 로그인 중 오류가 발생했습니다. 다시 시도해 주세요.`);
      }
      return;
    }

    // 2) code/state 누락
    if (!code || !state) {
      clearOAuthSession();
      setError('소셜 로그인 응답이 올바르지 않습니다. 다시 시도해 주세요.');
      return;
    }

    // 3) 클라이언트측 state 일치 검증(최종 검증은 백엔드 서명 검증)
    const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    if (savedState && savedState !== state) {
      clearOAuthSession();
      setError('로그인 요청이 변조되었거나 만료되었습니다. 다시 시도해 주세요.');
      return;
    }

    const savedNext = sessionStorage.getItem(OAUTH_NEXT_KEY) || '';
    let active = true;

    (async () => {
      try {
        // 직전 계정 잔존 상태 제거 후 새 토큰 저장
        reset();
        const { data } = await oauthCallback(provider, { code, state });
        if (!data?.access_token) throw new Error('no access token');
        setToken(data.access_token);

        const me = await getMe();
        if (!active) return;
        setUser(me.data);
        clearOAuthSession();
        navigate(resolveAuthedRedirect(me.data, savedNext || data.next_path), { replace: true });
      } catch (err) {
        if (!active) return;
        reset();
        clearOAuthSession();
        const code2 = getErrorCode(err);
        if (code2 === 'OAUTH_EMAIL_REQUIRED') {
          setError('이메일 제공에 동의해야 가입할 수 있습니다. 카카오 계정의 이메일 제공 동의 후 다시 시도해 주세요.');
        } else if (code2 === 'OAUTH_ACCOUNT_BLOCKED') {
          setError('이 계정으로는 소셜 로그인을 할 수 없습니다. (탈퇴 또는 정지된 계정)');
        } else {
          setError(toUserMessage(err, `${label} 로그인에 실패했습니다. 다시 시도해 주세요.`));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [params, provider, navigate, reset, setToken, setUser, label]);

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

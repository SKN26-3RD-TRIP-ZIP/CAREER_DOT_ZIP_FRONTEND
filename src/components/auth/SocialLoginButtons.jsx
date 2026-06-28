import { useState } from 'react';
import { oauthStart } from '../../api/authApi';
import { isEnvRequired, toUserMessage } from '../../api/errors';
import { isProviderEnabled, mapOAuthError, OAUTH_PROVIDER_KEY, DEFAULT_OAUTH_NEXT } from '../../utils/oauthFlow';
import { Alert } from '../ui/DemoLayout';

const OAUTH_STATE_KEY = 'careerzip_oauth_state';
const OAUTH_NEXT_KEY = 'careerzip_oauth_next';

const PROVIDERS = [
  {
    key: 'google',
    loginLabel: 'Google로 계속하기',
    signupLabel: 'Google로 간편회원가입',
    enabled: isProviderEnabled(import.meta.env.VITE_GOOGLE_OAUTH_ENABLED),
    className: 'border-[rgba(0,0,0,0.18)] bg-white text-[#000000] hover:bg-[#F5F5F5]',
  },
  {
    key: 'kakao',
    loginLabel: '카카오로 계속하기',
    signupLabel: '카카오로 간편회원가입',
    enabled: isProviderEnabled(import.meta.env.VITE_KAKAO_OAUTH_ENABLED),
    className: 'border-[#FDDC3F] bg-[#FEE500] text-[#191600] hover:brightness-95',
  },
];

/**
 * 소셜 로그인/간편가입 버튼 (Google / Kakao). 로그인·회원가입이 같은 OAuth 시작 흐름을 공유한다.
 *  - 클릭 → GET /auth/oauth/{provider}/start → provider 인가 URL 로 이동
 *  - mode='signup' 이면 버튼 문구만 '간편회원가입' 으로 바뀐다(중복 함수 없음)
 *  - 503 ENV_REQUIRED → "준비 중" 안내(Mock 성공으로 처리하지 않음). Kakao 미설정은 전용 안내.
 *
 * @param {string} [next]  인증 완료 후 이동 경로(기본 /mypage)
 * @param {'login'|'signup'} [mode]
 */
export default function SocialLoginButtons({ next, mode = 'login' }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleStart = async (provider) => {
    setError('');
    setNotice('');
    setBusy(provider);
    const dest = next || DEFAULT_OAUTH_NEXT;
    try {
      const { data } = await oauthStart(provider, dest, mode);
      sessionStorage.setItem(OAUTH_STATE_KEY, data?.state || '');
      sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
      sessionStorage.setItem(OAUTH_NEXT_KEY, dest);
      if (!data?.auth_url) {
        throw new Error('authorization url missing');
      }
      window.location.assign(data.auth_url);
    } catch (err) {
      if (isEnvRequired(err)) {
        // Provider 미설정(503). Kakao 는 전용 안내, Google 은 일반 준비 중 안내.
        setNotice(mapOAuthError('OAUTH_PROVIDER_NOT_CONFIGURED', provider));
      } else {
        setError(toUserMessage(err, '소셜 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.'));
      }
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[rgba(0,0,0,0.12)]" />
        <span className="text-xs font-bold text-[rgba(0,0,0,0.45)]">또는</span>
        <span className="h-px flex-1 bg-[rgba(0,0,0,0.12)]" />
      </div>
      {PROVIDERS.map((p) => (
        <button
          key={p.key}
          type="button"
          data-provider={p.key}
          disabled={!p.enabled || busy !== null}
          onClick={() => handleStart(p.key)}
          className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${p.className}`}
        >
          {busy === p.key
            ? '연결 중…'
            : p.enabled
            ? mode === 'signup'
              ? p.signupLabel
              : p.loginLabel
            : `${mode === 'signup' ? p.signupLabel : p.loginLabel} (준비 중)`}
        </button>
      ))}
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

export { OAUTH_STATE_KEY, OAUTH_NEXT_KEY, OAUTH_PROVIDER_KEY };

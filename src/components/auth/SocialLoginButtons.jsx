import { useState } from 'react';
import { oauthStart } from '../../api/authApi';
import { isEnvRequired, toUserMessage } from '../../api/errors';
import { Alert } from '../ui/DemoLayout';

const OAUTH_STATE_KEY = 'careerzip_oauth_state';
const OAUTH_PROVIDER_KEY = 'careerzip_oauth_provider';
const OAUTH_NEXT_KEY = 'careerzip_oauth_next';

// VITE_*_OAUTH_ENABLED 가 명시적으로 'false' 면 버튼 비활성(준비 중) 처리.
function isProviderEnabled(flag) {
  return String(flag ?? 'true').toLowerCase() !== 'false';
}

const PROVIDERS = [
  {
    key: 'google',
    label: 'Google로 계속하기',
    enabled: isProviderEnabled(import.meta.env.VITE_GOOGLE_OAUTH_ENABLED),
    className: 'border-[rgba(0,0,0,0.18)] bg-white text-[#000000] hover:bg-[#F5F5F5]',
  },
  {
    key: 'kakao',
    label: '카카오로 계속하기',
    enabled: isProviderEnabled(import.meta.env.VITE_KAKAO_OAUTH_ENABLED),
    className: 'border-[#FDDC3F] bg-[#FEE500] text-[#191600] hover:brightness-95',
  },
];

/**
 * 소셜 로그인 시작 버튼 (Google / Kakao).
 *  - 클릭 → GET /auth/oauth/{provider}/start → state 보관 → provider 인가 URL 로 이동
 *  - 503 ENV_REQUIRED → "준비 중" 안내(Mock 성공으로 처리하지 않음)
 *  - 기타 오류 → 메시지 + 재시도 가능
 */
export default function SocialLoginButtons({ next }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleStart = async (provider) => {
    setError('');
    setNotice('');
    setBusy(provider);
    try {
      const { data } = await oauthStart(provider, next);
      // 콜백에서 클라이언트측 state 일치 검증/원래 경로 복원을 위해 보관
      sessionStorage.setItem(OAUTH_STATE_KEY, data?.state || '');
      sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
      sessionStorage.setItem(OAUTH_NEXT_KEY, next || data?.next_path || '');
      if (!data?.auth_url) {
        throw new Error('authorization url missing');
      }
      window.location.assign(data.auth_url);
    } catch (err) {
      if (isEnvRequired(err)) {
        setNotice(
          `${provider === 'google' ? 'Google' : '카카오'} 로그인은 현재 설정 준비 중입니다. 이메일 로그인을 이용해 주세요.`
        );
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
          disabled={!p.enabled || busy !== null}
          onClick={() => handleStart(p.key)}
          className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${p.className}`}
        >
          {busy === p.key ? '연결 중…' : p.enabled ? p.label : `${p.label} (준비 중)`}
        </button>
      ))}
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

export { OAUTH_STATE_KEY, OAUTH_PROVIDER_KEY, OAUTH_NEXT_KEY };

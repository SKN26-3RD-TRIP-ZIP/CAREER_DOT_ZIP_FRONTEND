import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/authApi';

/**
 * 토큰이 있으나 user(=GET /auth/me)가 아직 hydrate 되지 않았으면 1회 조회한다.
 *
 * user 는 zustand 메모리에만 존재하므로 새로고침/직접진입 시 null 이다.
 * 이때 localStorage 의 mock/가짜 상태로 인증을 가정하지 않고, 실제 JWT 로
 * /auth/me 를 호출해 서버 기준 사용자 정보를 단일 출처로 사용한다.
 *
 * @returns {{ status: 'loading'|'ready'|'error'|'unauthenticated', user: object|null, retry: () => void }}
 */
export function useEnsureMe() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [status, setStatus] = useState(() => {
    if (!token) return 'unauthenticated';
    return user ? 'ready' : 'loading';
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus('unauthenticated');
      return undefined;
    }
    if (user) {
      setStatus('ready');
      return undefined;
    }

    // StrictMode 는 개발 모드에서 setup→cleanup→setup 을 동기적으로 한 번 더 실행한다.
    // 이전에는 inFlight ref 로 두 번째 setup 을 건너뛰었는데, 그러면 실제로 살아남는
    // 요청은 "취소된"(active=false) 첫 번째 setup 의 것뿐이라 결과가 영구히 버려져
    // 로딩 스피너가 멈추지 않았다. active 플래그만으로 취소를 판단하고, 각 setup 이
    // 자신만의 요청을 독립적으로 처리하게 한다(개발 모드에서만 요청이 1회 더 발생).
    let active = true;
    setStatus('loading');

    getMe()
      .then((res) => {
        if (!active) return;
        setUser(res.data);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        // 401 → axios interceptor 가 refresh 시도 후 실패 시 로그아웃/리다이렉트 처리.
        // 그 외(네트워크/5xx) → error 로 두어 재시도 UI 노출.
        setStatus(err?.response?.status === 401 ? 'unauthenticated' : 'error');
      });

    return () => {
      active = false;
    };
  }, [token, user, setUser, attempt]);

  const retry = () => setAttempt((n) => n + 1);
  return { status, user, retry };
}

export default useEnsureMe;

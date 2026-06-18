import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// 기본값은 localhost 로 통일한다. 프론트(localhost:5173)와 API host 를 맞춰야
// refresh_token(SameSite=Lax) 쿠키가 cross-site 로 차단되지 않는다. (127.0.0.1 과 혼용 금지)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // refresh token(HttpOnly cookie) 송수신을 위해 필수
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/token/refresh',
  '/auth/verify-email',
  '/auth/resend-verification',
];

let refreshPromise = null;
let redirectingToLogin = false;
let authFailureHandled = false;

function normalizePath(url = '') {
  try {
    const parsed = new URL(url, API_BASE_URL);
    return parsed.pathname.replace(/^\/api\/v1/, '') || '/';
  } catch {
    return url;
  }
}

function isPublicEndpoint(url = '') {
  const path = normalizePath(url).replace(/\/$/, '');
  return PUBLIC_ENDPOINTS.some((endpoint) => path === endpoint || path.startsWith(`${endpoint}/`));
}

function clearAuthAndRedirect() {
  if (authFailureHandled) return;
  authFailureHandled = true;
  useAuthStore.getState().logout();
  if (typeof window === 'undefined' || redirectingToLogin) return;
  redirectingToLogin = true;
  window.location.assign('/auth/login?session=expired');
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axiosInstance
      .post('/auth/token/refresh')
      .then((res) => {
        const newToken = res.data?.access_token;
        if (!newToken) throw new Error('Token refresh response has no access token.');
        useAuthStore.getState().setToken(newToken);
        authFailureHandled = false;
        redirectingToLogin = false;
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// 요청 시 access token 을 Authorization 헤더로 첨부
axiosInstance.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (isPublicEndpoint(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// refresh 자체/인증 엔드포인트는 자동 refresh 대상에서 제외
const SKIP_REFRESH = PUBLIC_ENDPOINTS;

// 401 → refresh 1회 시도 → 실패 시 로그아웃 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || '';

    if (status === 401 && !original._retry && !SKIP_REFRESH.some((p) => normalizePath(url).startsWith(p))) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        // refresh 실패 → 로그아웃
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

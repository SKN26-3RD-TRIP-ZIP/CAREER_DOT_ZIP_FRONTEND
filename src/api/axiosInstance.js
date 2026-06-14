import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // refresh token(HttpOnly cookie) 송수신을 위해 필수
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 시 access token 을 Authorization 헤더로 첨부
axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// refresh 자체/인증 엔드포인트는 자동 refresh 대상에서 제외
const SKIP_REFRESH = ['/auth/login', '/auth/signup', '/auth/token/refresh', '/auth/verify-email'];

// 401 → refresh 1회 시도 → 실패 시 로그아웃 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || '';

    if (status === 401 && !original._retry && !SKIP_REFRESH.some((p) => url.includes(p))) {
      original._retry = true;
      try {
        const res = await axiosInstance.post('/auth/token/refresh');
        const newToken = res.data?.access_token;
        if (newToken) {
          localStorage.setItem('access_token', newToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(original);
        }
      } catch (refreshError) {
        // refresh 실패 → 로그아웃
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          window.location.assign('/auth/login?session=expired');
        }
        return Promise.reject(refreshError);
      }
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

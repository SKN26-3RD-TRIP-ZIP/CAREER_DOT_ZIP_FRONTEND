import axiosInstance from './axiosInstance';

// BE 라우트는 끝 슬래시가 없다: /auth/signup, /auth/login, /auth/verify-email, /auth/logout, /auth/me
export const signup = ({ email, name, password }) =>
  axiosInstance.post('/auth/signup', { email, name, password });

export const login = ({ email, password }) =>
  axiosInstance.post('/auth/login', { email, password });

// 6자리 인증번호 검증 (POST /auth/verify-email { email, code })
export const verifyCode = ({ email, code }) =>
  axiosInstance.post('/auth/verify-email', { email, code });

// 이메일 인증번호 재발송 (성공: expires_in/resend_after, 쿨다운: retry_after, 발송 실패: EMAIL_SEND_FAILED)
export const resendVerification = (email) =>
  axiosInstance.post('/auth/resend-verification', { email });

// 현재 로그인 사용자 조회 — 화면 표시 사용자의 단일 출처
export const getMe = () => axiosInstance.get('/auth/me');

export const logout = () => axiosInstance.post('/auth/logout');

export default { signup, login, verifyCode, resendVerification, getMe, logout };

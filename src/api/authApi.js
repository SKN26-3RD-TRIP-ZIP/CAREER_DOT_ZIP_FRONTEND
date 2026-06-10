import axiosInstance from './axiosInstance';

// BE 라우트는 끝 슬래시가 없다: /auth/signup, /auth/login, /auth/verify-email, /auth/logout
export const signup = ({ email, name, password }) =>
  axiosInstance.post('/auth/signup', { email, name, password });

export const login = ({ email, password }) =>
  axiosInstance.post('/auth/login', { email, password });

export const verifyEmail = (token) =>
  axiosInstance.get('/auth/verify-email', { params: { token } });

export const logout = () => axiosInstance.post('/auth/logout');

export default { signup, login, verifyEmail, logout };

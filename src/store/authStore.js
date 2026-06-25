import { create } from 'zustand'

const TOKEN_KEY = 'access_token'
const CLIENT_STORAGE_KEYS = [
  'userDocuments',
  'userProfile',
  'careerzip_pending_signup_email',
  'careerzip_selected_jd_id',
  'careerzip_temp_jd_id',
  'careerzip_selected_resume_id',
  'careerzip_selected_cover_letter_id',
  'careerzip_selected_project_ids',
]

// 계정 전환/로그아웃 시 정리할 localStorage 키 (이전 사용자 잔존 방지)
function clearClientAuth() {
  localStorage.removeItem(TOKEN_KEY)
  CLIENT_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  Object.keys(localStorage)
    .filter((key) => key.startsWith('careerzip:draft:'))
    .forEach((key) => localStorage.removeItem(key))
}

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null, // 현재 사용자(= GET /auth/me 응답). 화면 표시 사용자의 단일 출처

  // 로그인 직전 호출: 이전 계정 token/user 완전 제거
  reset: () => {
    clearClientAuth()
    set({ token: null, user: null })
  },

  setToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    set({ token })
  },

  setUser: (user) => set({ user }),

  // 서버 logout 성공/실패와 무관하게 클라이언트 상태 초기화
  logout: () => {
    clearClientAuth()
    set({ token: null, user: null })
  },

  // 하위호환(기존 login(token) 호출부)
  login: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    set({ token })
  },
}))

import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('access_token'),

  login: (token) => {
    localStorage.setItem('access_token', token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null })
  },
}))

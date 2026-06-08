import { create } from 'zustand';

export const useJdStore = create((set) => ({
  jdId: null,
  jdData: null,
  setJd: (jdId, jdData) => set({ jdId, jdData }),
  resetJd: () => set({ jdId: null, jdData: null }),
}));

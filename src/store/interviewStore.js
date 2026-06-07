import { create } from 'zustand';

export const useInterviewStore = create((set) => ({
  sessionId: '',
  questions: [],
  currentQuestionIndex: 0,
  followupQuestion: null,

  setSessionId: (sessionId) => set({ sessionId }),
  setQuestions: (questions) => set({ questions }),
  setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),
  setFollowupQuestion: (followupQuestion) => set({ followupQuestion }),

  moveNextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
      followupQuestion: null
    })),

  resetInterview: () =>
    set({
      sessionId: '',
      questions: [],
      currentQuestionIndex: 0,
      followupQuestion: null
    })
}));

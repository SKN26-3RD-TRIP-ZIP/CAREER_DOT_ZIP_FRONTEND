import axiosInstance from './axiosInstance';

export const interviewApi = {
  createSession: async (payload) => {
    const response = await axiosInstance.post('/sessions', payload);
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await axiosInstance.get(`/sessions/${sessionId}`);
    return response.data;
  },

  updateSessionStatus: async (sessionId, status) => {
    const response = await axiosInstance.patch(`/sessions/${sessionId}/status`, { status });
    return response.data;
  },

  generateQuestions: async (sessionId, payload) => {
    const response = await axiosInstance.post(`/sessions/${sessionId}/questions/generate`, payload);
    return response.data;
  },

  getQuestions: async (sessionId) => {
    const response = await axiosInstance.get(`/sessions/${sessionId}/questions`);
    return response.data;
  },

  submitAnswer: async (payload) => {
    const response = await axiosInstance.post('/answers', payload);
    return response.data;
  },

  patchSttResult: async (answerId, payload) => {
    const response = await axiosInstance.patch(`/answers/${answerId}/stt`, payload);
    return response.data;
  },

  generateFollowup: async (answerId) => {
    const response = await axiosInstance.post(`/answers/${answerId}/followup`);
    return response.data;
  }
};

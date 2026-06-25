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

  transcribeAudio: async (formData) => {
    const response = await axiosInstance.post('/stt/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  synthesizeSpeech: async (payload) => {
    const response = await axiosInstance.post('/tts/speech', payload, {
      responseType: 'blob'
    });
    return {
      audioBlob: response.data,
      model: response.headers?.['x-tts-model'],
      voice: response.headers?.['x-tts-voice'],
      persona: response.headers?.['x-tts-persona']
    };
  },

  generateFollowup: async (answerId) => {
    const response = await axiosInstance.post(`/answers/${answerId}/followup`);
    return response.data;
  },

  getSessionReport: async (sessionId) => {
    const response = await axiosInstance.get(`/sessions/${sessionId}/report`);
    return response.data;
  }
};

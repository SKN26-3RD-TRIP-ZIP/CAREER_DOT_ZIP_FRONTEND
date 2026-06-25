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
    // STT가 끝난 텍스트를 기존 답변 생성 API에 먼저 저장한다.
    const response = await axiosInstance.post('/answers', payload);
    return response.data;
  },

  patchSttResult: async (answerId, payload) => {
    // 답변 생성 후 STT 원문과 pause 분석값을 같은 answer에 보강 저장한다.
    const response = await axiosInstance.patch(`/answers/${answerId}/stt`, payload);
    return response.data;
  },

  transcribeAudio: async (formData) => {
    // MediaRecorder가 만든 webm blob은 multipart/form-data로 Whisper STT API에 보낸다.
    const response = await axiosInstance.post('/stt/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  synthesizeSpeech: async (payload) => {
    // 백엔드 TTS 응답은 JSON이 아니라 mp3 blob이므로 responseType을 blob으로 받는다.
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
    // 저장된 답변을 기준으로 충분성 판단/꼬리질문 생성을 요청한다.
    const response = await axiosInstance.post(`/answers/${answerId}/followup`);
    return response.data;
  },

  getSessionReport: async (sessionId) => {
    const response = await axiosInstance.get(`/sessions/${sessionId}/report`);
    return response.data;
  }
};

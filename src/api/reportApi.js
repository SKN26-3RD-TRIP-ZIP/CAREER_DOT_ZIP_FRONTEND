import axiosInstance from './axiosInstance';
import { mockFinalReport, mockGrowthTrend, mockRoadmap, mockFeedback } from './reportMock';

/**
 * Evaluation / Report API.
 * 기존 axiosInstance(baseURL: VITE_API_BASE_URL || http://127.0.0.1:8000/api/v1) 사용.
 * VITE_USE_MOCK=true 이면 네트워크 없이 목업 픽스처를 반환합니다.
 */
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'false').toLowerCase() === 'true';

const delay = (data, ms = 300) => new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const reportApi = {
  // 최종 리포트 (summary). 기존 interviewApi.getSessionReport 와 동일 엔드포인트.
  getFinalReport: async (sessionId) => {
    if (USE_MOCK) return delay({ ...mockFinalReport, session_id: sessionId });
    const res = await axiosInstance.get(`/sessions/${sessionId}/report`);
    return res.data;
  },

  // 성장 추이 (mypage overall_score 이력)
  getGrowthTrend: async () => {
    if (USE_MOCK) return delay(mockGrowthTrend);
    const res = await axiosInstance.get('/mypage/growth');
    return res.data;
  },

  // Next Learning Roadmap (※ 백엔드 신규 API 협의 필요)
  getRoadmap: async (sessionId) => {
    if (USE_MOCK) return delay(mockRoadmap);
    const res = await axiosInstance.get(`/sessions/${sessionId}/roadmap`);
    return res.data;
  },

  // 면접관 피드백
  getInterviewerFeedback: async (sessionId) => {
    if (USE_MOCK) return delay(mockFeedback);
    const res = await axiosInstance.get(`/sessions/${sessionId}/feedback`);
    return res.data;
  },

  // FinalReport 생성 — 성공 시 201
  createFinalReport: async (sessionId) => {
    if (USE_MOCK) return delay(mockFinalReport);
    const res = await axiosInstance.post(`/sessions/${sessionId}/report`);
    return res.data;
  },
};

import axios from 'axios';
import axiosInstance from './axiosInstance';
import { normalizeFinalReport } from './reportAdapter';
import {
  mockFinalReportResponse,
  mockGrowthTrend,
  mockRoadmap,
  mockFeedback,
} from './reportMock';

// 공유 리포트 조회용 — 인증 헤더 없는 별도 인스턴스
const publicAxios = axios.create({
  baseURL: axiosInstance.defaults.baseURL,
});

/**
 * Evaluation / Report API.
 * 기존 axiosInstance(baseURL: VITE_API_BASE_URL || http://127.0.0.1:8000/api/v1) 사용.
 * VITE_USE_MOCK=true 이면 네트워크 없이 목업(실응답 동형)을 반환합니다.
 *
 * getFinalReport 는 백엔드 raw 응답을 normalizeFinalReport 로 정규화해 UI 형태로 돌려줍니다.
 * (UI 컴포넌트는 백엔드 summary 구조 변경에 영향받지 않음)
 */
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'false').toLowerCase() === 'true';

const delay = (data, ms = 300) => new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const reportApi = {
  // 최종 리포트 — GET /sessions/{id}/report (SessionFinalReportView)
  getFinalReport: async (sessionId) => {
    if (USE_MOCK) {
      const raw = { ...mockFinalReportResponse, session_id: sessionId };
      return normalizeFinalReport(await delay(raw));
    }
    const res = await axiosInstance.get(`/sessions/${sessionId}/report`);
    return normalizeFinalReport(res.data);
  },

  // FinalReport 생성 — POST /reports/sessions/{id}/generate (성공 시 201)
  createFinalReport: async (sessionId) => {
    if (USE_MOCK) return normalizeFinalReport(await delay(mockFinalReportResponse));
    const res = await axiosInstance.post(`/reports/sessions/${sessionId}/generate`);
    return normalizeFinalReport(res.data);
  },

  // ── 공유 링크 ─────────────────────────────────────────────
  // POST /reports/sessions/{id}/share-link → { share_url, expires_at, created }
  createShareLink: async (sessionId) => {
    const res = await axiosInstance.post(`/reports/sessions/${sessionId}/share-link`);
    return res.data;
  },

  // GET /reports/share/{token}/ → summary raw (normalizeFinalReport로 정규화)
  // 인증 불필요이므로 publicAxios 사용
  getSharedReport: async (token) => {
    if (USE_MOCK) {
      const raw = { ...mockFinalReportResponse, session_id: 'shared' };
      return normalizeFinalReport(await delay(raw));
    }
    const res = await publicAxios.get(`/reports/share/${token}/`);
    // 백엔드 응답: { report_id, session_id, generated_at, summary, expires_at }
    // normalizeFinalReport는 raw.summary를 기대하므로 그대로 전달
    return { normalized: normalizeFinalReport(res.data), expires_at: res.data.expires_at };
  },

  // ── 고도화(보류) ───────────────────────────────────────────
  getGrowthTrend: async () => {
    if (USE_MOCK) return delay(mockGrowthTrend);
    const res = await axiosInstance.get('/mypage/growth');
    return res.data;
  },
  getRoadmap: async (sessionId) => {
    if (USE_MOCK) return delay(mockRoadmap);
    const res = await axiosInstance.get(`/sessions/${sessionId}/roadmap`);
    return res.data;
  },
  getInterviewerFeedback: async (sessionId) => {
    if (USE_MOCK) return delay(mockFeedback);
    const res = await axiosInstance.get(`/sessions/${sessionId}/feedback`);
    return res.data;
  },
};

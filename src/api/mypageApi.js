import axiosInstance from './axiosInstance';

export const getMySummary = async () => {
  const response = await axiosInstance.get('/users/me/summary');
  return response.data;
};

export const mypageApi = {
  // 현재 로그인 사용자의 면접 기록 (BE: GET /api/v1/mypage/interviews, request.user 기준)
  getInterviewHistory: async (params = {}) => {
    const response = await axiosInstance.get('/mypage/interviews', { params });
    return response.data; // { total, results: [...] }
  },
  // 현재 로그인 사용자의 리포트 목록 (BE: GET /api/v1/reports, session__user 기준)
  getReportList: async () => {
    const response = await axiosInstance.get('/reports');
    return response.data; // { total, results: [...] }
  },
  // 마이페이지 요약 집계 (BE: GET /api/v1/users/me/summary)
  getSummary: getMySummary,
  getMySummary,
  getPointBalance: async () => {
    const response = await axiosInstance.get('/users/me/points');
    return response.data;
  },
  getInterviewSessionStartPointPolicy: async () => {
    const response = await axiosInstance.get('/users/me/points/policies/interview-session-start');
    return response.data;
  },
  getPointHistory: async (params = {}) => {
    const response = await axiosInstance.get('/users/me/points/history', { params });
    return response.data;
  },
};

export default mypageApi;

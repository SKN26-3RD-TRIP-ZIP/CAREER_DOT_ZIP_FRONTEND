import axiosInstance from './axiosInstance';

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
};

export default mypageApi;

import axiosInstance from './axiosInstance';

// 사람인 미승인 대응 Mock 채용공고 API 클라이언트.
// BE: GET /api/v1/external/jobs (목록/검색/필터/페이징/정렬), GET /api/v1/external/jobs/:job_id (상세)
// 응답에는 source="MOCK" 가 포함됨 → UI 에서 "샘플(MOCK) 데이터" 배지 표기 권장.

export const jobsApi = {
  // params: { q, company, position, tech, region, career_type, employment_type, sort, page, size }
  searchJobs: async (params = {}) => {
    const response = await axiosInstance.get('/external/jobs', { params });
    return response.data; // { source, total, page, size, results: [...] }
  },

  getJob: async (jobId) => {
    const response = await axiosInstance.get(`/external/jobs/${jobId}`);
    return response.data; // 단일 job
  },

  // 선택한 Mock 공고를 JD 원문으로 저장 → 면접 세션 생성에 사용.
  // 기존 BE: POST /api/v1/jds { company_name, position, original_text, input_method }
  saveJobAsJd: async (job) => {
    const originalText = [
      job.job_description,
      job.requirements ? `\n[자격요건]\n${job.requirements}` : '',
      job.preferred ? `\n[우대사항]\n${job.preferred}` : '',
      job.tech_stack?.length ? `\n[기술스택]\n${job.tech_stack.join(', ')}` : '',
    ].join('');

    const payload = {
      company_name: job.company_name,
      position: job.position,
      original_text: originalText.trim(),
      input_method: 'TEXT', // Mock 출처. 사람인 승인 후 'URL' 등으로 전환 가능
    };
    const response = await axiosInstance.post('/jds', payload);
    return response.data; // 생성된 JD
  },
};

export default jobsApi;

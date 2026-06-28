import axiosInstance from './axiosInstance';

// 사람인 미승인 대응 Career.zip 합성 Mock 채용공고 API 클라이언트.
// 실제 사람인 공고가 아니며, 응답에는 source="CAREER_ZIP_MOCK" 와 is_mock=true 가 포함된다.

function asTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('\n');
  return value || '';
}

export const jobsApi = {
  // params: { keyword, position, career_type, employment_type, location, tech_stack, ordering, page, size }
  searchJobs: async (params = {}) => {
    const response = await axiosInstance.get('/external/jobs', { params });
    return response.data; // { source, total, page, size, results: [...] }
  },

  getJob: async (jobId) => {
    const response = await axiosInstance.get(`/external/jobs/${jobId}`);
    return response.data; // 단일 job
  },

  // 선택한 합성 Mock 공고를 사용자 JD로 저장한다.
  saveJobAsJd: async (job) => {
    if (job?.job_id) {
      const response = await axiosInstance.post(`/external/jobs/${job.job_id}/save-jd`);
      return response.data;
    }

    const originalText = [
      job.job_description,
      job.requirements ? `\n[자격요건]\n${asTextList(job.requirements)}` : '',
      job.preferred ? `\n[우대사항]\n${asTextList(job.preferred)}` : '',
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

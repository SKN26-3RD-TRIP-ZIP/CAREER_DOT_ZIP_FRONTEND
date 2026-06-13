import axiosInstance from './axiosInstance';

// 이력서 API 클라이언트.
// BE: POST /resumes/upload (PDF/DOCX), GET /resumes(목록), GET /resumes/:id, DELETE /resumes/:id
export const getResumes = async () => {
  const response = await axiosInstance.get('/resumes');
  return response.data; // { total, results: [...] }
};

export const getResumeDetail = async (resumeId) => {
  const response = await axiosInstance.get(`/resumes/${resumeId}`);
  return response.data;
};

// 이력서 PDF/DOCX 업로드 → 텍스트 추출 → original_text 저장
export const uploadResumeFile = async (file, { name = '' } = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);
  const response = await axiosInstance.post('/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteResume = async (resumeId) => {
  await axiosInstance.delete(`/resumes/${resumeId}`);
};

export const resumeApi = {
  listResumes: getResumes,
  getResumes,
  getResume: getResumeDetail,
  getResumeDetail,
  uploadResume: uploadResumeFile,
  uploadResumeFile,
  deleteResume,
};

export default resumeApi;

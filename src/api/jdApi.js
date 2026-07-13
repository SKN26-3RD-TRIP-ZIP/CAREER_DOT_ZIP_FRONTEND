import axiosInstance from './axiosInstance';

export const getJds = async () => {
  const response = await axiosInstance.get('/jds');
  return response.data; // { total, results: [...] }
};

export const getJdDetail = async (jdId) => {
  const response = await axiosInstance.get(`/jds/${jdId}`);
  return response.data;
};

export const createJd = async (payload) => {
  const response = await axiosInstance.post('/jds', payload);
  return response.data;
};

export const updateJd = async (jdId, payload) => {
  const response = await axiosInstance.patch(`/jds/${jdId}`, payload);
  return response.data;
};

// JD PDF 업로드 → 텍스트 추출 → 저장 (BE: POST /jds/upload, multipart)
export const uploadJdPdf = async (file, { company_name = '', position = '' } = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (company_name) form.append('company_name', company_name);
  if (position) form.append('position', position);
  const response = await axiosInstance.post('/jds/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteJd = async (jdId) => {
  await axiosInstance.delete(`/jds/${jdId}`);
};

export const jdApi = {
  listJds: getJds,
  getJds,
  getJd: getJdDetail,
  getJdDetail,
  createJd,
  updateJd,
  uploadJd: uploadJdPdf,
  uploadJdPdf,
  deleteJd,
};

export default jdApi;

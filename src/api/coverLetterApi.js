import axiosInstance from './axiosInstance';

export const getCoverLetters = async () => {
  const response = await axiosInstance.get('/cover-letters');
  return response.data; // { total, results: [...] }
};

export const getCoverLetterDetail = async (coverLetterId) => {
  const response = await axiosInstance.get(`/cover-letters/${coverLetterId}`);
  return response.data;
};

export const createCoverLetter = async (payload) => {
  const response = await axiosInstance.post('/cover-letters', payload);
  return response.data;
};

export const deleteCoverLetter = async (coverLetterId) => {
  await axiosInstance.delete(`/cover-letters/${coverLetterId}`);
};

export const coverLetterApi = {
  getCoverLetters,
  getCoverLetterDetail,
  createCoverLetter,
  deleteCoverLetter,
};

export default coverLetterApi;

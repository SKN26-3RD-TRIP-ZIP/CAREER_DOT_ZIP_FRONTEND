import axiosInstance from './axiosInstance';

export const getCoverLetters = async () => {
  const response = await axiosInstance.get('/cover-letters');
  return response.data; // { total, results: [...] }
};

export const getCoverLetterDetail = async (coverLetterId) => {
  const response = await axiosInstance.get(`/cover-letters/${coverLetterId}`);
  return response.data;
};

export const deleteCoverLetter = async (coverLetterId) => {
  await axiosInstance.delete(`/cover-letters/${coverLetterId}`);
};

export const coverLetterApi = {
  getCoverLetters,
  getCoverLetterDetail,
  deleteCoverLetter,
};

export default coverLetterApi;

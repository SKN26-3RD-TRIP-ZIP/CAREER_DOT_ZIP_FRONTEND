import axiosInstance from './axiosInstance';

export const getTalentProfileCatalog = async () => {
  const response = await axiosInstance.get('/talent-profiles/catalog');
  return response.data;
};

export const getJdTalentProfile = async (jdId) => {
  const response = await axiosInstance.get(`/jds/${jdId}/talent-profile`);
  return response.data;
};

export const saveJdTalentProfile = async (jdId, payload) => {
  const response = await axiosInstance.put(`/jds/${jdId}/talent-profile`, payload);
  return response.data;
};

export default {
  getTalentProfileCatalog,
  getJdTalentProfile,
  saveJdTalentProfile,
};

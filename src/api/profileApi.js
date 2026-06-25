import axiosInstance from './axiosInstance';

export const getMyProfile = async () => {
  const response = await axiosInstance.get('/users/me/profile');
  return response.data;
};

export const createMyProfile = async (payload) => {
  const response = await axiosInstance.post('/users/me/profile', payload);
  return response.data;
};

export const updateMyProfile = async (payload) => {
  const response = await axiosInstance.patch('/users/me/profile', payload);
  return response.data;
};

export const profileApi = {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
};

export default profileApi;

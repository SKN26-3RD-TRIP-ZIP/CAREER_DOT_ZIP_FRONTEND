import axiosInstance from './axiosInstance';

export const jdApi = {
  createJd: async (payload) => {
    const response = await axiosInstance.post('/jds', payload);
    return response.data;
  },
};

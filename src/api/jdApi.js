import axiosInstance from './axiosInstance';

export const jdApi = {
  listJds: async () => {
    const response = await axiosInstance.get('/jds');
    return response.data;
  },

  createJd: async (payload) => {
    const response = await axiosInstance.post('/jds', payload);
    return response.data;
  },
};

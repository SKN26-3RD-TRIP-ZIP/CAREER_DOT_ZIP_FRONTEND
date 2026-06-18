import axiosInstance from './axiosInstance';

export const getProjects = async () => {
  const response = await axiosInstance.get('/projects');
  return response.data;
};

export const getProjectDetail = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (payload) => {
  const response = await axiosInstance.post('/projects', payload);
  return response.data;
};

export const updateProject = async (projectId, payload) => {
  const response = await axiosInstance.patch(`/projects/${projectId}`, payload);
  return response.data;
};

export const deleteProject = async (projectId) => {
  await axiosInstance.delete(`/projects/${projectId}`);
};

export const projectApi = {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
};

export default projectApi;

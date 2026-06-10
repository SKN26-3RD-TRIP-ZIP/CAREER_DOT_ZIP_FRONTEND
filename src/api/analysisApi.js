import axiosInstance from './axiosInstance'

// JD
export const getJdList = () => axiosInstance.get('/analysis/select/jds/')
export const getJdDetail = (jdId) => axiosInstance.get(`/input/jds/${jdId}`)
export const createJd = (data) => axiosInstance.post('/analysis/create/jds/', data)

// Resume
export const getResumeList = () => axiosInstance.get('/analysis/select/resumes/')
export const getResumeDetail = (resumeId) => axiosInstance.get(`/input/resumes/${resumeId}`)
export const createResume = (data) => axiosInstance.post('/analysis/create/resumes/', data)

// Cover letter
export const getCoverLetterList = () => axiosInstance.get('/analysis/select/cover-letters/')
export const getCoverLetterDetail = (id) => axiosInstance.get(`/input/cover-letters/${id}`)
export const createCoverLetter = (data) => axiosInstance.post('/analysis/create/cover-letters/', data)

// Analysis
export const startAnalysis = (data) => axiosInstance.post('/analysis/analyze/', data)
export const getAnalysisStatus = (sessionId) => axiosInstance.post('/analysis/status/', { session_id: sessionId })
export const getAnalysisResult = (sessionId) => axiosInstance.post('/analysis/match/', { session_id: sessionId })

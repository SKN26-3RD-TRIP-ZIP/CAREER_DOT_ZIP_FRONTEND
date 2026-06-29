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

// 예상 면접 질문 (분석과 분리된 온디맨드 생성)
export const getQuestions = (sessionId) =>
  axiosInstance.get('/analysis/questions/', { params: { session_id: sessionId } })
export const generateQuestions = (sessionId) =>
  axiosInstance.post('/analysis/questions/', { session_id: sessionId })
export const regenerateQuestions = (sessionId) =>
  axiosInstance.post('/analysis/questions/', { session_id: sessionId, regenerate: true })

// 인재상
export const getTalentCatalog = () => axiosInstance.get('/analysis/talent-profiles/catalog/')
export const getJdTalentProfile = (jdId) => axiosInstance.get(`/analysis/jds/${jdId}/talent-profile/`)
export const saveJdTalentProfile = (jdId, data) => axiosInstance.put(`/analysis/jds/${jdId}/talent-profile/`, data)

// 예상 질문 만족도 신호 (👍/👎)
export const submitQuestionFeedback = (sessionId, rating) =>
  axiosInstance.post('/analysis/feedback/', { session_id: sessionId, rating })

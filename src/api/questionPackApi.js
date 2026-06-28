import axiosInstance from './axiosInstance';

// 질문팩 API (백엔드 실제 계약: /api/v1/interviews/question-packs)
//   GET    /interviews/question-packs            → { total, results: [QuestionPack] }
//   GET    /interviews/question-packs/{id}        → QuestionPack
//   POST   /interviews/question-packs             → 생성(포인트 차감; 402 POINTS_INSUFFICIENT)
//   POST   /interviews/question-packs/{id}/apply  → { applied_count, questions } (409 SESSION_QUESTIONS_EXIST)
export const listQuestionPacks = () => axiosInstance.get('/interviews/question-packs');

export const getQuestionPack = (id) => axiosInstance.get(`/interviews/question-packs/${id}`);

export const createQuestionPack = ({ interviewType, questionCount, title, mix }) =>
  axiosInstance.post('/interviews/question-packs', {
    interview_type: interviewType,
    question_count: questionCount,
    ...(title ? { title } : {}),
    ...(mix ? { mix } : {}),
  });

export const applyQuestionPack = (id, { sessionId }) =>
  axiosInstance.post(`/interviews/question-packs/${id}/apply`, { session_id: sessionId });

export default { listQuestionPacks, getQuestionPack, createQuestionPack, applyQuestionPack };

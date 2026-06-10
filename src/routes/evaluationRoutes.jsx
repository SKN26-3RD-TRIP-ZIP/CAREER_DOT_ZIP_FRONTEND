import { Routes, Route, Navigate } from 'react-router-dom';
import FinalReportPage from '../pages/evaluation/FinalReportPage.jsx';
import GrowthTrendPage from '../pages/evaluation/GrowthTrendPage.jsx';
import OverallScorePage from '../pages/evaluation/OverallScorePage.jsx';
import RoadmapPage from '../pages/evaluation/RoadmapPage.jsx';
import InterviewerFeedbackPage from '../pages/evaluation/InterviewerFeedbackPage.jsx';

/**
 * Evaluation / Report 라우트 묶음.
 *
 * App.jsx 에서 단 한 줄로 마운트하세요 (기존 코드 변경 없음):
 *
 *   import EvaluationRoutes from './routes/evaluationRoutes.jsx';
 *   ...
 *   <Route path="/report/*" element={<EvaluationRoutes />} />
 *
 * 경로(절대):
 *   /report/:sessionId           최종 리포트
 *   /report/:sessionId/growth    최근 성장 추이
 *   /report/:sessionId/overall   Overall Score 상세
 *   /report/:sessionId/roadmap   Next Learning Roadmap
 *   /report/:sessionId/feedback  면접관 피드백
 */
export default function EvaluationRoutes() {
  return (
    <Routes>
      <Route path=":sessionId" element={<FinalReportPage />} />
      <Route path=":sessionId/growth" element={<GrowthTrendPage />} />
      <Route path=":sessionId/overall" element={<OverallScorePage />} />
      <Route path=":sessionId/roadmap" element={<RoadmapPage />} />
      <Route path=":sessionId/feedback" element={<InterviewerFeedbackPage />} />
      <Route index element={<Navigate to="latest" replace />} />
    </Routes>
  );
}

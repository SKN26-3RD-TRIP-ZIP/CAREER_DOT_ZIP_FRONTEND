import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

/**
 * 리포트 서버 데이터 조회 훅 (react-query).
 * 기존 admin 페이지의 useQuery 패턴과 동일.
 */
export function useFinalReport(sessionId) {
  return useQuery({
    queryKey: ['report', 'final', sessionId],
    queryFn: () => reportApi.getFinalReport(sessionId),
    enabled: !!sessionId,
  });
}

// GET /mypage/growth — 최근 성장 추이 (GrowthView, 라우팅 완료)
export function useGrowthTrend() {
  return useQuery({
    queryKey: ['report', 'growth'],
    queryFn: () => reportApi.getGrowthTrend(),
    enabled: true,
  });
}

// GET /sessions/{id}/roadmap — 개인화 학습 로드맵 (SessionRoadmapView, 라우팅 완료)
export function useRoadmap(sessionId) {
  return useQuery({
    queryKey: ['report', 'roadmap', sessionId],
    queryFn: () => reportApi.getRoadmap(sessionId),
    enabled: !!sessionId,
  });
}

// GET /sessions/{id}/feedback — E7.9+ 면접관 피드백 (페르소나 + 추천 질문)
export function useInterviewerFeedback(sessionId) {
  return useQuery({
    queryKey: ['report', 'feedback', sessionId],
    queryFn: () => reportApi.getInterviewerFeedback(sessionId),
    enabled: !!sessionId,
  });
}

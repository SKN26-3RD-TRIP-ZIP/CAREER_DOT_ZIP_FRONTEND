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

// 고도화 보류: /mypage/growth 엔드포인트 미구현 → enabled: false로 요청 차단
// 엔드포인트 구현 완료 시 enabled: true로 전환
export function useGrowthTrend() {
  return useQuery({
    queryKey: ['report', 'growth'],
    queryFn: () => reportApi.getGrowthTrend(),
    enabled: false,
  });
}

// 고도화 보류: /sessions/{id}/roadmap 엔드포인트 미구현 → enabled: false로 요청 차단
// 엔드포인트 구현 완료 시 enabled: !!sessionId 로 전환
export function useRoadmap(sessionId) {
  return useQuery({
    queryKey: ['report', 'roadmap', sessionId],
    queryFn: () => reportApi.getRoadmap(sessionId),
    enabled: false,
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

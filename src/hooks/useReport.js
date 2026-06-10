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

export function useGrowthTrend() {
  return useQuery({
    queryKey: ['report', 'growth'],
    queryFn: () => reportApi.getGrowthTrend(),
  });
}

export function useRoadmap(sessionId) {
  return useQuery({
    queryKey: ['report', 'roadmap', sessionId],
    queryFn: () => reportApi.getRoadmap(sessionId),
    enabled: !!sessionId,
  });
}

export function useInterviewerFeedback(sessionId) {
  return useQuery({
    queryKey: ['report', 'feedback', sessionId],
    queryFn: () => reportApi.getInterviewerFeedback(sessionId),
    enabled: !!sessionId,
  });
}

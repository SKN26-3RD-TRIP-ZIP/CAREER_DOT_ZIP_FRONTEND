import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

// 리포트 생성 폴링 간격(ms). 백엔드는 status='processing'(HTTP 202)을 반환하며,
// done/failed가 될 때까지 이 주기로 GET을 재호출한다. GET 자체가 서버측 생성을 트리거한다.
export const REPORT_POLL_INTERVAL_MS = 2500;

/**
 * 리포트 서버 데이터 조회 훅 (react-query).
 * 비동기 생성: status가 'processing'인 동안 자동 폴링하고, 'completed'/'failed'면 중단한다.
 */
export function useFinalReport(sessionId) {
  return useQuery({
    queryKey: ['report', 'final', sessionId],
    queryFn: () => reportApi.getFinalReport(sessionId),
    enabled: !!sessionId,
    // v5: refetchInterval(query) → 생성 중이면 폴링, 완료/실패면 중단.
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? REPORT_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
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

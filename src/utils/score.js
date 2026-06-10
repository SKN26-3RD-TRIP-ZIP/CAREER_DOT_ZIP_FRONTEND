/**
 * 점수 색상 규칙 (디자인 시스템 기준)
 *   80점 이상 : 초록 (good)
 *   70~79     : 노랑 (warn)
 *   50~69     : 주황 (alert)
 *   50 미만   : 빨강 (danger)
 */
export function scoreTier(score) {
  if (score >= 80) return 'good';
  if (score >= 70) return 'warn';
  if (score >= 50) return 'alert';
  return 'danger';
}

export const TIER_HEX = {
  good: '#22c55e',
  warn: '#eab308',
  alert: '#f97316',
  danger: '#ef4444',
};

/** 차트 fill/stroke 용 hex */
export function scoreHex(score) {
  return TIER_HEX[scoreTier(score)];
}

/** 점수 뱃지 (배경+텍스트) tailwind 클래스 */
export function scoreBadgeClass(score) {
  switch (scoreTier(score)) {
    case 'good':
      return 'bg-green-100 text-green-700';
    case 'warn':
      return 'bg-yellow-100 text-yellow-700';
    case 'alert':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-red-100 text-red-600';
  }
}

/** 진행바 fill 배경 클래스 */
export function scoreBarClass(score) {
  switch (scoreTier(score)) {
    case 'good':
      return 'bg-green-500';
    case 'warn':
      return 'bg-yellow-500';
    case 'alert':
      return 'bg-orange-500';
    default:
      return 'bg-red-500';
  }
}

export const priorityLabel = (p) => (p === 'high' ? '높음' : p === 'mid' ? '중간' : '낮음');

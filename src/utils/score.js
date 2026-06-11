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

// 브랜드 그린(#08CB00) 기준으로 통일한 선명한 톤 팔레트
export const TIER_HEX = {
  good: '#08CB00',
  warn: '#F5B400',
  alert: '#F5772B',
  danger: '#E5342B',
};

/** 차트 fill/stroke 용 hex */
export function scoreHex(score) {
  return TIER_HEX[scoreTier(score)];
}

/** 점수 뱃지 (배경+텍스트) tailwind 클래스 */
export function scoreBadgeClass(score) {
  switch (scoreTier(score)) {
    case 'good':
      return 'bg-[#08CB00]/15 text-[#253900]';
    case 'warn':
      return 'bg-[#F5B400]/20 text-[#8A6500]';
    case 'alert':
      return 'bg-[#F5772B]/20 text-[#A33E0C]';
    default:
      return 'bg-[#E5342B]/15 text-[#E5342B]';
  }
}

/** 진행바 fill 배경 클래스 */
export function scoreBarClass(score) {
  switch (scoreTier(score)) {
    case 'good':
      return 'bg-[#08CB00]';
    case 'warn':
      return 'bg-[#F5B400]';
    case 'alert':
      return 'bg-[#F5772B]';
    default:
      return 'bg-[#E5342B]';
  }
}

export const priorityLabel = (p) => (p === 'high' ? '높음' : p === 'mid' ? '중간' : '낮음');

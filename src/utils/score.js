/**
 * 점수 색상 규칙 (4색 팔레트로 통일)
 *   80점 이상 : 브랜드 그린(#08CB00)
 *   70~79     : 딥 그린(#253900)
 *   50~69     : 딥 그린(#253900)
 *   50 미만   : 블랙(#000000)
 * (티어 구분 로직은 그대로 유지하고 색상만 팔레트로 매핑)
 */
export function scoreTier(score) {
  if (score >= 80) return 'good';
  if (score >= 70) return 'warn';
  if (score >= 50) return 'alert';
  return 'danger';
}

export const TIER_HEX = {
  good: '#08CB00',
  warn: '#253900',
  alert: '#253900',
  danger: '#000000',
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
      return 'bg-[#253900]/15 text-[#253900]';
    case 'alert':
      return 'bg-[#253900]/10 text-[#253900]';
    default:
      return 'bg-[rgba(0,0,0,0.1)] text-[#000000]';
  }
}

/** 진행바 fill 배경 클래스 */
export function scoreBarClass(score) {
  switch (scoreTier(score)) {
    case 'good':
      return 'bg-[#08CB00]';
    case 'warn':
      return 'bg-[#253900]';
    case 'alert':
      return 'bg-[#253900]';
    default:
      return 'bg-[#000000]';
  }
}

export const priorityLabel = (p) => (p === 'high' ? '높음' : p === 'mid' ? '중간' : '낮음');

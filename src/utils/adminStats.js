// 관리자 통계 표시 헬퍼. 실제 0과 미집계(null/미제공)를 구분한다. (null→0 위장 금지)

export function isMissing(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value));
}

export function statNum(value) {
  if (isMissing(value)) return '미집계';
  return Number(value).toLocaleString('ko-KR');
}

export function statMoney(value) {
  if (isMissing(value)) return '미집계';
  return `$${Number(value).toFixed(4)}`;
}

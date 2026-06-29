// 성장 비교 순수 헬퍼.
// 백엔드 /mypage/growth 가 이미 유효 데이터만(완료·non-mock·evaluation COMPLETED·score!=null) 내려준다.
// 여기서는 그 응답을 화면 상태로 해석만 한다. (null→0 위장 금지, 실제 0점 유지)

export const COMPETENCIES = [
  { key: 'expertise', label: '전문성' },
  { key: 'logic', label: '논리성' },
  { key: 'specificity', label: '구체성' },
  { key: 'delivery', label: '전달력' },
];

export function validReportCount(growth) {
  return Array.isArray(growth?.points) ? growth.points.length : 0;
}

// 'none'(유효 0) | 'insufficient'(유효 1 → 비교 데이터 부족) | 'version_mismatch' | 'comparable'
export function growthState(growth) {
  const count = validReportCount(growth);
  if (count === 0) return 'none';
  const gc = growth?.growth_comparison;
  if (!gc || gc.available !== true) return 'insufficient';
  if (gc.prompt_version_warning) return 'version_mismatch';
  return 'comparable';
}

export const DIRECTION_LABEL = {
  improved: '개선',
  maintained: '유지',
  declined: '하락',
  unknown: '비교 불가',
};

// delta → 방향. 실제 0 = maintained, null/undefined/NaN = unknown (0점 위장 금지)
export function changeDirection(delta) {
  if (delta === null || delta === undefined) return 'unknown';
  const d = Number(delta);
  if (!Number.isFinite(d)) return 'unknown';
  if (d > 0) return 'improved';
  if (d < 0) return 'declined';
  return 'maintained';
}

export function overallChange(growth) {
  const delta = growth?.growth_comparison?.overall_delta;
  return {
    delta: delta === null || delta === undefined ? null : Number(delta),
    direction: changeDirection(delta),
  };
}

// 4개 역량 비교 행 (current/previous 점수 + delta + 방향). 실제 0 보존, 누락은 null.
export function competencyRows(growth) {
  const points = growth?.points ?? [];
  const current = points.length ? points[points.length - 1]?.metrics ?? {} : {};
  const previous = points.length > 1 ? points[points.length - 2]?.metrics ?? {} : {};
  const metricDelta = growth?.growth_comparison?.metric_delta ?? {};
  return COMPETENCIES.map(({ key, label }) => {
    const cur = key in current ? current[key] : null;
    const prev = key in previous ? previous[key] : null;
    const delta = key in metricDelta ? metricDelta[key] : null;
    return {
      key,
      label,
      current: cur === undefined ? null : cur,
      previous: prev === undefined ? null : prev,
      delta: delta === undefined ? null : delta,
      direction: changeDirection(delta),
    };
  });
}

export function weaknessTags(growth) {
  const items = growth?.weakness_trend?.items ?? [];
  return items.map((it) => it.tag).filter(Boolean);
}

import {
  CATEGORY_CARDS,
  RADAR_AXES,
  personaMeta,
  tagLabel,
  questionTypeLabel,
  interviewTypeLabel,
} from '../utils/reportLabels';

/**
 * 백엔드 GET /sessions/{id}/report 응답 → UI 컴포넌트가 쓰는 형태로 정규화.
 *
 * 실제 응답:
 *   { report_id, session_id, status, generated_at, summary }
 *   summary = { evaluation_metadata, score_summary{overall_score, metrics},
 *               score_detail{strength, weakness, improvement, questions[], statistics, speech_diagnostics},
 *               dynamically_triggered_tags{strength_tags[], weakness_tags[]} }
 *
 * UI 는 백엔드 변경에 영향받지 않도록 이 어댑터 한 곳에서만 매핑합니다.
 */
export function normalizeFinalReport(raw) {
  const summary = raw?.summary ?? {};
  const meta = summary.evaluation_metadata ?? {};
  const scoreSummary = summary.score_summary ?? raw?.score_summary ?? raw?.raw_data?.summary?.score_summary ?? {};
  const metrics = scoreSummary.metrics ?? {};
  const detail = summary.score_detail ?? {};
  const triggered = summary.dynamically_triggered_tags ?? {};

  const parseScore = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const num = (v) => parseScore(v) ?? 0;
  // null/undefined를 보존하여 "해당 없음" 표시가 필요한 지표에 사용
  const numOrNull = (v) => parseScore(v);
  const localizeList = (arr) =>
    Array.isArray(arr) ? arr.map(tagLabel).filter(Boolean).join(', ') : '';

  const tagsFrom = (list, kind) =>
    (Array.isArray(list) ? list : []).map((t) => ({
      label: tagLabel(t?.tag_name),
      kind,
      raw: t?.tag_name,
      description: t?.description || '',
    }));

  // 질문별 평가 (백엔드 score_detail.questions). 없으면 빈 배열 → 테이블 숨김.
  // '질문 종류' 칼럼은 세션 단위 interview_type 으로 표기(모든 행 동일) — (b)안.
  const interviewType = interviewTypeLabel(meta.interview_type);
  const questions = (Array.isArray(detail.questions) ? detail.questions : []).map((q, i) => ({
    question_id: q?.question_id ?? `q${i}`,
    order: q?.order ?? i + 1,
    question_type: interviewType, // 표시용: 기술/인성/종합 면접
    question_kind: questionTypeLabel(q?.question_type), // 참고: 기본/꼬리질문 (raw main/follow_up)
    question_text: q?.question_text ?? '',
    improvement_action: q?.improvement_action ?? '',
    score: num(q?.score),
  }));

  return {
    session_id: raw?.session_id ?? meta.session_id ?? '',
    created_at: raw?.generated_at ?? meta.calculated_at ?? '',

    score_summary: {
      overall_score: num(scoreSummary.overall_score ?? raw?.overall_score),
      grade_label: '',
      comment: meta.summary_text || '',
      // 백엔드 원본 metrics 패스스루(페이지 내 buildRadar 등 직접 소비용 — 비파괴)
      metrics,
    },

    score_detail: {
      // 디자인 4개 카드 ← metrics 4개 (기술 깊이 = SBERT technical_score, E7.5)
      categories: CATEGORY_CARDS.map((c) => ({
        key: c.key,
        label: c.label,
        // null 보존: 백엔드가 해당 지표를 산출하지 않은 경우 "해당 없음" 표시
        score: numOrNull(metrics[c.metric]),
        description: c.description,
      })),
      // 레이더 5축 ← metrics, null 축은 제외 (grounding은 기술 질문 없으면 null)
      radar: RADAR_AXES
        .filter((a) => metrics[a.metric] != null)
        .map((a) => ({ axis: a.axis, label: a.label, score: Math.round(metrics[a.metric]) })),
      // 질문별 평가 (B안: 백엔드 summary.score_detail.questions)
      questions,
      // 백엔드 원본 score_detail 패스스루(향후 직접 소비/디버깅용 — 비파괴)
      raw: detail,
    },

    dynamically_triggered_tags: [
      ...tagsFrom(triggered.strength_tags, 'strength'),
      ...tagsFrom(triggered.weakness_tags, 'weakness'),
    ],

    evaluation_metadata: (() => {
      const answerCount = Number(meta.answer_count) || 0;
      const evaluatedCount = Number(meta.evaluated_answer_count) || 0;
      // unscored_answer_count는 신규 필드(부분 리포트, #5). 구버전 캐시 리포트에는 없으므로
      // answer_count - evaluated_answer_count로 폴백.
      const unscored =
        meta.unscored_answer_count != null
          ? Number(meta.unscored_answer_count) || 0
          : Math.max(answerCount - evaluatedCount, 0);
      return {
        persona_key: meta.persona_type || '',
        ...personaMeta(meta.persona_type),
        answer_count: answerCount,
        evaluated_answer_count: evaluatedCount,
        unscored_answer_count: unscored,
        format_failed_answer_count: Number(meta.format_failed_answer_count) || 0,
      };
    })(),

    score_interpretation: {
      strength: localizeList(detail.strength) || '두드러진 강점 태그가 아직 집계되지 않았습니다.',
      improvement: localizeList(detail.weakness) || '특별한 보완 태그가 감지되지 않았습니다.',
      recommendation: Array.isArray(detail.improvement)
        ? detail.improvement.join(' ')
        : detail.improvement || '',
    },
  };
}

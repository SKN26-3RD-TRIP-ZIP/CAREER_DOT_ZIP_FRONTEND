/**
 * 디자인 라벨 ↔ 백엔드 summary 필드 매핑 + 한글 라벨 맵.
 * 백엔드 계약: summary.score_summary.metrics (5축), dynamically_triggered_tags(strength/weakness),
 *             evaluation_metadata.persona_type
 * 출처: apps/report/services/report_generator.py, 데이터 사전(FeedbackReportCSV)
 */

/**
 * 최종 리포트 4개 카테고리 카드 ← metrics 5축 중 4개 매핑.
 * ⚠️ 기술 깊이는 현재 grounding_score 사용. SBERT 고도화로 technical_score가 산출되면
 *    metric 을 'technical_score' 로 교체하세요. (E7.5 고도화)
 */
export const CATEGORY_CARDS = [
  { key: 'answer_structure', label: '답변 구조', metric: 'bei_logic_score', description: '논리 흐름과 STAR 구성' },
  { key: 'competency', label: '역량 측정', metric: 'cbi_competency_score', description: '행동 기반 역량 측정' },
  { key: 'tech_depth', label: '기술 깊이', metric: 'grounding_score', description: '실무 구체성 기반 기술 평가' }, // TODO: 고도화 시 'technical_score'
  { key: 'communication', label: '커뮤니케이션', metric: 'speech_delivery_score', description: '명확성, 속도, 태도' },
];

/** Overall 상세 레이더 5축 ← metrics 전체 */
export const RADAR_AXES = [
  { metric: 'bei_logic_score', axis: 'BEI', label: '행동 기반' },
  { metric: 'cbi_competency_score', axis: 'CBI', label: '역량 기반' },
  { metric: 'grounding_score', axis: 'Grounding', label: '실무 구체성' },
  { metric: 'speech_delivery_score', axis: 'Speech', label: '전달력' },
  { metric: 'technical_score', axis: 'Technical', label: '기술 깊이' },
];

/** 면접관 페르소나 라벨 */
export const PERSONA_LABELS = {
  practical: { short_name: '실무형', name: '실무형 면접관', avatar_emoji: '💼' },
  coach: { short_name: '코치형', name: '코치형 면접관', avatar_emoji: '🎯' },
  verifier: { short_name: '검증형', name: '검증형 면접관', avatar_emoji: '🔎' },
};

export function personaMeta(personaType) {
  return (
    PERSONA_LABELS[personaType] || {
      short_name: personaType || '면접관',
      name: `${personaType || ''} 면접관`.trim(),
      avatar_emoji: '💼',
    }
  );
}

/** tag_name → 한글 라벨 (강점 14종 / 약점 13종, 데이터 사전 기준) */
export const TAG_LABELS = {
  // 강점
  sharp_problem_definition: '문제 정의',
  data_driven_achievement: '수치화 성과',
  deep_tech_insight: '기술 인사이트',
  clear_ownership_leadership: '오너십',
  top_down_delivery: '두괄식 전달',
  well_balanced_tradeoff: '트레이드오프',
  high_jd_alignment: '직무 적합',
  agile_growth_mindset: '성장 마인드',
  fluent_speech_delivery: '유창한 전달',
  collaborative_problem_solver: '협업 해결',
  rich_context_setting: '맥락 설명',
  elaborate_action_detail: '액션 구체화',
  macro_business_perspective: '비즈니스 관점',
  solid_answer_consistency: '답변 일관성',
  // 약점
  weak_question_relevance: '질문 적합성',
  weak_specificity: '구체성 부족',
  weak_technical_understanding: '기술 이해',
  weak_technical_reasoning: '기술 근거',
  weak_personal_contribution: '개인 기여',
  weak_evidence: '근거 보강',
  weak_jd_fit: '직무 연결',
  weak_problem_solving_process: '문제해결 과정',
  weak_result_impact: '성과 임팩트',
  weak_answer_structure: '답변 구조',
  excessive_filler_words: '습관어 과다',
  frequent_long_pauses: '긴 침묵',
  unbalanced_speech_pace: '발화 페이스',
};

/** 알 수 없는 tag_name 은 snake_case → 사람이 읽을 형태로 폴백 */
export function tagLabel(tagName) {
  if (!tagName) return '';
  return TAG_LABELS[tagName] || String(tagName).replace(/_/g, ' ');
}

/** InterviewQuestion.question_type → 한글 (QUESTION_TYPE_CHOICES 확정 시 보정) */
export const QUESTION_TYPE_LABELS = {
  // 실제 QUESTION_TYPE_CHOICES (apps/common/choices.py): main / follow_up
  main: '기본 질문',
  follow_up: '꼬리질문',
};

export function questionTypeLabel(t) {
  return QUESTION_TYPE_LABELS[t] || t || '질문';
}

/** 세션 interview_type → 한글 (INTERVIEW_TYPE_CHOICES) */
export const INTERVIEW_TYPE_LABELS = {
  technical: '기술 면접',
  personality: '인성 면접',
  comprehensive: '종합 면접',
};

export function interviewTypeLabel(t) {
  return INTERVIEW_TYPE_LABELS[t] || t || '면접';
}

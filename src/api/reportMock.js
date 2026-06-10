/**
 * 백엔드 미연결(또는 roadmap/feedback API 미구현) 시 사용하는 목업 픽스처.
 * VITE_USE_MOCK=true 일 때 reportApi 가 이 데이터를 반환합니다.
 * 필드 구조는 DRF summary 객체(snake_case) 가정값과 동일합니다.
 */
const PERSONA = {
  persona_key: 'practical',
  name: '실무형 면접관',
  short_name: '실무형',
  avatar_emoji: '🧑‍💼',
  total_score: 91,
  tags: ['운영 경험', '장애 대응', '협업 맥락'],
};

export const mockFinalReport = {
  session_id: 'demo',
  created_at: '2026-06-09T10:00:00Z',
  score_summary: {
    overall_score: 92,
    grade_label: '상위권',
    comment: 'AI 면접 종합 평가 기준 상위권입니다.',
  },
  score_detail: {
    categories: [
      { key: 'answer_structure', label: '답변 구조', score: 88, description: '논리 흐름과 STAR 구성' },
      { key: 'competency', label: '역량 측정', score: 80, description: '행동 기반 역량 측정' },
      { key: 'tech_depth', label: '기술 깊이', score: 86, description: '핵심 기술 설명과 판단 근거' },
      { key: 'communication', label: '커뮤니케이션', score: 78, description: '명확성, 속도, 태도' },
    ],
    radar: [
      { axis: 'BEI', label: '행동 기반', score: 86 },
      { axis: 'CBI', label: '역량 기반', score: 80 },
      { axis: 'Technical', label: '기술 깊이', score: 86 },
      { axis: 'Grounding', label: '근거 제시', score: 74 },
      { axis: 'Communication', label: '전달력', score: 78 },
    ],
    questions: [
      { question_id: 'q1', order: 1, question_type: '인성 질문', question_text: '팀 내 갈등이 생겼을 때 어떻게 해결하시나요?', improvement_action: '결과에 대한 수치 보강', score: 80 },
      { question_id: 'q2', order: 2, question_type: '직무 질문', question_text: '왜 백엔드 개발자가 되고 싶으십니까?', improvement_action: '필러 워드 사용 자제', score: 88 },
      { question_id: 'q3', order: 3, question_type: '기술 질문', question_text: 'Next.js 개발의 초기 로딩 속도가 느릴 때 어떻게 개선하시겠습니까?', improvement_action: '트레이드오프 명시', score: 75 },
      { question_id: 'q4', order: 4, question_type: '인성 질문', question_text: '본인의 강점과 약점은 무엇인가요?', improvement_action: '근거 데이터 추가', score: 50 },
    ],
  },
  dynamically_triggered_tags: [
    { label: '구조화 답변', kind: 'strength' },
    { label: '수치화', kind: 'strength' },
    { label: 'API 성능', kind: 'strength' },
    { label: '문제 정의', kind: 'strength' },
    { label: '협업 맥락', kind: 'strength' },
    { label: '장애 회고', kind: 'weakness' },
    { label: '트레이드오프', kind: 'weakness' },
    { label: '근거 보강', kind: 'weakness' },
    { label: '문항 지표', kind: 'weakness' },
  ],
  evaluation_metadata: PERSONA,
  score_interpretation: {
    strength: '높은 점수 요인: 질문 의도를 파악한 뒤 결론을 먼저 제시했습니다.',
    improvement: '보완 요인: 일부 답변에서 회고와 근거를 선제시 하면 좋습니다.',
    recommendation: '추천 액션: 트레이드오프와 운영 지표를 포함한 60초 답변 템플릿을 추가 연습하세요.',
  },
};

export const mockGrowthTrend = {
  points: [
    { session_id: 's1', date: '2026-03-07', label: '3/7', overall_score: 74 },
    { session_id: 's2', date: '2026-03-15', label: '3/15', overall_score: 78 },
    { session_id: 's3', date: '2026-04-01', label: '4/1', overall_score: 85 },
    { session_id: 's4', date: '2026-05-02', label: '5/2', overall_score: 82 },
    { session_id: 's5', date: '2026-05-20', label: '5/20', overall_score: 84 },
    { session_id: 's6', date: '2026-06-02', label: '6/2', overall_score: 76 },
    { session_id: 'demo', date: '2026-06-09', label: '6/9', overall_score: 92 },
  ],
  first_score: 74,
  latest_score: 92,
  delta: 18,
  improved_count: 7,
  insights: [
    '답변 구조는 74점에서 88점으로 빠르게 개선되었습니다.',
    '성과 전달은 수치 비교 기준을 넣으면 추가 상승 여지가 있습니다.',
    '기술 깊이는 트레이드오프 설명을 붙일 때 안정적으로 상승합니다.',
    '평균적으로 가장 낮은 점수는 커뮤니케이션입니다.',
  ],
};

export const mockRoadmap = {
  week_priority_text: '장애 회고 → 트레이드오프 → 운영 지표 순서로 보완하면 다음 면접에서 가장 빠른 점수 상승을 기대할 수 있습니다.',
  target_delta_label: '+2~4점',
  items: [
    { id: 'r1', title: '장애 상황 STAR 답변 작성', description: '원인-대응-재발방지 구조로 90초 답변 만들기', due_in_days: 20, priority: 'high', done: false },
    { id: 'r2', title: 'Kafka 도입 트레이드오프 정리', description: '도입 배경, 대안, 비용, 운영 리스크 비교', due_in_days: 12, priority: 'high', done: false },
    { id: 'r3', title: '결제 API 테스트 전략 보강', description: '경계값, 실패 케이스, 회귀 테스트 전략 정리', due_in_days: 8, priority: 'mid', done: false },
    { id: 'r4', title: 'Web Vitals 기반 성능 개선 회고', description: '측정 지표와 개선 전후 수치 연결', due_in_days: 5, priority: 'mid', done: false },
  ],
  practice_question: '장애 상황에서 어떤 지표를 보고 원인을 좁혔고, 재발 방지를 위해 무엇을 바꿨나요?',
};

export const mockFeedback = {
  persona: PERSONA,
  recommended_answer_structure: ['상황 교차', '관측 지표', '원인 판단', '조치', '재발 방지', '결과 수치'],
  summary: '프로젝트 맥락과 실제 문제 해결 흐름은 잘 전달됩니다. 다만 "어떤 로그/지표를 보고 원인을 좁혔는지", "왜 그 대안을 선택했는지"가 더 구체적이면 실무 면접관에게 훨씬 설득력 있게 전달됩니다.',
  pros: [
    '결론을 먼저 제시해 답변 방향이 명확합니다.',
    '성과 수치와 문제 정의를 연결하는 시도가 좋습니다.',
    'API 성능 개선 경험이 실무 경험으로 잘 드러납니다.',
  ],
  cons: [
    '장애 원인 추적 과정의 관측 지표를 더 구체화하세요.',
    '기술 선택의 대안과 기각 이유를 함께 설명하면 좋습니다.',
    '팀 협업 과정에서 맡은 역할과 의사결정 근거를 분명히 해주세요.',
  ],
  expected_questions: [
    { order: 1, text: '장애가 재발하지 않도록 어떤 체크리스트를 만들었나요?' },
    { order: 2, text: '팀 내에서 이 개선안을 어떻게 설득했나요?' },
    { order: 3, text: '배포 후 안정화 여부는 어떤 지표로 확인했나요?' },
  ],
};

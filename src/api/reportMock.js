/**
 * 백엔드 미연결 시 사용하는 목업 픽스처 (VITE_USE_MOCK=true).
 * ★ FinalReport 목업은 실제 GET /sessions/{id}/report 응답 구조와 동일하게 맞춰,
 *   reportAdapter.normalizeFinalReport 를 그대로 통과시킵니다(dev=prod 동형).
 */

// 실제 엔드포인트 응답 형태: { report_id, session_id, status, generated_at, summary }
export const mockFinalReportResponse = {
  report_id: 'demo-report-0001',
  session_id: 'demo',
  status: 'completed',
  generated_at: '2026-06-09T10:00:00Z',
  summary: {
    evaluation_metadata: {
      session_id: 'demo',
      persona_type: 'practical',
      interview_mode: 'text',
      interview_type: 'technical',
      question_count: 4,
      answer_count: 4,
      evaluated_answer_count: 4,
      calculated_at: '2026-06-09T10:00:00Z',
      summary_text:
        '이번 세션에서 가장 강력하게 발휘된 역량은 [수치화 성과] 입니다. 가장 빈번하게 노출된 보완점은 [성과 임팩트] 항목으로 확인됩니다.',
    },
    score_summary: {
      overall_score: 92,
      // 5축: BEI / CBI / Grounding / Speech / Technical(고도화 SBERT, 미구현 시 0)
      metrics: {
        bei_logic_score: 88,
        cbi_competency_score: 80,
        grounding_score: 86,
        speech_delivery_score: 78,
        technical_score: 0,
      },
    },
    score_detail: {
      strength: ['data_driven_achievement', 'sharp_problem_definition', 'deep_tech_insight'],
      weakness: ['weak_result_impact', 'weak_technical_reasoning'],
      improvement: [
        '트레이드오프와 운영 지표를 포함한 60초 답변 템플릿을 추가 연습하세요.',
      ],
      questions: [
        { question_id: 'q1', order: 1, question_type: 'main', question_text: '팀 내 갈등이 생겼을 때 어떻게 해결하시나요?', improvement_action: '결과에 대한 수치 보강', score: 80 },
        { question_id: 'q2', order: 2, question_type: 'main', question_text: '왜 백엔드 개발자가 되고 싶으십니까?', improvement_action: '필러 워드 사용 자제', score: 88 },
        { question_id: 'q3', order: 3, question_type: 'follow_up', question_text: 'Next.js 초기 로딩 속도가 느릴 때 어떻게 개선하시겠습니까?', improvement_action: '트레이드오프 명시', score: 75 },
        { question_id: 'q4', order: 4, question_type: 'main', question_text: '본인의 강점과 약점은 무엇인가요?', improvement_action: '근거 데이터 추가', score: 50 },
      ],
      statistics: {
        bei_metrics: { averages: { situation: 22, task: 20, action: 23, result: 21 }, element_total_avg: 86 },
        cbi_metrics: { average_level: 4, average_score: 80 },
      },
      speech_diagnostics: {
        total_filler_count: 6,
        avg_fillers_per_answer: 1.5,
        filler_word_distribution: { '어': 4, '음': 2 },
      },
    },
    dynamically_triggered_tags: {
      strength_tags: [
        { tag_name: 'data_driven_achievement', description: '성과를 정량 수치로 입증', trigger_signal: '수치 토큰 다수' },
        { tag_name: 'sharp_problem_definition', description: '근본 원인 정의', trigger_signal: 'CBI 상위' },
        { tag_name: 'deep_tech_insight', description: '내부 동작 원리 설명', trigger_signal: 'concept_score>=90' },
      ],
      weakness_tags: [
        { tag_name: 'weak_result_impact', description: '성과/개선 효과 부족', trigger_signal: 'result 최하점' },
        { tag_name: 'weak_technical_reasoning', description: '대안 비교 근거 부족', trigger_signal: '비교 토큰<20%' },
      ],
    },
  },
};

// ── 고도화 화면(성장추이/로드맵/피드백) 목업: 현재 미사용(보류) ──────────────
export const mockGrowthTrend = {
  points: [
    { session_id: 's1', date: '2026-03-07', label: '3/7', overall_score: 74 },
    { session_id: 's3', date: '2026-04-01', label: '4/1', overall_score: 85 },
    { session_id: 'demo', date: '2026-06-09', label: '6/9', overall_score: 92 },
  ],
  first_score: 74, latest_score: 92, delta: 18, improved_count: 7,
  insights: ['답변 구조가 빠르게 개선되었습니다.'],
};
export const mockRoadmap = { week_priority_text: '', target_delta_label: '+2~4점', items: [], practice_question: '' };
export const mockFeedback = {
  persona: { persona_key: 'practical', name: '실무형 면접관', short_name: '실무형', avatar_emoji: '💼', total_score: 91, tags: [] },
  recommended_answer_structure: [], summary: '', pros: [], cons: [], expected_questions: [],
};

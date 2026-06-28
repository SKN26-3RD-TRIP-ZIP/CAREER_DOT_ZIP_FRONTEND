// 가드레일 표시용 순수 헬퍼. 백엔드 GuardrailEvent / scan_user_input 계약 기준.
// FE는 사용자 입력을 자체 분류하지 않는다 — 백엔드 결과(category/action/reason_code/direction)만 문구로 변환한다.

export const CATEGORY_LABEL = {
  G0: '정상',
  G1: '답변 품질',
  G2: '반복·무관',
  G3: '민감정보·주입',
  G4: '유해·불법',
  G5: '자동화·권한 남용',
};

export const ACTION_LABEL = {
  ALLOW: '허용',
  GUIDE: '안내',
  WARN: '경고',
  BLOCK_INPUT: '입력 차단',
  SKIP_FOLLOWUP: '꼬리질문 생략',
  END_SESSION: '세션 종료',
  REQUIRE_ADMIN_REVIEW: '관리자 검토 필요',
};

export const DIRECTION_LABEL = { USER_TO_AI: '사용자→AI', AI_TO_USER: 'AI→사용자' };

export const REASON_LABEL = {
  NO_ISSUE: '문제 없음',
  ANSWER_TOO_SHORT: '답변이 너무 짧습니다. 조금 더 구체적으로 답변해 주세요.',
  REPEATED_ANSWER: '이전과 동일한 답변입니다. 다른 내용으로 답변해 주세요.',
  SECRET_PATTERN: 'API 키·토큰 등 비밀정보가 포함되어 있어 제출이 차단되었습니다.',
  RRN_PATTERN: '주민등록번호 등 민감 개인정보가 포함되어 있어 제출이 차단되었습니다.',
  XSS_PATTERN: '스크립트성 입력이 감지되어 제출이 차단되었습니다.',
  SQL_INJECTION_PATTERN: '비정상 쿼리 패턴이 감지되어 제출이 차단되었습니다.',
  PROMPT_INJECTION_PATTERN: '프롬프트 조작 시도가 감지되어 제출이 차단되었습니다.',
  HARMFUL_OR_ILLEGAL_REQUEST: '유해하거나 불법적인 내용이 감지되어 제출이 차단되었습니다.',
  AUTOMATION_OR_PRIVILEGE_ABUSE: '권한 우회·자동화 남용 시도가 감지되어 관리자 검토가 필요합니다.',
};

const BLOCKING_ACTIONS = new Set(['BLOCK_INPUT', 'END_SESSION']);

export const categoryLabel = (c) => CATEGORY_LABEL[c] || c || '미상';
export const actionLabel = (a) => ACTION_LABEL[a] || a || '미상';
export const directionLabel = (d) => DIRECTION_LABEL[d] || d || '-';

export function isBlocking(action) {
  return BLOCKING_ACTIONS.has(action);
}

export function isSessionEnd(action) {
  return action === 'END_SESSION';
}

// BLOCK_INPUT은 입력만 차단 → 재답변 허용. END_SESSION만 재답변 불가.
export function retryAllowed(action) {
  return action !== 'END_SESSION';
}

export function guardrailUserMessage(g) {
  if (!g) return '';
  return REASON_LABEL[g.reason_code] || `${categoryLabel(g.category)} 관련 가드레일이 적용되었습니다.`;
}

// axios 에러 응답에서 guardrail 추출 (입력 차단 시 400 body 의 guardrail)
export function extractGuardrail(error) {
  return error?.response?.data?.guardrail ?? null;
}

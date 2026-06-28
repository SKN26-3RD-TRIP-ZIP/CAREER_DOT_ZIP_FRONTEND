// 포인트 표시용 순수 헬퍼. 백엔드 PointHistory 계약 기준.
// 적립/차감/환불 분류는 금액 부호가 아니라 transaction_type(EARN/USE/REFUND/EXPIRE/ADMIN)을 권위 기준으로 사용한다.

export const REASON_LABEL = {
  'JD.FIRST_CREATED': '첫 JD 등록',
  'RESUME.FIRST_CREATED': '첫 이력서 등록',
  'COVER_LETTER.FIRST_CREATED': '첫 자기소개서 등록',
  'PROJECT.FIRST_CREATED': '첫 프로젝트 등록',
  'PROJECT.ADDITIONAL': '추가 프로젝트 등록',
  'PROFILE.COMPLETED': '프로필 완성',
  'PROFILE.DESIRED_JOB_SET': '희망 직무 설정',
  'AUTH.EMAIL_VERIFIED': '이메일 인증 보상',
  'LOGIN.DAILY': '일일 로그인 보상',
  'DORMANT.RETURN_LOGIN': '휴면 복귀 보상',
  'QUESTION_PACK.CUSTOM': '맞춤 질문팩 생성',
  'INTERVIEW.COMPLETED': '면접 완료',
  'INTERVIEW.EXTRA_SESSION': '추가 면접 세션',
  'INTERVIEW.WEAKNESS_SESSION_COMPLETED': '약점 집중 연습 완료',
  'INTERVIEW.HINT': '면접 힌트 사용',
  'PRACTICE.WEAKNESS_FOCUS': '약점 집중 연습',
  'ACTION_PLAN.CREATED': '액션플랜 생성',
  'ACTION_PLAN.REGENERATE': '액션플랜 재생성',
  'ANSWER.REEVALUATION': '답변 재평가',
  'REPORT.FIRST_VIEWED': '첫 리포트 확인',
  'REPORT.DEEP_ANALYSIS': '심층 리포트 분석',
  'REPORT.GROWTH_COMPARE': '성장 비교',
  'REPORT.REFUND': '리포트 환불',
  'GITHUB.DEEP_ANALYSIS': 'GitHub 심층 분석',
  'PERSONA.ADVANCED': '고급 페르소나',
  'ADMIN.ADJUSTMENT': '관리자 조정',
  'ADMIN.SEED': '초기 지급',
};

export function reasonLabel(code) {
  return REASON_LABEL[code] || '기타 포인트 변경';
}

export const TRANSACTION_LABEL = {
  EARN: '적립',
  USE: '차감',
  REFUND: '환불',
  EXPIRE: '만료',
  ADMIN: '관리자 조정',
};

export function transactionLabel(t) {
  return TRANSACTION_LABEL[t] || t || '기타';
}

export function transactionKind(t) {
  switch (t) {
    case 'EARN': return 'earn';
    case 'USE': return 'use';
    case 'REFUND': return 'refund';
    case 'EXPIRE': return 'expire';
    case 'ADMIN': return 'admin';
    default: return 'other';
  }
}

export function formatAmount(amount) {
  if (amount === null || amount === undefined) return '-';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '-';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('ko-KR')}P`;
}

// 실제 잔액 0과 미제공(null)을 구분한다. (Number(null) 0 위장 금지)
export function formatBalance(value) {
  if (value === null || value === undefined) return '미제공';
  const n = Number(value);
  if (!Number.isFinite(n)) return '미제공';
  return `${n.toLocaleString('ko-KR')}P`;
}

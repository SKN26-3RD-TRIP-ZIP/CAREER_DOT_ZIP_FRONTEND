// 질문팩 표시용 순수 헬퍼 (백엔드 실제 필드 기준: interview_type/questions/status/is_fallback)

export const INTERVIEW_TYPE_LABEL = {
  technical: '기술',
  personality: '인성',
  comprehensive: '종합',
};

export function interviewTypeLabel(type) {
  return INTERVIEW_TYPE_LABEL[type] || type || '기타';
}

// 질문 수: questions 배열 길이 (없으면 0). 실제 0과 누락을 구분하지 않고 길이만 사용.
export function packQuestionCount(pack) {
  return Array.isArray(pack?.questions) ? pack.questions.length : 0;
}

export const PACK_STATUS_LABEL = {
  ready: '사용 가능',
  active: '사용 가능',
  generating: '생성 중',
  failed: '생성 실패',
};

export function packStatusLabel(status) {
  return PACK_STATUS_LABEL[status] || status || '상태 미상';
}

// 적용 가능 여부: 생성 완료 + 질문 존재
export function isPackApplicable(pack) {
  const status = pack?.status;
  const blocked = status === 'generating' || status === 'failed';
  return !blocked && packQuestionCount(pack) > 0;
}

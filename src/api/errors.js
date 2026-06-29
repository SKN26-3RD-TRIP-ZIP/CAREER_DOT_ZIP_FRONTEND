/**
 * 백엔드 error code / HTTP status → 사용자 메시지 변환 (단일 출처).
 *
 * 백엔드는 대부분 { detail, code } 또는 { error, message } 형태로 응답한다.
 * 화면에서는 raw detail 을 그대로 노출하기보다 코드 기반 한글 메시지를 우선한다.
 */

// 코드 → 메시지 (백엔드 views 의 code 문자열과 일치)
const CODE_MESSAGES = {
  // auth / verify
  EMAIL_ALREADY_REGISTERED: '이미 가입된 이메일입니다.',
  ACCOUNT_BANNED: '이용이 제한된 계정입니다. 관리자에게 문의해주세요.',
  EMAIL_SEND_FAILED: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  VERIFY_CODE_INVALID: '인증번호가 올바르지 않습니다.',
  VERIFY_CODE_EXPIRED: '인증번호가 만료되었습니다. 인증번호를 재전송해 주세요.',
  VERIFY_TOO_MANY_ATTEMPTS: '인증 시도 횟수를 초과했습니다. 인증번호를 재전송해 주세요.',
  RESEND_COOLDOWN: '잠시 후 다시 시도해 주세요.',
  PENDING_REGISTRATION_NOT_FOUND: '인증 대기 중인 가입 요청을 찾을 수 없습니다.',
  REGISTRATION_ALREADY_VERIFIED: '이미 인증이 완료된 가입 요청입니다.',
  // oauth
  OAUTH_PROVIDER_NOT_CONFIGURED: '소셜 로그인이 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.',
  OAUTH_STATE_INVALID: '로그인 요청이 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.',
  OAUTH_ACCOUNT_BLOCKED: '이 계정으로는 소셜 로그인을 할 수 없습니다. (탈퇴/정지 계정)',
  OAUTH_EMAIL_REQUIRED: '이메일 제공에 동의해야 가입할 수 있습니다. 동의 후 다시 시도해 주세요.',
  OAUTH_PROVIDER_ERROR: '소셜 로그인 제공자에서 오류가 발생했습니다. 다시 시도해 주세요.',
  OAUTH_CALLBACK_INVALID: '소셜 로그인 응답이 올바르지 않습니다. 다시 시도해 주세요.',
  // points
  INSUFFICIENT_POINTS: '포인트 잔액이 부족합니다.',
  DUPLICATE_REQUEST: '이미 처리 중인 요청입니다. 잠시 후 다시 시도해 주세요.',
  INVALID_FILE_TYPE: 'PDF 또는 DOCX 파일만 업로드할 수 있습니다.',
  INVALID_FILE_SIGNATURE: '파일 형식이 올바르지 않습니다. PDF 또는 DOCX 파일인지 확인해 주세요.',
  FILE_EMPTY: '내용이 없는 파일은 업로드할 수 없습니다.',
  FILE_TOO_LARGE: '파일은 최대 10MB까지 업로드할 수 있습니다.',
  DOCUMENT_CORRUPTED: '파일이 손상되어 내용을 읽을 수 없습니다.',
  DOCUMENT_ENCRYPTED: '암호가 설정된 PDF는 사용할 수 없습니다. 암호를 해제한 뒤 다시 업로드해 주세요.',
  DOCUMENT_MACRO_DETECTED: '매크로가 포함된 DOCX 파일은 업로드할 수 없습니다.',
  TEXT_EXTRACTION_FAILED: '문서에서 텍스트를 추출하지 못했습니다.',
  DOCUMENT_TOO_SHORT: '분석하기에 문서 내용이 너무 짧습니다. 내용을 확인한 후 다시 업로드해 주세요.',
  DOCUMENT_TYPE_MISMATCH: '선택한 문서 종류와 실제 문서 내용이 일치하지 않습니다.',
  DOCUMENT_NOT_RELEVANT: '면접 준비에 사용할 수 없는 문서입니다.',
  UNSAFE_DOCUMENT_CONTENT: '문서에서 처리할 수 없는 명령성 내용이 발견되었습니다.',
  OCR_NOT_SUPPORTED: '이미지로만 구성된 문서는 현재 지원하지 않습니다. 텍스트가 포함된 PDF 또는 DOCX를 업로드해 주세요.',
};

// HTTP status → 기본 메시지 (코드 매칭 실패 시 fallback)
const STATUS_MESSAGES = {
  400: '입력값을 확인해 주세요.',
  401: '로그인이 필요합니다. 다시 로그인해 주세요.',
  403: '접근 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '요청이 현재 상태와 충돌합니다. 새로고침 후 다시 시도해 주세요.',
  422: '입력값을 처리할 수 없습니다. 형식을 확인해 주세요.',
  429: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  503: '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
};

export function getErrorCode(err) {
  return err?.response?.data?.error_code || err?.response?.data?.code || null;
}

export function getErrorStatus(err) {
  return err?.response?.status ?? null;
}

/** ENV 미설정(503 + status:ENV_REQUIRED) 응답인지 판별 — 외부 Provider Key 부재 */
export function isEnvRequired(err) {
  const data = err?.response?.data;
  return (
    getErrorStatus(err) === 503 &&
    (data?.status === 'ENV_REQUIRED' || data?.code === 'OAUTH_PROVIDER_NOT_CONFIGURED')
  );
}

/** 네트워크/서버 미응답 여부 */
export function isNetworkError(err) {
  return Boolean(err && !err.response);
}

/**
 * 사용자에게 보여줄 메시지를 만든다.
 * 우선순위: code 매핑 → status 매핑 → 서버 detail/message → 기본 문구
 */
export function toUserMessage(err, fallback = '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.') {
  if (isNetworkError(err)) {
    return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.';
  }
  const code = getErrorCode(err);
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  const status = getErrorStatus(err);
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  const data = err?.response?.data;
  const serverMsg = data?.message || (typeof data?.detail === 'string' ? data.detail : '') || data?.error;
  if (typeof serverMsg === 'string' && serverMsg) return serverMsg;

  return fallback;
}

export default { toUserMessage, getErrorCode, getErrorStatus, isEnvRequired, isNetworkError };

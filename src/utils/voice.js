// 음성(STT/TTS) 표시·상태 순수 헬퍼. 백엔드 whisper_stt_service 계약 기준.
// 서버 Whisper STT(POST /stt/transcribe, field 'audio', webm)가 우선, Web Speech는 fallback.
// FE는 STT 결과를 자동 제출하지 않는다(사용자 확인·수정 후 제출).

const STT_CODE_MESSAGE = {
  stt_answer_too_short: '답변이 너무 짧아 다시 녹음이 필요합니다. 질문에 대해 한두 문장 이상으로 답변해 주세요.',
  audio_too_large: '녹음 파일이 너무 큽니다. 더 짧게 녹음해 주세요.',
  whisper_stt_failed: '음성 변환 서버 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  whisper_stt_timeout: '음성 변환이 지연되어 시간이 초과됐습니다. 다시 시도해 주세요.',
};

// 서버 Whisper는 OPENAI_API_KEY 미설정 시 500 + detail 로 응답한다(실 Provider 키 부재).
const MIN_STT_TEXT_CHARS = 5;
const MIN_STT_WORD_COUNT = 2;
const MIN_STT_SPEECH_DURATION_SEC = 1.0;

export function isSttEnvRequired(error) {
  const data = error?.response?.data || {};
  const detail = typeof data.detail === 'string' ? data.detail : '';
  return /OPENAI_API_KEY/i.test(detail) || data.status === 'ENV_REQUIRED';
}

export function sttErrorMessage(error) {
  if (!error?.response) return '네트워크 오류로 음성을 변환하지 못했습니다. 연결을 확인해 주세요.';
  const statusCode = error.response.status;
  const data = error.response.data || {};
  if (isSttEnvRequired(error)) return '음성 변환 Provider가 설정되어 있지 않습니다. 텍스트로 답변을 입력해 주세요.';
  if (data.code && STT_CODE_MESSAGE[data.code]) return STT_CODE_MESSAGE[data.code];
  if (statusCode === 413) return STT_CODE_MESSAGE.audio_too_large;
  if (statusCode === 504) return STT_CODE_MESSAGE.whisper_stt_timeout;
  if (statusCode === 502) return STT_CODE_MESSAGE.whisper_stt_failed;
  if (statusCode === 400) {
    const a = data.audio;
    const msg = Array.isArray(a) ? String(a[0] || '') : typeof a === 'string' ? a : '';
    if (/webm/i.test(msg)) return '지원하지 않는 오디오 형식입니다. (webm 만 지원)';
    if (/empty/i.test(msg)) return '녹음된 음성이 없습니다. 다시 녹음해 주세요.';
    if (/required/i.test(msg)) return '녹음 파일이 없습니다. 다시 녹음해 주세요.';
    return msg || '녹음 데이터를 확인해 주세요.';
  }
  if (statusCode === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  return '음성을 변환하지 못했습니다. 다시 시도해 주세요.';
}

export function isEmptyTranscript(text) {
  return !text || !String(text).trim();
}

export function validateSttAnswerQuality({ text, speechDuration } = {}) {
  const normalizedText = String(text || '').trim();
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
  const duration = speechDuration == null || speechDuration === ''
    ? null
    : Number(speechDuration);
  const reasons = [];

  if (!normalizedText) reasons.push('empty_text');
  if (normalizedText.length < MIN_STT_TEXT_CHARS) reasons.push('text_too_short');
  if (wordCount < MIN_STT_WORD_COUNT) reasons.push('word_count_too_low');
  if (Number.isFinite(duration) && duration < MIN_STT_SPEECH_DURATION_SEC) {
    reasons.push('speech_duration_too_short');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    message: STT_CODE_MESSAGE.stt_answer_too_short,
    metrics: {
      textLength: normalizedText.length,
      wordCount,
      speechDuration: Number.isFinite(duration) ? duration : null
    }
  };
}

export function isSupportedAudioMime(type) {
  return (type || '').toLowerCase().startsWith('audio/webm');
}

// getUserMedia 오류 → 사용자 문구
export function mediaErrorMessage(err) {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return '사용 가능한 마이크를 찾을 수 없습니다.';
  if (name === 'NotReadableError') return '마이크에 접근할 수 없습니다. 다른 앱이 사용 중인지 확인해 주세요.';
  return '마이크를 시작할 수 없습니다. 권한과 장치를 확인해 주세요.';
}

export function browserSupportsRecording() {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

// ── STT·TTS 상호 배제 상태 규칙 ──────────────────────────────
export function canStartRecording({ recording, uploading } = {}) {
  return !recording && !uploading;
}
export function shouldStopTtsOnRecordStart(isSpeaking) {
  return Boolean(isSpeaking);
}
export function canPlayTts({ recording, uploading } = {}) {
  return !recording && !uploading;
}
export function canSubmitAnswer({ recording, uploading } = {}) {
  // 녹음/업로드 중에는 제출 금지
  return !recording && !uploading;
}
// 질문 전환 시 초기화할 음성 상태
export function questionChangeResetState() {
  return { recording: false, uploading: false, transcript: '', error: '', isSpeaking: false };
}

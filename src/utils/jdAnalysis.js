// JD URL 분석 / OCR 업로드 표시·검증용 순수 헬퍼. 백엔드 실제 계약(jd_url_analyzer, ocr_service) 기준.

const URL_ERROR = {
  URL_REQUIRED: 'URL을 입력해 주세요.',
  JD_URL_BLOCKED: '분석할 수 없는 URL입니다. (localhost·내부 주소, 허용되지 않는 형식/스킴, 지원하지 않는 콘텐츠, 크기 초과)',
  JD_URL_FETCH_FAILED: '페이지를 불러오지 못했습니다. (응답 시간 초과 또는 접근 실패)',
  JD_URL_ANALYSIS_FAILED: '채용공고 내용을 추출하지 못했습니다.',
};

export function urlAnalysisErrorMessage(error) {
  const code = error?.response?.data?.code;
  return URL_ERROR[code] || URL_ERROR.JD_URL_ANALYSIS_FAILED;
}

export function isLikelyHttpUrl(value) {
  const v = (value || '').trim();
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    return Boolean(new URL(v).hostname);
  } catch {
    return false;
  }
}

// 백엔드 ocr_service 기준값
export const OCR_MAX_BYTES = 10 * 1024 * 1024;
export const OCR_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
export const OCR_MIME = ['application/pdf', 'image/png', 'image/jpeg'];

export function validateOcrFile(file) {
  if (!file) return { ok: false, error: '이미지 또는 PDF 파일을 선택해 주세요.' };
  const name = file.name || '';
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  if (!OCR_EXTENSIONS.includes(ext)) return { ok: false, error: 'PNG, JPG, JPEG, PDF 파일만 지원합니다.' };
  const type = (file.type || '').toLowerCase();
  if (type && !OCR_MIME.includes(type)) return { ok: false, error: '지원하지 않는 파일 형식(MIME)입니다.' };
  const size = file.size || 0;
  if (size <= 0) return { ok: false, error: '빈 파일입니다.' };
  if (size > OCR_MAX_BYTES) return { ok: false, error: '파일 크기가 10MB를 초과했습니다.' };
  return { ok: true, error: '' };
}

export function isOcrEnvRequired(error) {
  const data = error?.response?.data;
  return data?.code === 'OCR_PROVIDER_NOT_CONFIGURED' || data?.status === 'ENV_REQUIRED';
}

export function ocrErrorMessage(error) {
  const data = error?.response?.data || {};
  if (isOcrEnvRequired(error)) return '이미지 OCR Provider가 설정되어 있지 않습니다. (서비스 환경 설정 필요)';
  if (data.code === 'OCR_GUARDRAIL_BLOCKED') return '업로드한 이미지에서 민감하거나 안전하지 않은 내용이 감지되어 처리할 수 없습니다.';
  if (data.code === 'OCR_PROVIDER_FAILED') return '이미지에서 텍스트를 추출하지 못했습니다. 더 선명한 파일로 다시 시도해 주세요.';
  const fileErr = data.file;
  if (typeof fileErr === 'string') return fileErr;
  if (Array.isArray(fileErr) && fileErr.length) return String(fileErr[0]);
  return 'OCR 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

// confidence 표시: 실제 0과 null/미상을 구분한다 (Number(null) 0 위장 금지).
export function confidenceText(conf) {
  if (conf === null || conf === undefined) return '미상';
  const n = Number(conf);
  if (!Number.isFinite(n)) return '미상';
  return `${Math.round(n * 100)}%`;
}

// 생성된 JD 응답 → 화면 표시 모델 (백엔드 제공 필드만 사용, 허위 채움 금지)
export function jdFieldsFromResponse(jd) {
  const ef = (jd && jd.extracted_fields) || {};
  const techStacks = Array.isArray(ef.tech_stacks)
    ? ef.tech_stacks
    : jd?.keywords
      ? String(jd.keywords).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  return {
    jdId: jd?.jd_id ?? jd?.id ?? null,
    company: jd?.company_name ?? ef.company_name ?? '',
    position: jd?.position ?? ef.position ?? '',
    mainTasks: ef.main_tasks ?? '',
    requirements: jd?.job_requirements ?? ef.requirements ?? '',
    preferences: ef.preferences ?? '',
    techStacks,
    sourceUrl: jd?.source_url ?? ef.source_url ?? '',
    fetchedAt: jd?.source_fetched_at ?? null,
    confidence: jd?.extraction_confidence ?? ef.confidence ?? null,
    requiresUserConfirmation: Boolean(jd?.requires_user_confirmation),
    ocrProvider: jd?.ocr_provider ?? null,
  };
}

// 수정 폼 → PATCH body (백엔드 허용 필드만: company_name/position/job_requirements/keywords).
// 전달된 키만 포함(부분 수정). keywords 배열은 콤마 문자열로 직렬화.
export function buildJdPatchBody(form) {
  const body = {};
  if (form && 'company' in form) body.company_name = form.company;
  if (form && 'position' in form) body.position = form.position;
  if (form && 'requirements' in form) body.job_requirements = form.requirements;
  if (form && 'keywords' in form) {
    body.keywords = Array.isArray(form.keywords) ? form.keywords.join(', ') : form.keywords;
  }
  return body;
}

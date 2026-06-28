import axiosInstance from './axiosInstance';

// JD URL 분석 (백엔드: POST /api/v1/jds/analyze-url). 성공 시 JD 생성(201) + 추출 필드 반환.
// company_name/position 은 사용자가 미리 보정할 수 있는 override (백엔드가 수용).
export const analyzeJobUrl = ({ url, company_name, position }) =>
  axiosInstance.post('/jds/analyze-url', {
    url,
    ...(company_name ? { company_name } : {}),
    ...(position ? { position } : {}),
  });

// JD OCR 업로드 (백엔드: POST /api/v1/jds/ocr, multipart field 'file'). 성공 시 JD 생성(201).
export const ocrUploadJd = (file, { company_name, position } = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (company_name) form.append('company_name', company_name);
  if (position) form.append('position', position);
  return axiosInstance.post('/jds/ocr', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 생성된 JD의 수정 가능 필드 부분 수정 (백엔드: PATCH /api/v1/jds/{id}). 본인 JD만, 허용 필드만.
export const updateJd = (jdId, fields) => axiosInstance.patch(`/jds/${jdId}`, fields);

export default { analyzeJobUrl, ocrUploadJd, updateJd };
